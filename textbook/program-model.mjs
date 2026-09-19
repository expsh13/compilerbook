export const LAST_STAGE = 10;
export function programState(stage, input = 5) {
  if (!Number.isInteger(stage) || stage < 0 || stage > LAST_STAGE) throw new RangeError('段階は０〜10');
  if (![5, 8].includes(input)) throw new RangeError('この観察で選べる引数は５と８');
  const x = input + 13;
  const messages = [
    '開始前。ファイルに命令と初期データが入っている。プロセスのメモリはまだない。',
    'ローダがコードと初期データを仮想メモリに対応付ける。baseの13を、mainで代入する必要はない。',
    'blankのための領域をゼロで用意する。ファイルにゼロ４個を並べなくても、実行時には４バイトを使う。',
    '初期スタックを用意し、RSPを設定する。ここにあるのはargc・argvなど。computeのローカル変数はまだない。',
    '入口の起動用コードから実行する。通常は_startという名前の場所で、mainを呼ぶ前の準備を行う。',
    `起動用コードからmainへ進む。この観察では、mainがcompute(${input})を呼ぶ。baseは13、blankは0になっている。`,
    `computeに入り、引数nは${input}。このモデルではxとtmpの置き場をスタックに取る。まだ初期化する命令は実行していない。`,
    `int x = n + base; に到達。実行中のn（${input}）とbase（13）を読み、${x}をxの置き場に書く。`,
    `int tmp[3] = {x, 2}; に到達。tmpを{${x}, 2, 0}に初期化する。最後の0も、初期化式があるために用意する値。`,
    `returnの式を評価して${x + 2}を返り値のレジスタEAXに入れる。戻る準備をしている段階で、xとtmpはまだ存在する。`,
    `computeからmainに戻る。返り値は${x + 2}。xとtmpの寿命は終わるが、baseとblankは引き続き存在する。`
  ];
  const locations = ['まだ実行していない','ローダが準備中','ローダが準備中','ローダが準備中','起動用コード（_startなど）','main', 'computeの入り口','xの初期化','tmpの初期化','returnの式・戻る準備','mainの呼び出し後'];
  return {
    stage, input, message: messages[stage], location: locations[stage],
    base: stage >= 1 ? 13 : null, blank: stage >= 2 ? 0 : null,
    stackReady: stage >= 3, localsAlive: stage >= 6 && stage < 10,
    x: stage >= 7 && stage < 10 ? x : null,
    tmp: stage >= 8 && stage < 10 ? [x, 2, 0] : null,
    result: stage >= 9 ? x + 2 : null,
    fileBytes: [13, 0, 0, 0]
  };
}
