import test from 'node:test';
import assert from 'node:assert/strict';
import {linkingState, LAST_STAGE} from '../dynamic-linking-model.mjs';
test('静的はリンク時、動的はロード後に参照を解決する',()=>{
  assert.equal(linkingState('static',0).address,null);
  assert.equal(linkingState('static',1).address,0x401080);
  assert.equal(linkingState('dynamic',1).address,null);
  assert.equal(linkingState('dynamic',2).loaded,true);
  assert.equal(linkingState('dynamic',2).resolved,false);
  assert.equal(linkingState('dynamic',3).address,0x700020);
});
test('本体の場所が違ってもcallとretは同じ戻り先とスタックを使う',()=>{
  for(const mode of ['static','dynamic']){
    const call=linkingState(mode,4), ready=linkingState(mode,5), done=linkingState(mode,LAST_STAGE);
    assert.equal(call.rip,call.address);
    assert.equal(call.returnAddress,0x401005);
    assert.equal(call.rsp,0xff8);
    assert.equal(call.result,null);
    assert.equal(ready.result,13);
    assert.equal(ready.returnAddress,call.returnAddress);
    assert.equal(done.rip,call.returnAddress);
    assert.equal(done.returnAddress,null);
    assert.equal(done.rsp,0x1000);
    assert.equal(done.result,13);
    assert.equal(done.loaded,true);
  }
});
test('段階とモードの境界を守る',()=>{
  for(const stage of [-1,7,2.5])assert.throws(()=>linkingState('static',stage));
  assert.throws(()=>linkingState('unknown',0));
  assert.equal(linkingState('dynamic',0).loaded,false);
  assert.equal(linkingState('dynamic',0).rip,null);
});
