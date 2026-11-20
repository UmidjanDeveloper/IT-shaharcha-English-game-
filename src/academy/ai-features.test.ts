import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTutor, DEFAULT_VOICES, settings } from '../../api/tutor.js';
import { createTranscriber, unclearWords } from '../../api/transcribe.js';
import { pauseStats } from './ielts/recorder';
import { overallBand, cueCards, part1Topics } from './ielts/questionBank';
import { buildSteps } from './ielts/SpeakingExam';
import { estimateBands, wordsPerMinute } from './ielts/speakingScore';
import { allItems, checkOrder, cefrLevels, grammar } from './grammar/curriculum';
import { isExternal } from './ClassLock';
import { offlineAnswer } from './AiTeacher';

type Res = { statusCode: number; headers: Record<string, string>; body: unknown; setHeader(k: string, v: string): void; end(b?: unknown): void };
function response(): Res {
  return { statusCode: 200, headers: {}, body: undefined, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { this.body = b; } };
}
const post = (body: unknown, headers: Record<string, string> = {}) => ({ method: 'POST', url: '/api/tutor', headers: { 'content-type': 'application/json', ...headers }, body, socket: { remoteAddress: '10.0.0.' + Math.random() } });
const okResponse = (payload: unknown) => new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
const parse = (res: Res) => JSON.parse(String(res.body));

test('capabilities report what is configured without exposing keys', async () => {
  const res = response();
  await createTutor({ OPENAI_API_KEY: 'sk-test' }, async () => okResponse({}))({ method: 'GET', url: '/api/tutor', headers: {} }, res);
  const data = parse(res);
  assert.equal(data.chat, true);
  assert.equal(data.voice, false);
  assert.ok(!String(res.body).includes('sk-test'));
});

test('voice uses language-specific ElevenLabs voice and model', async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const fake = async (url: string, init: RequestInit) => { calls.push({ url, body: JSON.parse(String(init.body)) }); return new Response(new Uint8Array([1, 2, 3]), { status: 200 }); };
  const env = { ELEVENLABS_API_KEY: 'el', ELEVENLABS_VOICE_ID_UZ: 'uz-voice' };
  for (const language of ['en', 'uz']) await createTutor(env, fake)(post({ action: 'voice', language, text: 'Salom' }), response());
  assert.ok(calls[0].url.includes(DEFAULT_VOICES.en));
  assert.equal(calls[0].body.model_id, 'eleven_multilingual_v2');
  assert.ok(calls[1].url.includes('uz-voice'));
  assert.equal(calls[1].body.model_id, 'eleven_v3');
  assert.equal(calls[1].body.language_code, 'uz');
});

test('chat falls back to the next model when one is unavailable', async () => {
  const models: string[] = [];
  const fake = async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    models.push(body.model);
    if (models.length === 1) return new Response('{"error":{"code":"model_not_found","message":"The model does not exist"}}', { status: 404 });
    return okResponse({ output: [{ content: [{ type: 'output_text', text: 'Present Perfect = have + V3' }] }] });
  };
  const res = response();
  await createTutor({ OPENAI_API_KEY: 'k', OPENAI_MODEL: 'missing-model' }, fake)(post({ action: 'chat', language: 'uz', level: 'B1', messages: [{ role: 'user', content: 'Present perfect nima?' }] }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(models, ['missing-model', 'gpt-5.4-mini']);
  assert.equal(parse(res).reply, 'Present Perfect = have + V3');
});

test('speaking assessment requests strict JSON and returns the report', async () => {
  let sent: Record<string, any> = {};
  const report = { overall: 6, fluency: 6, lexical: 6, grammar: 5.5, pronunciation: 6, summary: 's', criteria: { fluency: '', lexical: '', grammar: '', pronunciation: '' }, answers: [], plan: [] };
  const fake = async (_url: string, init: RequestInit) => { sent = JSON.parse(String(init.body)); return okResponse({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(report) }] }] }); };
  const res = response();
  await createTutor({ OPENAI_API_KEY: 'k' }, fake)(post({ action: 'assess', language: 'uz', answers: [{ part: 'Part 1', question: 'Do you like music?', transcript: 'Yes I like music because it relaxes me.', seconds: 6 }] }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(sent.text.format.type, 'json_schema');
  assert.equal(sent.text.format.strict, true);
  assert.equal(parse(res).grammar, 5.5);
});

test('invalid input, missing keys, and club code are rejected', async () => {
  const tutor = createTutor({ OPENAI_API_KEY: 'k', CLUB_ACCESS_CODE: '1234' }, async () => okResponse({}));
  let res = response(); await tutor(post({ action: 'chat', language: 'uz', messages: [] }, { 'x-club-code': '1234' }), res);
  assert.equal(res.statusCode, 400);
  res = response(); await tutor(post({ action: 'chat', language: 'uz', messages: [{ role: 'user', content: 'hi' }] }), res);
  assert.equal(res.statusCode, 401);
  res = response(); await createTutor({}, async () => okResponse({}))(post({ action: 'voice', language: 'en', text: 'hi' }), res);
  assert.equal(res.statusCode, 503);
  res = response(); await tutor(post({ action: 'chat', language: 'ru', messages: [{ role: 'user', content: 'hi' }] }, { 'x-club-code': '1234' }), res);
  assert.equal(res.statusCode, 400);
});

test('settings default to public voices and allow overrides', () => {
  assert.equal(settings({}).voices.en, DEFAULT_VOICES.en);
  assert.equal(settings({ ELEVENLABS_VOICE_ID: 'x' }).voices.uz, 'x');
  assert.deepEqual(settings({}).transcribe, ['gpt-4o-mini-transcribe', 'whisper-1']);
});

test('transcriber forwards audio with language and logprobs, then flags unclear words', async () => {
  let form: FormData | undefined;
  const fake = async (_url: string, init: RequestInit) => { form = init.body as FormData; return okResponse({ text: 'I like the weather', logprobs: [{ token: 'I', logprob: -0.01 }, { token: ' like', logprob: -0.02 }, { token: ' the', logprob: -0.1 }, { token: ' wea', logprob: -1.5 }, { token: 'ther', logprob: -0.2 }] }); };
  const res = response();
  await createTranscriber({ OPENAI_API_KEY: 'k' }, fake)({ method: 'POST', url: '/api/transcribe?lang=uz&type=webm', headers: {}, body: Buffer.alloc(2000), socket: { remoteAddress: '1.1.1.1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(form?.get('language'), 'uz');
  assert.equal(form?.get('include[]'), 'logprobs');
  assert.deepEqual(parse(res).unclear, ['weather']);
  assert.deepEqual(unclearWords([]), []);
});

test('pause statistics ignore leading and trailing silence', () => {
  const frames = [false, false, true, true, ...Array(12).fill(false), true, ...Array(3).fill(false), true, false, false];
  assert.deepEqual(pauseStats(frames, 0.1), { pauses: 1, longestPause: 1.2, speakingSeconds: 0 });
  assert.deepEqual(pauseStats([false, false], 0.1), { pauses: 0, longestPause: 0, speakingSeconds: 0 });
});

test('overall band follows the IELTS half-band rounding rule', () => {
  assert.equal(overallBand([6, 6, 6, 6.5]), 6);       // 6.125
  assert.equal(overallBand([6, 6.5, 6, 6.5]), 6.5);   // 6.25
  assert.equal(overallBand([7, 7, 7, 6.5]), 7);       // 6.875
  assert.equal(overallBand([5.5, 6, 6, 6]), 6);       // 5.875
});

test('a full mock follows the real exam order and timing', () => {
  const steps = buildSteps({ mode: 'full' });
  const parts = steps.map(s => s.part);
  assert.equal(parts[0], 'Intro');
  assert.equal(parts.at(-1), 'End');
  assert.ok(parts.indexOf('Part 2') > parts.lastIndexOf('Part 1'));
  assert.ok(parts.indexOf('Part 3') > parts.lastIndexOf('Part 2'));
  assert.equal(steps.find(s => s.prep)?.prep, 60);
  assert.equal(steps.find(s => s.limit === 120)?.part, 'Part 2');
  assert.ok(parts.filter(p => p === 'Part 1').length >= 9);
});

test('question bank and grammar course are complete and answerable', () => {
  assert.ok(part1Topics.length >= 20 && cueCards.length >= 20);
  cueCards.forEach(c => { assert.equal(c.cues.length, 4); assert.equal(c.part3.questions.length, 4); });
  cefrLevels.forEach(l => assert.ok(grammar[l].length >= 6));
  for (const item of allItems()) {
    if (item.kind === 'order') assert.ok(checkOrder(item.sentence.split(' '), item.sentence));
    else { assert.ok(item.answer >= 0 && item.answer < item.options.length, item.prompt); assert.equal(new Set(item.options).size, item.options.length, item.prompt); }
  }
  assert.ok(checkOrder(['I', 'like', 'tea'], 'I like tea.'));
  assert.ok(!checkOrder(['tea', 'like', 'I'], 'I like tea.'));
});

test('fluency evidence and offline estimate behave sensibly', () => {
  assert.equal(wordsPerMinute('one two three four', 2), 120);
  const short = estimateBands([{ part: 'Part 1', question: 'q', transcript: 'Yes.', seconds: 3, pauses: 0, longestPause: 0, unclear: [] }]);
  const long = estimateBands([{ part: 'Part 3', question: 'q', transcript: 'I think public transport matters because it reduces traffic. For example, in Tashkent the metro has grown, whereas buses have become less popular. However, some people still prefer cars since they are more comfortable.', seconds: 22, pauses: 1, longestPause: 1.2, unclear: [] }]);
  assert.ok(long.overall > short.overall);
});

test('class lock treats other origins as external and the offline teacher answers grammar questions', () => {
  assert.ok(isExternal('https://example.com/x', 'https://club.uz'));
  assert.ok(!isExternal('/mentor/CREDITS.txt', 'https://club.uz'));
  assert.match(offlineAnswer('Passive voice qanday?'), /Passive voice/);
});

test('class lock always has an end time so a forgotten PIN cannot lock a computer forever', async () => {
  const { lockRemaining, lockDurations } = await import('./ClassLock');
  const now = 1_000_000;
  assert.equal(lockRemaining(now, ''), 0);
  assert.equal(lockRemaining(now, '1'), 0);               // old "locked forever" flag is ignored
  assert.equal(lockRemaining(now, String(now + 60_000)), 60_000);
  assert.equal(lockRemaining(now, String(now - 1)), 0);
  assert.ok(lockDurations.every(([m]) => m <= 480));
});

test('Headway path covers Beginner to Advanced in book order with valid lessons', async () => {
  const { headway, topicById, levelItems, startingBook } = await import('./grammar/headway');
  assert.deepEqual(headway.map(b => b.title), ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced']);
  for (const book of headway) {
    assert.ok(book.lessons.length >= 12, book.title);
    const units = book.lessons.map(l => l.unit).filter((u): u is number => u !== undefined);
    assert.deepEqual(units, [...units].sort((a, b) => a - b), `${book.title}: units in book order`);
    for (const lesson of book.lessons) {
      const topic = topicById(lesson.topic);
      assert.ok(topic, `${book.title}: missing topic ${lesson.topic}`);
      assert.ok(topic.examples.length >= 2 && topic.items.length >= 5, topic.id);
    }
    assert.ok(levelItems(book.id).length >= 50, `${book.title} has enough game items`);
  }
  for (const item of headway.flatMap(b => b.lessons.flatMap(l => topicById(l.topic).items))) {
    if (item.kind === 'order') assert.ok(checkOrder(item.sentence.split(' '), item.sentence));
    else { assert.ok(item.answer >= 0 && item.answer < item.options.length, item.prompt); assert.equal(new Set(item.options).size, item.options.length, item.prompt); }
  }
  assert.equal(startingBook('beginner'), 'beginner');
  assert.equal(startingBook('ielts'), 'upper-intermediate');
});

test('listen-and-repeat marks the words the learner said, in order', async () => {
  const { compareSpoken } = await import('./grammar/RepeatAfterMe');
  assert.equal(compareSpoken('I have lost my keys.', 'I have lost my keys').score, 100);
  const partial = compareSpoken('She has a small cat.', 'she has cat');
  assert.deepEqual(partial.words.map(w => w.ok), [true, true, false, false, true]);
  assert.equal(partial.score, 60);
  assert.equal(compareSpoken('Hello', '').score, 0);
});

test('listen-and-repeat accepts expanded contractions', async () => {
  const { compareSpoken } = await import('./grammar/RepeatAfterMe');
  assert.equal(compareSpoken('Hello, I’m Malika.', 'hello I am Malika').score, 100);
  assert.equal(compareSpoken("She doesn't like coffee.", 'she does not like coffee').score, 100);
  assert.equal(compareSpoken('I can’t swim.', 'I cannot swim').score, 100);
});
