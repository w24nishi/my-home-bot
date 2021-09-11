'use strict';

const hmacSHA256 = require('crypto-js/hmac-sha256');

const SlackRequestValidator = require('../slack-request-validator');

test('isValidSignature declines invalid signature', () => {
    const signingSecret = '1234567890abcdef1234567890abcdef';
    const invalidRequest = {
        header: (name) => {
            return {
                'X-Slack-Request-Timestamp': 12345,
                'X-Slack-Signature': '1234567890abcdef',
            }[name];
        },
        rawBody: '{"someKey":"someValue"}',
    };

    const slackRequestValidator = new SlackRequestValidator(signingSecret);
    expect(slackRequestValidator.isValidSignature(invalidRequest)).toBe(false);
});

test('isValidSignature accepts valid signature', () => {
    const signingSecret = '1234567890abcdef1234567890abcdef';
    const rawBody = '{"someKey":"someValue"}';
    const timestamp = 1631328967947;

    const baseString = ['v0', timestamp, rawBody].join(':');
    const signature = 'v0=' + hmacSHA256(baseString, signingSecret).toString();
    const validRequest = {
        header: (name) => {
            return {
                'X-Slack-Request-Timestamp': timestamp,
                'X-Slack-Signature': signature,
            }[name];
        },
        rawBody,
    };

    const slackRequestValidator = new SlackRequestValidator(signingSecret);
    expect(slackRequestValidator.isValidSignature(validRequest)).toBe(true);
});
