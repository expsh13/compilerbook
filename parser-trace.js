import {buildParserTrace, traceTokens} from './parser-trace-model.mjs';
const panel = document.querySelector('#parser-trace');
if (panel) {
  const steps = buildParserTrace();
  let position = 0;
  const get = id => panel.querySelector('#' + id);
  const svg = (tag, attributes, text) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const addText = (parent, x, y, text, className = '') => parent.append(svg('text', {x, y, class: className}, text));
  function render() {
    const state = steps[position];
    get('parser-trace-count').textContent = `${position} / ${steps.length - 1}`;
    get('parser-trace-prev').disabled = position === 0;
    get('parser-trace-next').disabled = position === steps.length - 1;
    get('parser-trace-reset').disabled = position === 0;
    get('parser-trace-message').textContent = state.message;
    get('parser-trace-description').textContent = `${state.message} 次に読むトークン：${traceTokens[state.cursor]}。呼び出し中：${state.frames.join(' → ') || 'なし'}。`;
    const tokens = get('parser-trace-tokens');
    tokens.replaceChildren();
    traceTokens.forEach((value, i) => {
      const x = 24 + i * 119;
      tokens.append(svg('rect', {x, y: 39, width: 105, height: 44, rx: 4, fill: i < state.cursor ? '#e9eee5' : '#fffef9', stroke: i === state.cursor ? '#ac4b30' : '#b7c4b7', 'stroke-width': i === state.cursor ? 3 : 1}));
      const text = svg('text', {x: x + 52, y: 68, 'text-anchor': 'middle', class: 'mono'}, value);
      tokens.append(text);
      if (i === state.cursor) {
        tokens.append(svg('path', {d: `M${x + 52} 87v12m-5 -6l5 -6 5 6`, fill: 'none', stroke: '#ac4b30', 'stroke-width': 2}));
        tokens.append(svg('text', {x: x + 52, y: 117, 'text-anchor': 'middle', class: 'small'}, '次に読む'));
      }
    });
    const frames = get('parser-trace-frames');
    frames.replaceChildren();
    state.frames.forEach((name, i) => {
      const y = 174 + i * 55;
      frames.append(svg('rect', {x: 24, y, width: 204, height: 44, rx: 4, fill: i === state.frames.length - 1 ? '#f2e9dc' : '#e9eee5', stroke: '#b7c4b7'}));
      addText(frames, 38, y + 28, `${name}()`, 'mono');
      if (i === state.frames.length - 1) addText(frames, 162, y + 28, '実行中', 'small');
    });
    if (!state.frames.length) addText(frames, 24, 202, position === 0 ? 'まだ呼んでいない' : 'すべて戻った', 'small');
    const tree = get('parser-trace-tree');
    tree.replaceChildren();
    const leaves = node => node.left ? leaves(node.left) + leaves(node.right) : 1;
    const draw = (node, start, end, y) => {
      const x = (start + end) / 2;
      if (node.left) {
        const split = start + (end - start) * leaves(node.left) / leaves(node);
        const lx = (start + split) / 2, rx = (split + end) / 2;
        tree.append(svg('path', {d: `M${x} ${y}L${lx} ${y+73}M${x} ${y}L${rx} ${y+73}`, class: 'link'}));
        draw(node.left, start, split, y + 73);
        draw(node.right, split, end, y + 73);
      }
      tree.append(svg('circle', {cx: x, cy: y, r: 23, fill: node.left ? '#f2e9dc' : '#e9eee5', stroke: '#b7c4b7'}));
      tree.append(svg('text', {x, y: y + 7, 'text-anchor': 'middle', class: 'mono'}, node.value));
    };
    state.forest.forEach((node, i) => draw(node, 282 + i * 450/state.forest.length, 282 + (i+1)*450/state.forest.length, 204));
    if (!state.forest.length) addText(tree, 306, 204, 'まだノードはない', 'small');
  }
  get('parser-trace-next').addEventListener('click', () => { position = Math.min(position + 1, steps.length - 1); render(); });
  get('parser-trace-prev').addEventListener('click', () => { position = Math.max(position - 1, 0); render(); });
  get('parser-trace-reset').addEventListener('click', () => { position = 0; render(); });
  render();
}
