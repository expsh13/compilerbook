import test from 'node:test';
import assert from 'node:assert/strict';
import {examples,readingState} from '../types-model.mjs';
const expected={
 'pointer-array':['[3]','*','int'], 'array-pointer':['*','[3]','int'],
 matrix:['[2]','[3]','int'], 'return-pointer':['func(void)','*','int'],
 'function-pointer':['*','func(int)','int'], callbacks:['[2]','*','func(int)','void'],
 signal:['func(int, * func(int) void)','*','func(int)','void']
};
test('括弧・配列・関数による型の順序が一致する',()=>{
 for(const x of examples){const s=readingState(x.id,x.steps.length);assert.deepEqual(s.nodes.map(n=>n.symbol),expected[x.id]);assert.equal(s.complete,true);}
});
test('各段階は名前から始まり、図と元の宣言の記号が対応する',()=>{
 for(const x of examples){assert.equal(readingState(x.id,0).nodes.length,0);assert.equal(readingState(x.id,1).focus,'name');for(let i=1;i<=x.steps.length;i++){const s=readingState(x.id,i);assert.equal(x.tokens.filter(t=>t.id===s.focus).length,1);assert.equal(s.nodes.length,i-1);}}
});
test('例の切り替えで初期状態へ戻せ、範囲外の段階を拒否する',()=>{
 assert.equal(readingState('signal',0).focus,null);
 assert.throws(()=>readingState('missing',0));
 for(const n of [-1,6,1.5])assert.throws(()=>readingState('callbacks',n));
 const s=readingState('pointer-array',4);s.nodes[0].title='変更';assert.equal(readingState('pointer-array',4).nodes[0].title,'配列：３要素');
});
