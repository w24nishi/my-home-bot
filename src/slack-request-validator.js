'use strict';

const hmacSHA256 = require('crypto-js/hmac-sha256');

class SlackRequestValidator {
    #signingSecret;

    constructor(signingSecret) {
        this.#signingSecret = signingSecret;
    }

    isValidSignature(req) {
        const requestTimestamp = req.header('X-Slack-Request-Timestamp');
        const baseString = ['v0', requestTimestamp, req.rawBody].join(':');
        const signingSecret = this.#signingSecret;
        const mySignature =
            'v0=' + hmacSHA256(baseString, signingSecret).toString();
        return mySignature === req.header('X-Slack-Signature');
    }
}

module.exports = SlackRequestValidator;
