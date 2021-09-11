'use strict';

const express = require('express');

const SlackRequestValidator = require('./slack-request-validator');
const Notifier = require('./notifier');
const bot = require('./bot');

const validators = [
    process.env.SLACK_SIGNING_SECRET_DEV,
    process.env.SLACK_SIGNING_SECRET_PROD,
]
    .filter((secret) => secret)
    .map((secret) => new SlackRequestValidator(secret));
const notifiers = [
    process.env.SLACK_BOT_TOKEN_DEV,
    process.env.SLACK_BOT_TOKEN_PROD,
]
    .filter((token) => token)
    .map((token) => new Notifier(token));

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
    const properValidatorIndex = validators.findIndex((validator) =>
        validator.isValidSignature(req)
    );
    if (properValidatorIndex < 0) {
        return res.status(400).send({ 'verification successful': false });
    }
    const notifier = notifiers[properValidatorIndex];
    bot.respondToMessage(req, notifier);
    return res.status(200).end();
});

app.listen(8080, () => console.log('listening on port 8080'));
