import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writings } from './lessons';
import { scoreWriting } from './scoring';

test('every model answer earns all points without flagging its wording', () => {
  for (const tasks of Object.values(writings)) {
    for (const task of tasks) {
      const result = scoreWriting(task.model, task);
      assert.equal(result.score, 10, task.title);
      assert.deepEqual(result.errors, [], task.title);
    }
  }
});

test('a valid alternative translation can earn all points', () => {
  const result = scoreWriting('I have not completed my homework yet.', writings.intermediate[0]);
  assert.equal(result.score, 10);
});

test('feedback identifies an incorrect verb form and time expression', () => {
  const result = scoreWriting('My sister read book everyday.', writings.beginner[0]);
  assert.equal(result.score, 0);
  assert.deepEqual(result.errors.map(error => error.phrase), ['sister read', 'everyday']);
});

test('a chart answer with exchanged values loses both data points', () => {
  const result = scoreWriting(
    'The percentage of students cycling rose from 35% in 2018 to 20% in 2024.',
    writings.ielts[0],
  );
  assert.equal(result.score, 5);
  assert.deepEqual(result.criteria.slice(-2).map(criterion => criterion.passed), [false, false]);
});

test('a percent change is flagged where percentage points are expected', () => {
  const result = scoreWriting(
    'The proportion of students cycling rose by 15% from 20% in 2018 to 35% in 2024.',
    writings.ielts[0],
  );
  assert.equal(result.score, 8);
  assert.equal(result.errors[0].phrase, 'by 15%');
});
