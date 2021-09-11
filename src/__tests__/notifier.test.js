const axios = require('axios');
const Notifier = require('../notifier');

jest.mock('axios');

beforeEach(() => {
    jest.clearAllMocks();
});

test('Notifier can be instantiated', () => {
    const notifier = new Notifier('dummy token');
    expect(notifier).toBeInstanceOf(Notifier);
});

test('postMessageToSlack posts a message', async () => {
    const res = {
        status: 200,
        data: [],
    };
    const postMock = jest.fn(() => res);
    axios.create.mockReturnValue({
        post: postMock,
    });

    const notifier = new Notifier('dummy token');
    const params = {
        channel: 'channel id',
        text: 'hogefuga',
    };
    await notifier.postMessageToSlack(params);

    expect(postMock.mock.calls.length).toBe(1);
    expect(postMock.mock.calls[0][0]).toBe('/chat.postMessage');
    expect(postMock.mock.calls[0][1]).toEqual(params);
});
