export const LAST_STAGE = 6;
export function linkingState(mode, stage) {
  if (!['static', 'dynamic'].includes(mode)) throw new RangeError('結び方を選んでください');
  if (!Number.isInteger(stage) || stage < 0 || stage > LAST_STAGE) throw new RangeError('段階は０〜６です');
  const shared = mode === 'dynamic';
  const address = shared ? 0x700020 : 0x401080;
  const linked = stage >= 1, loaded = stage >= 2, resolved = stage >= (shared ? 3 : 1);
  const inCall = stage === 4 || stage === 5;
  const messages = shared ? [
    'リンク前。main.oにはvalueへの参照があり、libvalue.soには本体がある。',
    'リンカがapp-soを作る。valueの本体は取り込まず、libvalue.soへの依存と、実行時に解決する参照を残す。',
    'OSと動的リンカが、実行ファイルと共有ライブラリを同じプロセスの仮想メモリに配置する。valueの本体はこの図では0x700020にある。',
    '動的リンカがvalueの定義を探し、呼び出しに使う表を本体の住所へつなぐ。このモデルは即時束縛。起動用コードを経てmainのcall直前まで進む。',
    'mainのcallが次の命令の住所0x401005をスタックへ保存。PLTとGOTを経由し、同じプロセスにあるvalueの本体へ進む。',
    'valueが13をEAXに入れた。次はret。スタックには、mainの続きを指す0x401005が残っている。',
    'retがスタック上の戻り先を読み、mainの0x401005へ戻った。返り値13はEAXにある。共有ライブラリはメモリに読み込まれたまま。'
  ] : [
    'リンク前。main.oにはvalueへの参照があり、libvalue.aには定義を持つvalue.oが入っている。',
    'リンカがvalue.oを取り込み、app-aにmainとvalueの機械語を含める。ここでは非PIEの固定配置を仮定し、呼び先を0x401080へつなぐ。',
    'OSが実行ファイルのコードをメモリに配置する。valueの本体も実行ファイル由来。元のlibvalue.aは実行時には使わない。',
    'valueへの参照はリンク時につながっている。起動用コードを経てmainのcall直前まで進む。valueのための動的なシンボル解決は不要。',
    'mainのcallが次の命令の住所0x401005をスタックへ保存し、実行ファイル由来のvalueの本体0x401080へ進む。',
    'valueが13をEAXに入れた。次はret。スタックには、mainの続きを指す0x401005が残っている。',
    'retがスタック上の戻り先を読み、mainの0x401005へ戻った。返り値13はEAXにある。元のlibvalue.aは最後まで使っていない。'
  ];
  return {mode, stage, shared, linked, loaded, resolved, inCall,
    address: resolved ? address : null,
    rip: stage < 3 ? null : stage === 3 ? 0x401000 : stage === 4 ? address : stage === 5 ? address + 5 : 0x401005,
    returnAddress: inCall ? 0x401005 : null,
    rsp: stage < 3 ? null : inCall ? 0x0ff8 : 0x1000,
    result: stage >= 5 ? 13 : null,
    message: messages[stage]
  };
}
