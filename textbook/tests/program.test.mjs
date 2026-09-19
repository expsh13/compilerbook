import test from 'node:test';
import assert from 'node:assert/strict';
import {programState, LAST_STAGE} from '../program-model.mjs';

test('実行前にグローバルの値が用意され、ローカルは関数を呼ぶまで存在しない', () => {
  assert.equal(programState(0).base, null);
  assert.equal(programState(1).base, 13);
  assert.equal(programState(1).blank, null);
  assert.equal(programState(2).blank, 0);
  assert.equal(programState(2).stackReady, false);
  assert.equal(programState(3).stackReady, true);
  for(let i=0;i<=5;i++) assert.equal(programState(i).localsAlive, false);
  assert.equal(programState(6).localsAlive, true);
  assert.equal(programState(6).x, null);
  assert.equal(programState(7).x, 18);
  assert.equal(programState(7).tmp, null);
});
test('初期化は入力を使い、部分配列をゼロで補い、戻った後に寿命が終わる', () => {
  for (const n of [5,8]) {
    assert.deepEqual(programState(8,n).tmp, [n+13,2,0]);
    assert.equal(programState(9,n).result,n+15);
    const after=programState(LAST_STAGE,n);
    assert.equal(after.result,n+15);
    assert.equal(after.localsAlive,false);
    assert.equal(after.x,null);
    assert.equal(after.tmp,null);
    for (let i=1;i<=LAST_STAGE;i++) {
      assert.equal(programState(i,n).base,13);
      assert.deepEqual(programState(i,n).fileBytes,[13,0,0,0]);
    }
  }
});
test('不正な段階と入力は拒否し、再観察の状態は独立している', () => {
  for (const i of [-1,11,1.5]) assert.throws(()=>programState(i));
  assert.throws(()=>programState(0,0));
  const state=programState(8);
  state.tmp[0]=999;
  assert.deepEqual(programState(8).tmp,[18,2,0]);
});
