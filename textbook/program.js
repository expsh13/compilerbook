import {LAST_STAGE, programState} from './program-model.mjs';
const lab = document.querySelector('#program-lab');
if (lab) {
  const get = id => lab.querySelector('#program-' + id);
  let stage = 0;
  const draw = (tag, attrs, text) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function render() {
    const state = programState(stage, Number(get('input').value));
    const write = (id, value) => { get(id).textContent = value; };
    write('count', `${stage} / ${LAST_STAGE}`);
    get('prev').disabled = stage === 0;
    get('reset').disabled = stage === 0;
    get('next').disabled = stage === LAST_STAGE;
    write('status', state.message);
    write('location', state.location);
    write('base', state.base === null ? 'base：まだ配置されていない' : 'base = 13（初期データから）');
    write('blank', state.blank === null ? 'blank：まだ用意されていない' : 'blank = 0（ゼロ初期化）');
    const gone = stage === LAST_STAGE;
    write('x', state.x !== null ? `x = ${state.x}` : state.localsAlive ? 'x：未初期化（値を読まない）' : gone ? 'x：寿命が終わった' : 'x：まだ存在しない');
    const array = get('array');
    array.replaceChildren();
    for (let i=0; i<3; i++) {
      array.append(draw('rect', {x:27+i*102, y:245, width:94,height:57,rx:4,class:state.tmp ? 'frame' : 'empty'}));
      array.append(draw('text', {x:74+i*102,y:280,'text-anchor':'middle',class:state.tmp ? 'mono' : 'small'}, state.tmp ? String(state.tmp[i]) : state.localsAlive ? '未初期化' : '—'));
    }
    write('local-note', state.tmp ? '３要素がそろった。残りもゼロにする。' : gone ? 'ビット列が残っても、変数としては使えない。' : state.localsAlive ? '置き場の確保と、値の初期化は別。' : '関数はまだ呼ばれていない。');
    write('stack', !state.stackReady ? 'まだ用意されていない' : state.localsAlive ? 'computeのフレームを使用中' : gone ? 'mainの呼び出し前の位置へ戻る' : '初期スタックを用意済み');
    write('result', state.result === null ? 'まだ返していない' : `${state.result}（EAX）`);
    write('memory-desc', `${state.message} ${get('base').textContent}。${get('blank').textContent}。${get('x').textContent}。`);
  }
  get('next').addEventListener('click', () => {stage=Math.min(stage+1,LAST_STAGE);render();});
  get('prev').addEventListener('click', () => {stage=Math.max(stage-1,0);render();});
  get('reset').addEventListener('click', () => {stage=0;render();});
  get('input').addEventListener('change', () => {stage=0;render();});
  render();
}
