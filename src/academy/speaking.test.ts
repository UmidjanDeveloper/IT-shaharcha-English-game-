import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyseSpeaking, speakingPrompts } from './speaking';

test('transcript feedback handles curly apostrophes and common grammar errors', () => {
  const result = analyseSpeaking('Um, I am agree. She doesn’t mind, but he don’t like it.');
  assert.deepEqual(result.errors.map(({ phrase }) => phrase), ['I am agree', "he don't"]);
  assert.equal(result.fillers, 1);
  assert.equal(result.words, 12);
});

test('correct alternatives and filler substrings do not trigger feedback', () => {
  const result = analyseSpeaking('I agree that summer is a better time to practise.');
  assert.equal(result.fillers, 0);
  assert.deepEqual(result.errors, []);
});

test('IELTS prompts cover all speaking parts and only Part 2 has a preparation timer', () => {
  const prompts = speakingPrompts.ielts;
  assert.deepEqual([...new Set(prompts.map(prompt => prompt.section))], ['Part 1', 'Part 2', 'Part 3']);
  assert.ok(prompts.every(prompt => prompt.preparation === (prompt.section === 'Part 2' ? 60 : undefined)));
});
