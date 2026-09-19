import {readingState} from './types-model.mjs';
const lab=document.querySelector('#type-lab');
if(lab){
 let stage=0;
 const el=id=>lab.querySelector('#type-'+id);
 const svg=(tag,attrs,content)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(content!==undefined)n.textContent=content;return n;};
 function render(){
  const s=readingState(el('example').value,stage);
  el('count').textContent=`${stage} / ${s.last}`;
  el('prev').disabled=el('reset').disabled=stage===0;
  el('next').disabled=s.complete;
  el('status').textContent=s.message;
  el('code').replaceChildren();
  for(const token of s.example.tokens){const span=document.createElement('span');span.textContent=token.text;if(token.id===s.focus){span.className='type-current';span.setAttribute('aria-current','step');}el('code').append(span);}
  el('nodes').replaceChildren();
  const maxNodes=s.example.steps.filter(x=>x.node).length;
  const w=maxNodes===4?148:195, gap=maxNodes===4?28:42;
  s.nodes.forEach((node,i)=>{
   const x=20+i*(w+gap);
   if(i)el('nodes').append(svg('path',{d:`M${x-gap+2} 68H${x-8}`,class:'link','marker-end':'url(#type-arrow)'}));
   el('nodes').append(svg('rect',{x,y:25,width:w,height:86,rx:5,class:i===s.nodes.length-1?'warm':'frame'}));
   el('nodes').append(svg('text',{x:x+12,y:58,class:'title'},node.title));
   el('nodes').append(svg('text',{x:x+12,y:89,class:'small'},node.subtitle));
  });
  if(!s.nodes.length)el('nodes').append(svg('text',{x:20,y:70,class:'small'},stage===0?'読む前：型の箱はまだない。':`${s.example.name}から、型をたどり始める。`));
  el('nodes').append(svg('text',{x:20,y:143,class:'small'},'矢印は型の関係。メモリのアドレスや実行順序ではない。'));
  el('result').textContent=s.complete?s.example.meaning:s.nodes.length?'ここまで：'+s.nodes.map(n=>n.title).join(' → ')+' → 続きを読む':'型の図は、読むにつれて左から増える。';
  el('diagram-desc').textContent=s.message+' '+s.nodes.map(n=>n.title+'：'+n.subtitle).join(' → ');
 }
 el('next').addEventListener('click',()=>{stage=Math.min(readingState(el('example').value,stage).last,stage+1);render();});
 el('prev').addEventListener('click',()=>{stage=Math.max(0,stage-1);render();});
 el('reset').addEventListener('click',()=>{stage=0;render();});
 el('example').addEventListener('change',()=>{stage=0;render();});
 render();
}
