export function encodeByte(number) {
  if (!Number.isInteger(number) || number < -128 || number > 255) {
    throw new RangeError('−128〜255の整数を入力してください。');
  }
  return (number + 256) % 256;
}

export function describeByte(byte) {
  if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
    throw new RangeError('８ビットの範囲外です。');
  }
  const signed = byte < 128 ? byte : byte - 256;
  const bits = byte.toString(2).padStart(8, '0');
  const weights = [...bits].map((bit, index) => bit === '1' ? 2 ** (7 - index) : 0);
  const signedWeights = [...weights];
  signedWeights[0] = -signedWeights[0];
  return {
    unsigned: byte, signed, bits,
    grouped: bits.slice(0, 4) + ' ' + bits.slice(4),
    hex: '0x' + byte.toString(16).toUpperCase().padStart(2, '0'),
    weights, signedWeights,
    signHigh: signed < 0 ? '1111 1111' : '0000 0000',
    signExtended: signed < 0 ? byte + 65280 : byte,
    zeroExtended: byte
  };
}

export function operateByte(byte, operation) {
  const previous = describeByte(byte);
  let mathematicalUnsigned;
  let mathematicalSigned;
  if (operation === 'increment' || operation === 'decrement') {
    const delta = operation === 'increment' ? 1 : -1;
    mathematicalUnsigned = byte + delta;
    mathematicalSigned = previous.signed + delta;
  } else if (operation === 'negate') {
    mathematicalUnsigned = -byte;
    mathematicalSigned = -previous.signed;
  } else if (operation === 'invert') {
    return { byte: 255 - byte, unsignedOutOfRange: false, signedOutOfRange: false };
  } else {
    throw new Error('操作が見つかりません。');
  }
  return {
    byte: (mathematicalUnsigned + 256) % 256,
    unsignedOutOfRange: mathematicalUnsigned < 0 || mathematicalUnsigned > 255,
    signedOutOfRange: mathematicalSigned < -128 || mathematicalSigned > 127,
    mathematicalUnsigned, mathematicalSigned
  };
}
