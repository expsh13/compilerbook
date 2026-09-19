import { pointerSnapshot, readPointer } from './pointers-model.mjs';

const get = id => document.getElementById(id);
const hex = value => '0x' + value.toString(16).toUpperCase().padStart(4, '0');
const namespace = 'http://www.w3.org/2000/svg';
function svgElement(tag, attrs, text) {
  const element = document.createElementNS(namespace, tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}
function selection() {
  return pointerSnapshot(get('pointer-kind').value, Number(get('pointer-index').value));
}
function render() {
  const state = selection();
  get('pointer-code').textContent = `${state.kind} a[3];\na[0] = ${state.values[0]}; a[1] = ${state.values[1]}; a[2] = ${state.values[2]};\n${state.kind} *p;\np = a + ${state.index};`;
  get('pointer-address').textContent = `p = ${hex(state.address)}`;
  get('pointer-formula').textContent = `${hex(state.base)} + ${state.index} × ${state.width} = ${hex(state.address)}`;
  const cells = get('pointer-cells');
  const labels = get('pointer-labels');
  cells.replaceChildren();
  labels.replaceChildren();
  state.bytes.forEach((byte, index) => {
    const x = 26 + index * 52;
    cells.append(
      svgElement('text', { x: x + 9, y: 237, class: 'small' }, `+${index}`),
      svgElement('rect', { x, y: 246, width: 48, height: 57, rx: 4, class: state.selected.includes(index) ? 'pointer-selected' : 'frame' }),
      svgElement('text', { x: x + 12, y: 280, class: 'pointer-byte' }, byte.toString(16).toUpperCase().padStart(2, '0'))
    );
  });
  const endX = 26 + state.byteLength * 52;
  cells.append(
    svgElement('rect', { x: endX, y: 246, width: 88, height: 57, rx: 4, class: 'pointer-outside' }),
    svgElement('text', { x: endX + 10, y: 269, class: 'small' }, '末尾の'),
    svgElement('text', { x: endX + 10, y: 289, class: 'small' }, '１つ先')
  );
  state.values.forEach((value, index) => {
    const x = 26 + index * state.width * 52;
    labels.append(svgElement('text', { x, y: 331, class: 'small' }, state.kind === 'int' ? `a[${index}]：${value}` : ['O', 'K', '終端'][index]));
  });
  const targetX = 26 + state.index * state.width * 52 + 24;
  get('pointer-target').setAttribute('d', `M570 141V204H${targetX}V239`);
  get('pointer-boundary').textContent = `先頭 ${hex(state.base)} ／ 末尾の１つ先 ${hex(state.base + state.byteLength)} ／ 全体 ${state.byteLength}バイト`;
  get('pointer-read').disabled = !state.readable;
  get('pointer-result').textContent = state.readable
    ? `pに${hex(state.address)}を保存した。p自身は${hex(state.pointerStorage)}からの８バイトに置いたまま。まだ*pを読んでいない。`
    : `${hex(state.address)}は末尾の１つ先。ポインタは作れるが、配列の要素がないため*pは読めない。`;
}
get('pointer-kind').addEventListener('change', render);
get('pointer-index').addEventListener('change', render);
get('pointer-read').addEventListener('click', () => {
  const state = selection();
  if (!state.readable) return;
  const value = readPointer(state.kind, state.index);
  const suffix = state.kind === 'char'
    ? value === 0 ? 'これは配列内の終端ゼロ。文字列の終わりを示すデータで、読み取り可能。' : `文字として読むと「${String.fromCharCode(value)}」。`
    : 'ポインタに入っているアドレス自体は変わらない。';
  get('pointer-result').textContent = `${hex(state.address)}から${state.width}バイト読んだ。*pの値は${value}。${suffix}`;
});
get('pointer-reset').addEventListener('click', () => {
  get('pointer-kind').value = 'int';
  get('pointer-index').value = '0';
  render();
});
render();
