'use strict';

class Handler {
  #requestValidator;

  constructor(requestValidator) {
    this.#requestValidator = requestValidator;
  }

  async run(event) {
    console.log(event);

    const httpMethod = event?.requestContext?.http?.method;
    if (httpMethod !== 'POST') {
      return this.#response(400, {
        message: 'request method must be POST.',
      });
    }

    const rawBody = event?.body;
    const requestBody = JSON.parse(rawBody);
    if (requestBody.type === 'url_verification') {
      return this.#response(200, {
        challenge: requestBody.challenge,
      });
    }

    const requestHeaders = event?.headers || {};
    const requestTimestamp = requestHeaders['x-slack-request-timestamp'];
    const requestSignature = requestHeaders['x-slack-signature'];
    if (
      !this.#requestValidator.isValidSignature(
        requestSignature,
        requestTimestamp,
        rawBody
      )
    ) {
      return this.#response(400, {
        message: 'invalid signature.',
      });
    }

    const res = {
      message: 'signature validated.',
      requestBody,
    };
    console.log(res);
    return this.#response(200, res);
  }

  #response(statusCode, body) {
    return {
      statusCode,
      body: JSON.stringify(body, null, 0),
    };
  }
}

module.exports = Handler;
