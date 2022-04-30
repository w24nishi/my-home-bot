'use strict';

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const RequestValidator = require('./slack-request-validator');

const Handler = require('./handler');
const handler = new Handler(new RequestValidator(slackSigningSecret));

module.exports.handler = async (event) => {
  try {
    return await handler.run(event);
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: 'unknown server-side error',
        },
        null,
        0
      ),
    };
  }
};
