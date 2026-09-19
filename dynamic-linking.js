import {LAST_STAGE, linkingState} from './dynamic-linking-model.mjs';
const lab = document.querySelector('#dynamic-lab');
if (lab) {
  let stage = 0;
  const el = name => lab.querySelector('#dynamic-' + name);
  const hex = n => '0x' + n.toString(16).toUpperCase();
  const put = (name, text) => {el(name).textContent = text;};
  function render() {
    const s = linkingState(el('mode').value, stage);
    put('count', `${stage} / ${LAST_STAGE}`);
    put('status', s.message);
    el('prev').disabled = el('reset').disabled = stage === 0;
    el('next').disabled = stage === LAST_STAGE;
    put('files', !s.linked ? s.shared ? 'main.o と libvalue.so' : 'main.o と libvalue.a' : s.shared ? 'app-so ＋ libvalue.so' : 'app-a：mainとvalueの本体を含む');
    put('file-detail', s.shared ? 'valueの本体は別ファイル。実行時にもlibvalue.soが必要。' : !s.linked ? 'main.oに足りないvalueの定義を探す。' : 'valueを取り込み済み。元のlibvalue.aは実行時に不要。');
    put('target', s.resolved ? `value → ${hex(s.address)}` : 'value → まだつながっていない');
    put('resolution', s.shared ? s.resolved ? '動的リンカが解決済み。GOTの住所を使って進む。' : 'この例では起動時に解決する。' : s.resolved ? 'この例ではリンク時に解決済み。' : '実行ファイルを作るときに解決する。');
    put('main', s.loaded ? 'mainのcall：0x401000' : 'まだ配置されていない');
    put('static-value', !s.loaded ? 'コードはまだ配置されていない' : s.shared ? 'valueの本体は右の領域にある' : 'valueの本体：0x401080');
    put('shared', !s.shared ? 'value用の.soは使わない' : s.loaded ? 'valueの本体：0x700020' : 'まだ配置されていない');
    put('shared-detail', s.shared ? s.loaded ? '同じプロセス・同じスレッドで実行' : '起動時にlibvalue.soを配置する' : 'valueは実行ファイル側へ入る');
    put('return', s.inCall ? '0x401005（RSP = 0x0FF8）' : stage === LAST_STAGE ? '取り出し済み（RSP = 0x1000）' : '今回の戻り先はまだ保存していない');
    put('rip', s.rip === null ? stage === 2 ? 'RIP：起動準備中' : 'RIP：実行前' : `RIP：${hex(s.rip)}`);
    put('result', s.result === null ? 'EAX：まだ返り値なし' : 'EAX：13（返り値）');
    put('memory-desc', s.message);
  }
  el('next').addEventListener('click',()=>{stage=Math.min(LAST_STAGE,stage+1);render();});
  el('prev').addEventListener('click',()=>{stage=Math.max(0,stage-1);render();});
  el('reset').addEventListener('click',()=>{stage=0;render();});
  el('mode').addEventListener('change',()=>{stage=0;render();});
  render();
}
