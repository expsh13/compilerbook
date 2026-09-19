import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeByte, describeByte, operateByte } from '../integers-model.mjs';

test('256通りで値の往復、桁の重み、16ビット拡張を確認する', () => {
  for (let byte = 0; byte < 256; byte++) {
    const view = describeByte(byte);
    assert.equal(encodeByte(view.signed), byte);
    assert.equal(parseInt(view.bits, 2), byte);
    assert.equal(view.weights.reduce((a, b) => a + b), byte);
    assert.equal(view.signedWeights.reduce((a, b) => a + b), view.signed);
    const extendedBits = view.signHigh.replaceAll(' ', '') + view.bits;
    const extendedUnsigned = parseInt(extendedBits, 2);
    assert.equal(extendedUnsigned, view.signExtended);
    assert.equal(extendedUnsigned >= 32768 ? extendedUnsigned - 65536 : extendedUnsigned, view.signed);
    assert.equal(view.zeroExtended, byte);
    assert.equal(operateByte(operateByte(byte, 'negate').byte, 'negate').byte, byte);
    assert.equal(operateByte(operateByte(byte, 'invert').byte, 'invert').byte, byte);
    assert.equal(operateByte(operateByte(byte, 'increment').byte, 'decrement').byte, byte);
    assert.equal(operateByte(byte, 'increment').unsignedOutOfRange, byte === 255);
    assert.equal(operateByte(byte, 'increment').signedOutOfRange, byte === 127);
    assert.equal(operateByte(byte, 'decrement').unsignedOutOfRange, byte === 0);
    assert.equal(operateByte(byte, 'decrement').signedOutOfRange, byte === 128);
    assert.equal(operateByte(byte, 'negate').signedOutOfRange, byte === 128);
  }
});

test('境界と代表例の結果が正しい', () => {
  assert.equal(operateByte(127, 'increment').byte, 128);
  assert.equal(operateByte(255, 'increment').byte, 0);
  assert.equal(operateByte(0, 'decrement').byte, 255);
  assert.equal(operateByte(5, 'negate').byte, 251);
  assert.equal(operateByte(128, 'negate').byte, 128);
  assert.equal(describeByte(251).signed, -5);
  assert.equal(describeByte(251).signExtended, 65531);
  assert.equal(operateByte(251, 'invert').byte, 4);
});

test('範囲外や非整数を受け付けない', () => {
  for (const value of [-129, 256, 1.5, NaN, Infinity]) assert.throws(() => encodeByte(value));
  for (const value of [-1, 256, 0.5, NaN]) assert.throws(() => describeByte(value));
});
