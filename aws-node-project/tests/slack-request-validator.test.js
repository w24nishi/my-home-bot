'use strict';

const hmacSHA256 = require('crypto-js/hmac-sha256');

const SlackRequestValidator = require('../slack-request-validator');

describe('SlackRequestValidator', () => {
  it('isValidSignature returns false when necessary parameters are missing', () => {
    const validator = new SlackRequestValidator('sining secret');
    expect(
      validator.isValidSignature(undefined, '123', '{"key": "value"}')
    ).toBe(false);
    expect(
      validator.isValidSignature(
        '1234567890abcdef',
        undefined,
        '{"key": "value"}'
      )
    ).toBe(false);
    expect(validator.isValidSignature('1234567890abcdef', '123', null)).toBe(
      false
    );
  });

  it('isValidSignature returns false when the signature is invalid', () => {
    const signingSecret = '1234567890abcdef1234567890abcdef';
    const timestamp = '12345';
    const body = '{"someKey": "someValue"}';
    const signature = '1234567890abcdef';

    const validator = new SlackRequestValidator(signingSecret);
    expect(validator.isValidSignature(signature, timestamp, body)).toBe(false);
  });

  it('isValidSignature returns true when the signature is valid', () => {
    const signingSecret = '1234567890abcdef1234567890abcdef';
    const timestamp = 1234567890123;
    const body = '{"someKey": "someValue"}';

    const baseString = ['v0', timestamp, body].join(':');
    const signature = 'v0=' + hmacSHA256(baseString, signingSecret).toString();

    const validator = new SlackRequestValidator(signingSecret);
    expect(validator.isValidSignature(signature, timestamp, body)).toBe(true);
  });
});
