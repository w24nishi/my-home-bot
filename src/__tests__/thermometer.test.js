const axios = require('axios');
const Thermometer = require('../thermometer');

jest.mock('axios');

test('Thermometer can be instantiated', () => {
    const thermometer = new Thermometer('dummy token');
    expect(thermometer).toBeInstanceOf(Thermometer);
});

test('fetchTemperature eventually returns temperature', async () => {
    const res = {
        status: 200,
        data: [
            {
                newest_events: {
                    te: {
                        val: 12.3,
                        created_at: '2021-09-08T11:31:50Z',
                    },
                },
            },
        ],
    };
    const getMock = jest.fn(() => res);
    axios.create.mockReturnValue({
        get: getMock,
    });

    const thermometer = new Thermometer('dummy token');
    const temperature = await thermometer.fetchTemperature();

    expect(getMock.mock.calls.length).toBe(1);
    expect(getMock.mock.calls[0][0]).toBe('/1/devices');
    expect(temperature).toEqual({
        val: '12.3℃',
        date: '2021/09/08 20:31',
    });
});

test('fetchTemperature rejects when Nature Remo server returns error', async () => {
    const res = {
        status: 503,
    };
    const getMock = jest.fn(() => res);
    axios.create.mockReturnValue({
        get: getMock,
    });

    const thermometer = new Thermometer('dummy token');
    await expect(thermometer.fetchTemperature()).rejects.toThrow();
});
