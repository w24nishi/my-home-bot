'use strict';

const hmacSHA256 = require('crypto-js/hmac-sha256');
const express = require('express');

const bot = require('./bot');

const app = express();
app.use(
    express.json({
        // trick to earn raw request body
        verify: (req, _, buf, encoding) => {
            req.rawBody = buf.toString(encoding || 'utf-8');
        },
    })
);

app.post('/', (req, res) => {
    if (req.body.type === 'url_verification') {
        return res.status(200).send({ challenge: req.body.challenge });
    }
    if (!_isValidRequest(req)) {
        return res.status(400).send({ 'verification successful': false });
    }
    bot.respondToMessage(req.body.event.text);
    return res.status(200).end();
});

app.listen(8080, () => console.log('listening on port 8080'));

function _isValidRequest(req) {
    const requestTimestamp = req.header('X-Slack-Request-Timestamp');
    const baseString = ['v0', requestTimestamp, req.rawBody].join(':');
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    const mySignature =
        'v0=' + hmacSHA256(baseString, signingSecret).toString();
    return mySignature === req.header('X-Slack-Signature');
}
