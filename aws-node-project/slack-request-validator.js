'use strict';

const hmacSHA256 = require('crypto-js/hmac-sha256');

class SlackRequestValidator {
  #signingSecret;

  constructor(signingSecret) {
    this.#signingSecret = signingSecret;
  }

  isValidSignature(signature, timestamp, requestBody) {
    if ([signature, timestamp, requestBody].some((x) => !x)) {
      return false;
    }
    const baseString = ['v0', timestamp, requestBody].join(':');
    const signingSecret = this.#signingSecret;
    const mySignature =
      'v0=' + hmacSHA256(baseString, signingSecret).toString();
    return mySignature === signature;
  }
}

module.exports = SlackRequestValidator;
