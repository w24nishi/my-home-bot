const axios = require('axios');
const fs = require('fs');
const path = require('path');
const WeightScale = require('../weight-scale');

jest.mock('fs');
jest.mock('axios');

const BACKUP_VAR_ENVS = process.env;

beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...BACKUP_VAR_ENVS };
});

afterEach(() => {
    process.env = BACKUP_VAR_ENVS;
});

test('WeightScale can be instantiated with credentials', () => {
    const weightScale = new WeightScale(
        'dummy_client_id',
        'dummy_client_secret',
        'dummy_access_token',
        'dummy_refresh_token',
        new Date().getTime() + 3600000
    );
    expect(weightScale).toBeInstanceOf(WeightScale);
});

test('WeightScale can be instantiated without arguments when environment variables are set properly', () => {
    process.env.HEALTHPLANET_CLIENT_ID = 'dummy_client_id';
    process.env.HEALTHPLANET_CLIENT_SECRET = 'dummy_client_secret';
    process.env.HEALTHPLANET_ACCESS_TOKEN = 'dummy_access_token';
    process.env.HEALTHPLANET_REFRESH_TOKEN = 'dummy_refresh_token';
    process.env.HEALTHPLANET_EXPIRATION = new Date().getTime() + 3600000;
    const weightScale = new WeightScale();
    expect(weightScale).toBeInstanceOf(WeightScale);
});

test('WeightScale can be instantiated without arguments or environment variables when setting file is available', () => {
    delete process.env.HEALTHPLANET_CLIENT_ID;
    delete process.env.HEALTHPLANET_CLIENT_SECRET;
    delete process.env.HEALTHPLANET_ACCESS_TOKEN;
    delete process.env.HEALTHPLANET_REFRESH_TOKEN;
    delete process.env.HEALTHPLANET_EXPIRATION;

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((filepath) => {
        const tokensPath = path.join(
            process.env.HOME,
            '.healthplanet',
            'tokens.yml'
        );
        if (filepath === tokensPath) {
            return JSON.stringify({
                access_token: 'dummy_access_token',
                refresh_token: 'dummy_refrsh_token',
                expiration: new Date().getTime() + 3600000,
            });
        }
        const credentialsPath = path.join(
            process.env.HOME,
            '.healthplanet',
            'credentials.yml'
        );
        if (filepath === credentialsPath) {
            return JSON.stringify({
                client_id: 'dummy_client_id',
                client_secret: 'dummy_client_secret',
            });
        }
    });

    const weightScale = new WeightScale();

    expect(fs.existsSync.mock.calls.length).toBe(2);
    expect(fs.readFileSync.mock.calls.length).toBe(2);
    expect(weightScale).toBeInstanceOf(WeightScale);
});

test('constructor throws error when credentials for healthplanet are not specified in any of above ways.', () => {
    delete process.env.HEALTHPLANET_CLIENT_ID;
    fs.existsSync.mockReturnValueOnce(false);
    expect(() => {
        new WeightScale();
    }).toThrow();
});

test('fetchWeight eventually returns weight', async () => {
    const res = {
        status: 200,
        data: {
            data: [
                {
                    keydata: '123.40',
                    date: '20210909124920',
                },
            ],
        },
    };
    const getMock = jest.fn(() => res);
    axios.create.mockReturnValue({
        get: getMock,
    });

    const weightScale = new WeightScale(
        'dummy_client_id',
        'dummy_client_secret',
        'dummy_access_token',
        'dummy_refresh_token',
        new Date().getTime() + 3600000
    );
    const weight = await weightScale.fetchWeight();

    expect(getMock.mock.calls.length).toBe(1);
    const mockCallArgs = getMock.mock.calls[0];
    expect(mockCallArgs[0]).toBe('/status/innerscan.json');
    expect(mockCallArgs[1].params.access_token).toBe('dummy_access_token');
    expect(weight).toEqual({
        val: '123.4kg',
        date: '2021/09/09 12:49',
    });
});

test('fetchWeight rejects when HealthPlanet server returns error', async () => {
    const res = {
        status: 503,
    };
    const getMock = jest.fn(() => res);
    axios.create.mockReturnValue({
        get: getMock,
    });

    const weightScale = new WeightScale(
        'dummy_client_id',
        'dummy_client_secret',
        'dummy_access_token',
        'dummy_refresh_token',
        new Date().getTime() + 3600000
    );

    await expect(weightScale.fetchWeight()).rejects.toThrow();
    expect(getMock.mock.calls.length).toBe(1);
    const mockCallArgs = getMock.mock.calls[0];
    expect(mockCallArgs[0]).toBe('/status/innerscan.json');
    expect(mockCallArgs[1].params.access_token).toBe('dummy_access_token');
});

test('updateToken do nothing when expiration has not passed', async () => {
    const nowMock = new Date(1631191100000);
    jest.spyOn(global, 'Date').mockImplementation(() => nowMock);

    axios.create.mockReturnValue({});
    const weightScale = new WeightScale(
        'dummy_client_id',
        'dummy_client_secret',
        'dummy_access_token',
        'dummy_refresh_token',
        nowMock.getTime() + 1
    );
    weightScale.updateToken();

    expect(axios.create.mock.calls.length).toBe(1);
    // axios.create() has called, so an instance has created.
    // but the instance is mocked {}.
    // so passing this test means the instance has not been used.
});

test('updateToken updates tokens', async () => {
    const res = {
        status: 200,
        data: {
            access_token: '1631191100000/new_access_token',
            expires_in: 1,
            refresh_token: '1631191100000/new_refresh_token',
        },
    };
    const postMock = jest.fn(() => res);
    axios.create.mockReturnValue({
        post: postMock,
    });

    let nowMock = new Date(1631191100000);
    jest.spyOn(global, 'Date').mockImplementation(() => nowMock);

    process.env.HEALTHPLANET_CLIENT_ID = 'dummy_client_id';
    process.env.HEALTHPLANET_CLIENT_SECRET = 'dummy_client_secret';
    process.env.HEALTHPLANET_ACCESS_TOKEN = 'old_access_token';
    process.env.HEALTHPLANET_REFRESH_TOKEN = 'old_refresh_token';
    process.env.HEALTHPLANET_EXPIRATION = nowMock.getTime() - 1;
    const weightScale = new WeightScale();

    expect(postMock.mock.calls.length).toBe(0);

    await weightScale.updateToken();
    expect(postMock.mock.calls.length).toBe(1);
    expect(postMock.mock.calls[0][0]).toBe('/oauth/token');
    expect(process.env.HEALTHPLANET_ACCESS_TOKEN).toBe(
        '1631191100000/new_access_token'
    );
    expect(process.env.HEALTHPLANET_REFRESH_TOKEN).toBe(
        '1631191100000/new_refresh_token'
    );
    expect(process.env.HEALTHPLANET_EXPIRATION).toBe(1631191100001);

    await weightScale.updateToken();
    // second call of updateToken() do nothing
    // because expiration has been updated
    expect(postMock.mock.calls.length).toBe(1);
});
