(function () {
  'use strict';
  class LessonError extends Error {
    constructor(message, pos = 0) { super(message); this.pos = pos; }
  }
  function tokenize(source) {
    if (source.length > 120) throw new LessonError('観察できる式は120文字までです。', 120);
    const tokens = [];
    let i = 0;
    while (i < source.length) {
      if (/\s/.test(source[i])) { i++; continue; }
      const start = i;
      if (/[0-9]/.test(source[i])) {
        while (i < source.length && /[0-9]/.test(source[i])) i++;
        const text = source.slice(start, i), value = BigInt(text);
        if (value > 2147483647n) throw new LessonError('数は2147483647以下にしてください。', start);
        tokens.push({ kind: 'number', text, value, start });
      } else {
        const pair = source.slice(i, i + 2);
        const text = ['==', '!=', '<=', '>='].includes(pair) ? pair : source[i];
        if (!['==', '!=', '<=', '>=', '+', '-', '*', '/', '(', ')', '<', '>'].includes(text)) {
          throw new LessonError('この文字は使えません。', start);
        }
        tokens.push({ kind: 'operator', text, start });
        i += text.length;
      }
    }
    tokens.push({ kind: 'eof', text: '終端', start: i });
    return tokens;
  }
  function parse(tokens) {
    let cursor = 0, count = 0;
    const peek = () => tokens[cursor];
    const consume = text => peek().kind === 'operator' && peek().text === text ? tokens[cursor++] : null;
    function node(op, left, right, pos, value) {
      if (++count > 47) throw new LessonError('木のノードは47個までです。式を短くしてください。', pos);
      return { id: count, op, left, right, pos, value };
    }
    function primary() {
      if (consume('(')) {
        const result = equality();
        if (!consume(')')) throw new LessonError('閉じカッコ「)」が必要です。', peek().start);
        return result;
      }
      const token = peek();
      if (token.kind !== 'number') throw new LessonError('ここには数か「(」が必要です。', token.start);
      cursor++;
      return node('num', null, null, token.start, token.value);
    }
    function unary() {
      if (consume('+')) return primary();
      const minus = consume('-');
      if (minus) return node('-', node('num', null, null, minus.start, 0n), primary(), minus.start);
      return primary();
    }
    function chain(child, operators) {
      let left = child();
      while (peek().kind === 'operator' && operators.includes(peek().text)) {
        const token = tokens[cursor++], right = child();
        if (token.text === '>') left = node('<', right, left, token.start);
        else if (token.text === '>=') left = node('<=', right, left, token.start);
        else left = node(token.text, left, right, token.start);
      }
      return left;
    }
    const mul = () => chain(unary, ['*', '/']);
    const add = () => chain(mul, ['+', '-']);
    const relational = () => chain(add, ['<', '<=', '>', '>=']);
    const equality = () => chain(relational, ['==', '!=']);
    const root = equality();
    if (peek().kind !== 'eof') throw new LessonError('ここで式が終わるはずです。演算子が抜けていないか確認してください。', peek().start);
    return root;
  }
  function generate(root) {
    const events = [], lines = ['.intel_syntax noprefix', '.text', '.globl main', 'main:'];
    const condition = { '==': 'sete', '!=': 'setne', '<': 'setl', '<=': 'setle' };
    function visit(node) {
      if (node.op === 'num') {
        lines.push(`  mov rax, ${node.value}`, '  push rax');
      } else {
        visit(node.left); visit(node.right);
        lines.push('  pop rdi', '  pop rax');
        if (node.op === '/') lines.push('  cqo', '  idiv rdi');
        else if (condition[node.op]) lines.push('  cmp rax, rdi', `  ${condition[node.op]} al`, '  movzx rax, al');
        else lines.push(`  ${{ '+': 'add', '-': 'sub', '*': 'imul' }[node.op]} rax, rdi`);
        lines.push('  push rax');
      }
      events.push(node);
    }
    visit(root);
    lines.push('  pop rax', '  ret', '.section .note.GNU-stack,"",@progbits');
    return { assembly: lines.join('\n'), events };
  }
  function simulate(events) {
    const stack = [], snapshots = [{ stack: [], activeId: null, text: '計算用のスタックは空です。最初の数を積むところから始めます。' }];
    for (const node of events) {
      let value, text;
      if (node.op === 'num') {
        value = node.value; text = `${value} を積みます。`;
      } else {
        const right = stack.pop(), left = stack.pop();
        if (node.op === '/' && right === 0n) throw new LessonError('ゼロでは割れません。計算の観察を停止しました。', node.pos);
        switch (node.op) {
          case '+': value = left + right; break;
          case '-': value = left - right; break;
          case '*': value = left * right; break;
          case '/': value = left / right; break;
          case '==': value = BigInt(left === right); break;
          case '!=': value = BigInt(left !== right); break;
          case '<': value = BigInt(left < right); break;
          case '<=': value = BigInt(left <= right); break;
        }
        text = `右の ${right}、左の ${left} の順に取り出し、${left} ${node.op} ${right} = ${value} を積みます。`;
      }
      if (value < -(1n << 63n) || value >= (1n << 63n)) throw new LessonError('途中結果が符号付き64ビットの範囲を超えました。計算の観察を停止しました。', node.pos);
      stack.push(value);
      snapshots.push({ stack: [...stack], activeId: node.id, text });
    }
    return { snapshots, result: stack[0], status: (stack[0] % 256n + 256n) % 256n };
  }
  function compile(source) {
    const tokens = tokenize(source), root = parse(tokens), generated = generate(root);
    return { tokens, root, ...generated, ...simulate(generated.events) };
  }
  const api = { LessonError, tokenize, parse, generate, simulate, compile };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  function element(tag, attrs = {}, content) {
    const el = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    if (content !== undefined) el.textContent = content;
    return el;
  }
  function drawTree(root) {
    const svg = $('ast-svg'), positions = [], edges = [];
    let leaves = 0, maxDepth = 0;
    function layout(node, depth) {
      maxDepth = Math.max(maxDepth, depth);
      let x;
      if (node.op === 'num') x = 75 + 140 * leaves++;
      else {
        const a = layout(node.left, depth + 1), b = layout(node.right, depth + 1);
        x = (a + b) / 2;
        edges.push([x, depth * 82 + 54, a, (depth + 1) * 82 + 20], [x, depth * 82 + 54, b, (depth + 1) * 82 + 20]);
      }
      positions.push({ node, x, y: depth * 82 + 20 });
      return x;
    }
    layout(root, 0);
    const width = Math.max(300, leaves * 140 + 10);
    svg.replaceChildren(element('title', {}, '演算子が親、受け取る値が子になる抽象構文木'));
    svg.setAttribute('viewBox', `0 0 ${width} ${maxDepth * 82 + 85}`);
    svg.style.minWidth = `${width}px`;
    for (const [x1, y1, x2, y2] of edges) svg.append(element('line', { x1, y1, x2, y2, stroke: '#96a49b', 'stroke-width': 2 }));
    for (const { node, x, y } of positions) {
      const group = element('g', { class: 'ast-node', 'data-node': node.id });
      group.append(element('rect', { x: x - 60, y, width: 120, height: 36, rx: 5, stroke: '#355d4c' }), element('text', { x, y: y + 24, 'text-anchor': 'middle' }, node.op === 'num' ? String(node.value) : node.op));
      svg.append(group);
    }
  }
  function drawStack(stack) {
    const svg = $('stack-svg'), height = Math.max(125, stack.length * 48 + 65);
    svg.setAttribute('viewBox', `0 0 300 ${height}`);
    svg.replaceChildren(element('title', {}, '一時的な計算結果。上が最後に積んだ値。'));
    svg.append(element('text', { x: 20, y: 22 }, '上が最後に積んだ値'));
    if (!stack.length) {
      svg.append(element('rect', { x: 20, y: 40, width: 260, height: 48, fill: 'none', stroke: '#96a49b', 'stroke-dasharray': '5 4' }), element('text', { x: 150, y: 70, 'text-anchor': 'middle' }, '空'));
    }
    [...stack].reverse().forEach((value, index) => {
      const y = 38 + index * 48;
      svg.append(element('rect', { x: 20, y, width: 260, height: 42, rx: 4, fill: index === 0 ? '#f5e9dc' : '#e8eee5', stroke: index === 0 ? '#ac4b30' : '#96a49b' }), element('text', { x: 150, y: y + 27, 'text-anchor': 'middle' }, String(value)));
    });
  }
  let lesson, step = 0;
  function renderStep() {
    const snapshot = lesson.snapshots[step], last = lesson.snapshots.length - 1;
    drawStack(snapshot.stack);
    document.querySelectorAll('.ast-node').forEach(el => el.classList.toggle('active', Number(el.dataset.node) === snapshot.activeId));
    $('step-text').textContent = snapshot.text + (step === last ? ' 最後に pop rax でこの結果を取り出し、ret で戻ります。' : '');
    $('step-count').textContent = `${step} / ${last} 操作`;
    $('step-back').disabled = $('step-reset').disabled = step === 0;
    $('step-next').disabled = step === last;
    $('total-result').textContent = step === last ? `式の結果：${lesson.result} ／ 終了ステータスの下位８ビット：${lesson.status}` : '１操作ずつ進めると、最後に式の結果が表示されます。';
  }
  function update() {
    $('expression-error').textContent = '';
    $('lab-output').hidden = true;
    const source = $('expression').value;
    try {
      lesson = compile(source); step = 0;
      $('token-output').replaceChildren();
      for (const token of lesson.tokens) {
        const el = document.createElement('span');
        el.className = `token ${token.kind}`;
        el.textContent = token.text;
        el.title = `先頭から${token.start}文字目（０から数える）`;
        $('token-output').append(el);
      }
      drawTree(lesson.root);
      $('assembly-output').textContent = lesson.assembly;
      $('lab-output').hidden = false;
      renderStep();
    } catch (error) {
      if (!(error instanceof LessonError)) throw error;
      $('expression-error').textContent = `${source}\n${' '.repeat(error.pos)}↑\n${error.message}`;
    }
  }
  $('expression-form').addEventListener('submit', event => { event.preventDefault(); update(); });
  $('expression').addEventListener('input', () => { $('lab-output').hidden = true; $('expression-error').textContent = ''; });
  document.querySelectorAll('[data-expression]').forEach(button => button.addEventListener('click', () => { $('expression').value = button.dataset.expression; update(); }));
  $('step-back').addEventListener('click', () => { if (step > 0) { step--; renderStep(); } });
  $('step-next').addEventListener('click', () => { if (step < lesson.snapshots.length - 1) { step++; renderStep(); } });
  $('step-reset').addEventListener('click', () => { step = 0; renderStep(); });
  update();
})();
