export const ARRAY_BASE = 0x2000;
export const POINTER_STORAGE = 0x1000;

export function pointerSnapshot(kind, index) {
  if (kind !== 'int' && kind !== 'char') throw new TypeError('配列の型が不正です。');
  if (!Number.isInteger(index) || index < 0 || index > 3) throw new RangeError('添字は０〜３を指定してください。');
  const width = kind === 'int' ? 4 : 1;
  const values = kind === 'int' ? [11, 22, 33] : [79, 75, 0];
  const bytes = values.flatMap(value => Array.from({ length: width }, (_, i) => Math.floor(value / 256 ** i) % 256));
  return {
    kind, index, width, values, bytes,
    base: ARRAY_BASE, pointerStorage: POINTER_STORAGE, pointerSize: 8,
    address: ARRAY_BASE + index * width,
    byteLength: bytes.length, readable: index < values.length,
    selected: index < values.length ? Array.from({ length: width }, (_, i) => index * width + i) : []
  };
}

export function readPointer(kind, index) {
  const state = pointerSnapshot(kind, index);
  if (!state.readable) throw new RangeError('末尾の１つ先は参照できません。');
  return state.selected.reduce((value, offset, i) => value + state.bytes[offset] * 256 ** i, 0);
}
