'use strict';

const Handler = require('../handler');

describe('Handler', () => {
  it('can be initialized', () => {
    const handler = new Handler();
    expect(handler).toBeInstanceOf(Handler);
  });

  it('returns 400 when the request method is not POST', async () => {
    const handler = new Handler({});

    const resGet = await handler.run(event('GET'));
    expect(resGet.statusCode).toBe(400);

    const resPut = await handler.run(event('PUT'));
    expect(resPut.statusCode).toBe(400);

    const resDelete = await handler.run(event('DELETE'));
    expect(resDelete.statusCode).toBe(400);
  });

  it('returns 200 when the request is a URL verification', async () => {
    const handler = new Handler({});
    const res = await handler.run(
      event(
        'POST',
        null,
        JSON.stringify({
          type: 'url_verification',
          challenge: '0123456789abcdef',
        })
      )
    );
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.challenge).toBe('0123456789abcdef');
  });

  it('return 400 when the signature is invalid', async () => {
    const isValidSignature = jest.fn(() => false);
    const requestValidator = {
      isValidSignature,
    };
    const handler = new Handler(requestValidator);

    const res = await handler.run(event('POST'));
    expect(isValidSignature.mock.calls.length).toBe(1);
    expect(res.statusCode).toBe(400);
  });
});

const event = (method, headers, body) => {
  return {
    requestContext: {
      http: {
        method,
      },
    },
    headers: headers || {},
    body: body || '{}',
  };
};
