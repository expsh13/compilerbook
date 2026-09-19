const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compile, tokenize, LessonError } = require('../calculator.js');

test('優先順位・結合・単項演算・比較を正しく計算する', () => {
  const cases = [
    ['8 + 3 * 2', 14n], ['(8 + 3) * 2', 22n], ['16 - 6 - 2', 8n],
    ['24 / 3 / 2', 4n], ['-7 / 2', -3n], ['7 / -2', -3n], ['-(-3)', 3n],
    ['+4', 4n], ['3 * 4 == 12', 1n], ['1 != 1', 0n], ['3 > 2', 1n],
    ['3 >= 3', 1n], ['3 <= 2', 0n], ['1 < 2 < 1', 0n], ['1 + 2 < 4 == 1', 1n],
    ['12 <= 8 + 4', 1n], ['0', 0n], ['2147483647 * 2147483647', 4611686014132420609n]
  ];
  for (const [source, value] of cases) assert.equal(compile(source).result, value, source);
});
test('２文字の記号・数・空白・元の位置を区別する', () => {
  const tokens = tokenize('12 <= 8 + 4');
  assert.deepEqual(tokens.map(t => t.text), ['12', '<=', '8', '+', '4', '終端']);
  assert.deepEqual(tokens.map(t => t.start), [0, 3, 6, 8, 10, 11]);
});
test('不正な入力と表示・整数範囲の制限を診断する', () => {
  for (const source of ['', '8 + * 2', '(1 + 2', '1 2', '3)', '--3', 'a', '1 = 2', '2147483648', '1 / 0', '2147483647 * 2147483647 * 3', '1'.repeat(121), Array(25).fill('1').join('+')]) {
    assert.throws(() => compile(source), LessonError, source);
  }
  assert.throws(() => compile('8 + * 2'), error => error.pos === 4);
});
test('左・右・親の順で実行し、途中結果は１つにまとまる', () => {
  const lesson = compile('8 + 3 * 2');
  assert.deepEqual(lesson.snapshots.map(s => s.stack), [[], [8n], [8n, 3n], [8n, 3n, 2n], [8n, 6n], [14n]]);
  assert.equal(lesson.root.op, '+');
  assert.equal(lesson.root.right.op, '*');
  assert.equal(compile('3 > 2').root.left.value, 2n);
  assert.equal(compile('-1').status, 255n);
  assert.equal(compile('256').status, 0n);
});
test('生成命令が符号付き除算・比較の拡張・返り値を含む', () => {
  assert.match(compile('-7 / 2').assembly, /pop rdi\n  pop rax\n  cqo\n  idiv rdi/);
  assert.match(compile('2 <= 3').assembly, /cmp rax, rdi\n  setle al\n  movzx rax, al/);
  assert.match(compile('8 - 3').assembly, /pop rdi\n  pop rax\n  sub rax, rdi\n  push rax\n  pop rax\n  ret/);
});
