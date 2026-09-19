import { encodeByte, describeByte, operateByte } from './integers-model.mjs';

const get = id => document.getElementById(id);
const pretty = number => String(number).replace('-', '−');
const sum = weights => weights.filter(value => value !== 0).map(pretty).join(' + ') || '0';
const bitButtons = [...document.querySelectorAll('[data-bit]')];
const presets = [...document.querySelectorAll('[data-byte]')];
let byte = 251;

function render(message, inputValue) {
  const view = describeByte(byte);
  get('byte-input').value = String(inputValue ?? view.signed);
  get('byte-input').removeAttribute('aria-invalid');
  get('byte-error').textContent = '';
  for (const button of bitButtons) {
    const index = Number(button.dataset.bit);
    const bit = Math.floor(byte / 2 ** index) % 2;
    button.setAttribute('aria-pressed', String(bit === 1));
    button.setAttribute('aria-label', `ビット${index}：${bit}。押すと切り替え`);
    button.querySelector('.bit-digit').textContent = bit;
  }
  for (const button of presets) button.setAttribute('aria-pressed', String(Number(button.dataset.byte) === byte));
  get('byte-unsigned').textContent = view.unsigned;
  get('byte-signed').textContent = pretty(view.signed);
  get('byte-weight-unsigned').textContent = `符号なし：${sum(view.weights)} = ${view.unsigned}`;
  get('byte-weight-signed').textContent = `符号あり：${sum(view.signedWeights)} = ${pretty(view.signed)}`;
  get('byte-hex').textContent = `16進数：${view.hex}`;
  get('zero-low').textContent = view.grouped;
  get('sign-low').textContent = view.grouped;
  get('sign-high').textContent = view.signHigh;
  get('zero-reading').textContent = `16ビット符号なし：${view.zeroExtended}`;
  get('sign-reading').textContent = `16ビット符号あり：${pretty(view.signed)}（符号なしで読むと${view.signExtended}）`;
  get('byte-status').textContent = message || `${view.grouped}：符号なしでは${view.unsigned}、符号ありでは${pretty(view.signed)}。`;
}

get('byte-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = get('byte-input').value.trim().replace('−', '-');
  try {
    if (!/^[+-]?\d+$/.test(input)) throw new Error('−128〜255の整数を入力してください。');
    const number = Number(input);
    byte = encodeByte(number);
    render(undefined, number);
  } catch (error) {
    get('byte-error').textContent = error.message;
    get('byte-input').setAttribute('aria-invalid', 'true');
  }
});

for (const button of bitButtons) {
  button.addEventListener('click', () => {
    const previous = describeByte(byte);
    byte ^= 2 ** Number(button.dataset.bit);
    const next = describeByte(byte);
    render(`桁${button.dataset.bit}を切り替えた。${previous.grouped} → ${next.grouped}。符号なしでは${next.unsigned}、符号ありでは${pretty(next.signed)}。`);
  });
}
for (const button of presets) button.addEventListener('click', () => { byte = Number(button.dataset.byte); render(); });
for (const button of document.querySelectorAll('[data-op]')) {
  button.addEventListener('click', () => {
    const previous = describeByte(byte);
    const operation = button.dataset.op;
    const result = operateByte(byte, operation);
    byte = result.byte;
    const next = describeByte(byte);
    let explanation;
    if (operation === 'negate') {
      explanation = result.signedOutOfRange
        ? '数学上の結果＋128は８ビット符号ありに入らないため、同じビット列へ戻る。正負反転した値を表せていない。'
        : `符号ありの値は${pretty(previous.signed)} → ${pretty(next.signed)}。全ビット反転の後に１を足した。`;
    } else if (operation === 'invert') {
      explanation = `各ビットの０と１を交換した。符号ありでは${pretty(previous.signed)} → ${pretty(next.signed)}。この操作だけでは正負反転にならない。`;
    } else {
      explanation = `符号なしでは${previous.unsigned} → ${next.unsigned}。${result.unsignedOutOfRange ? '０〜255の外へ出るため一周する。' : '範囲内。'} 符号ありでは${pretty(previous.signed)} → ${pretty(next.signed)}。${result.signedOutOfRange ? '数学上の結果は−128〜127の範囲外。' : '範囲内。'}`;
    }
    render(`${previous.grouped} → ${next.grouped}。${explanation}`);
  });
}
render();
