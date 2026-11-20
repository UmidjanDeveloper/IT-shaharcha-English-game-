// Speech-to-text for the Speaking exam and the AI teacher (English and Uzbek).
// The browser sends the raw recording; the OpenAI key never leaves the server.
import { clientIp, quota, settings } from './tutor.js';

const maxBytes = 4_000_000;
const types = { webm: 'audio/webm', ogg: 'audio/ogg', mp4: 'audio/mp4', m4a: 'audio/mp4', wav: 'audio/wav', mp3: 'audio/mpeg' };

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('size'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Turns token log-probabilities into words the recogniser was unsure about.
export function unclearWords(logprobs = [], threshold = 0.55) {
  const words = [];
  let word = '', worst = 0;
  const flush = () => {
    const clean = word.trim().replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '');
    if (clean.length > 2 && Math.exp(worst) < threshold) words.push(clean);
    word = ''; worst = 0;
  };
  for (const { token = '', logprob = 0 } of logprobs) {
    if (/^\s/.test(token) && word) flush();
    word += token;
    worst = Math.min(worst, logprob);
  }
  if (word) flush();
  return [...new Set(words)].slice(0, 30);
}

export function createTranscriber(env, request = fetch) {
  return async (req, res) => {
    const json = (status, data) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(data));
    };
    const config = settings(env);
    if (req.method !== 'POST') return json(405, { error: 'method' });
    if (!config.openai) return json(503, { error: 'unconfigured' });
    if (config.code && req.headers['x-club-code'] !== config.code) return json(401, { error: 'code' });
    const url = new URL(req.url ?? '/', 'http://local');
    const language = url.searchParams.get('lang') === 'uz' ? 'uz' : 'en';
    const kind = types[url.searchParams.get('type') ?? 'webm'] ? url.searchParams.get('type') ?? 'webm' : 'webm';
    if (!quota(clientIp(env, req), config.limit)) return json(429, { error: 'limit' });
    let audio;
    try { audio = await readBody(req); } catch (error) { return json(error.status ?? 400, { error: 'body' }); }
    if (audio.length < 800) return json(400, { error: 'short' });
    if (audio.length > maxBytes) return json(413, { error: 'size' });

    const prompt = language === 'en'
      ? 'IELTS speaking candidate from Uzbekistan. Transcribe verbatim, keeping fillers (um, uh, er), repetitions, false starts and grammar mistakes exactly as spoken. Do not correct anything.'
      : 'O‘zbek tilida gapirilgan, ba’zan inglizcha so‘zlar aralash. Lotin yozuvida yozing.';
    for (const model of config.transcribe) {
      const form = new FormData();
      form.append('file', new Blob([audio], { type: types[kind] }), 'answer.' + kind);
      form.append('model', model);
      form.append('language', language);
      form.append('prompt', prompt);
      form.append('response_format', 'json');
      if (model.startsWith('gpt-4o')) form.append('include[]', 'logprobs');
      try {
        const upstream = await request('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST', body: form, signal: AbortSignal.timeout(45000),
          headers: { Authorization: 'Bearer ' + env.OPENAI_API_KEY },
        });
        if (upstream.ok) {
          const data = await upstream.json();
          return json(200, { text: String(data.text ?? '').trim(), unclear: unclearWords(data.logprobs), model });
        }
        if (![400, 403, 404].includes(upstream.status)) return json(502, { error: 'provider', status: upstream.status });
      } catch {
        return json(502, { error: 'provider' });
      }
    }
    return json(502, { error: 'provider' });
  };
}

export default createTranscriber(process.env);
