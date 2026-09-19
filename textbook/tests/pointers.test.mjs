import test from 'node:test';
import assert from 'node:assert/strict';
import { pointerSnapshot, readPointer } from '../pointers-model.mjs';

test('intとcharの要素幅、アドレス、読み取り値が一致する', () => {
  for (const [kind, width, values] of [['int', 4, [11, 22, 33]], ['char', 1, [79, 75, 0]]]) {
    for (let index = 0; index < 3; index++) {
      const s = pointerSnapshot(kind, index);
      assert.equal(s.address, 0x2000 + index * width);
      assert.equal(s.pointerStorage, 0x1000);
      assert.equal(s.pointerSize, 8);
      assert.equal(s.byteLength, 3 * width);
      assert.equal(s.selected.length, width);
      assert.equal(readPointer(kind, index), values[index]);
    }
  }
  assert.deepEqual(pointerSnapshot('int', 0).bytes, [11, 0, 0, 0, 22, 0, 0, 0, 33, 0, 0, 0]);
});
test('終端ゼロは読めるが、末尾の１つ先は読めない', () => {
  assert.equal(readPointer('char', 2), 0);
  for (const kind of ['int', 'char']) {
    const end = pointerSnapshot(kind, 3);
    assert.equal(end.address, end.base + end.byteLength);
    assert.equal(end.readable, false);
    assert.deepEqual(end.selected, []);
    assert.throws(() => readPointer(kind, 3), /参照できません/);
  }
});
test('範囲外や不正な型を拒否する', () => {
  for (const index of [-1, 4, 0.5, NaN]) assert.throws(() => pointerSnapshot('int', index));
  assert.throws(() => pointerSnapshot('float', 0));
});
