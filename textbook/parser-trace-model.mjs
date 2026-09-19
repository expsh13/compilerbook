// この節で扱う固定式の構文解析を、観察用の状態として記録する。
export const traceTokens = ['8', '+', '3', '*', '2', 'EOF'];
export function buildParserTrace() {
  const frames = [], forest = [], steps = [];
  let cursor = 0, nextId = 0;
  const record = (kind, message) => steps.push(JSON.parse(JSON.stringify({kind, message, cursor, frames, forest})));
  const enter = name => { frames.push(name); record('call', `${name}()を呼ぶ。読み取り位置はそのまま、ここから先のまとまりを任せる。`); };
  const leave = (name, node) => {
    frames.pop();
    record('return', `${name}()が「${describe(node)}」の木を${frames.length ? frames.at(-1) + '()へ' : '呼び出し元へ'}返す。トークンの位置は進めない。`);
    return node;
  };
  const describe = node => node.left ? `${describe(node.left)} ${node.value} ${describe(node.right)}` : node.value;
  function primary() {
    enter('primary');
    const node = {id: nextId++, value: traceTokens[cursor++]};
    forest.push(node);
    record('number', `primary()が数の${node.value}を読む。「${node.value}」のノードを作り、読み取り位置を１つ進める。`);
    return leave('primary', node);
  }
  function binary(name, child, operators) {
    enter(name);
    let left = child();
    while (operators.includes(traceTokens[cursor])) {
      const op = traceTokens[cursor++];
      record('operator', `${name}()が担当する「${op}」を読む。左の木を保持し、次に右側を読んでもらう。`);
      const right = child();
      const node = {id: nextId++, value: op, left, right};
      const index = forest.indexOf(left);
      forest.splice(index, 2, node);
      left = node;
      record('join', `${name}()が左右の木を「${op}」のノードでつなぐ。${op === '*' ? '3と2は木のまま。6を計算する段階ではない。' : '左は8、右は3 * 2の木。掛け算のまとまりを保ってつなぐ。'}`);
    }
    record('stop', `${name}()が次の「${traceTokens[cursor]}」を確認。${traceTokens[cursor] === 'EOF' ? '入力の終わりなので' : '自分の担当する演算子ではないので'}、読まずにここで止める。`);
    return leave(name, left);
  }
  record('start', '開始前。トークン列は用意済み。まずexpr()を呼んで、式全体の木を作る。');
  binary('expr', () => binary('mul', primary, ['*', '/']), ['+', '-']);
  record('complete', 'EOFまで来たことを確認して完了。できたのは8 + (3 * 2)のAST。計算結果の14はまだ求めていない。');
  return steps;
}
