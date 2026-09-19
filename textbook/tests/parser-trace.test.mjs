import test from 'node:test';
import assert from 'node:assert/strict';
import {buildParserTrace, traceTokens} from '../parser-trace-model.mjs';

test('全トークンを１回ずつ読み、掛け算を右部分木にする', () => {
  const steps = buildParserTrace();
  const consumed = [];
  for (let i = 1; i < steps.length; i++) {
    const delta = steps[i].cursor - steps[i - 1].cursor;
    if (['number', 'operator'].includes(steps[i].kind)) {
      assert.equal(delta, 1);
      consumed.push(traceTokens[steps[i - 1].cursor]);
    } else assert.equal(delta, 0);
  }
  assert.deepEqual(consumed, ['8', '+', '3', '*', '2']);
  const final = steps.at(-1);
  const shape = node => node.left ? [node.value, shape(node.left), shape(node.right)] : node.value;
  assert.deepEqual(shape(final.forest[0]), ['+', '8', ['*', '3', '2']]);
  assert.equal(final.cursor, 5);
  assert.deepEqual(final.frames, []);
});

test('mulは＋を残して戻り、呼び出し元のexprがそれを読む', () => {
  const steps = buildParserTrace();
  const stopped = steps.findIndex(s => s.kind === 'stop' && s.frames.at(-1) === 'mul' && s.cursor === 1);
  assert.ok(stopped > 0);
  assert.equal(steps[stopped + 1].kind, 'return');
  assert.deepEqual(steps[stopped + 1].frames, ['expr']);
  assert.equal(steps[stopped + 1].cursor, 1);
  assert.equal(steps[stopped + 2].kind, 'operator');
  assert.equal(steps[stopped + 2].cursor, 2);
});

test('戻る操作用の過去の木は後の結合で変更されない', () => {
  const steps = buildParserTrace();
  const threeLeaves = steps.find(s => s.forest.length === 3);
  assert.deepEqual(threeLeaves.forest.map(n => n.value), ['8', '3', '2']);
  assert.deepEqual(steps[0].forest, []);
  const nextRun = buildParserTrace();
  steps.at(-1).forest[0].value = '変更';
  assert.equal(nextRun.at(-1).forest[0].value, '+');
  assert.equal(threeLeaves.forest[0].value, '8');
});
