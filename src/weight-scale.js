'use strict';

const axios = require('axios');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

class WeightScale {
    #baseUrl;
    #http;
    #client_id;
    #client_secret;
    #access_token;
    #refresh_token;
    #expiration;
    #credentials_specified_by;

    constructor(
        client_id,
        client_secret,
        access_token,
        refresh_token,
        expiration
    ) {
        if (
            client_id &&
            client_secret &&
            access_token &&
            refresh_token &&
            expiration
        ) {
            this.#client_id = client_id;
            this.#client_secret = client_secret;
            this.#access_token = access_token;
            this.#refresh_token = refresh_token;
            this.#expiration = expiration;
            this.#credentials_specified_by = 'ARGS';
        } else if (this.#credentials_are_set_in_env_vars()) {
            // in this case, necessary fields are set in the method above.
            this.#credentials_specified_by = 'ENV_VARS';
        } else if (this.#credentials_are_set_in_setting_files()) {
            // in this case, necessary fields are set in the method above.
            this.#credentials_specified_by = 'FILES';
        } else {
            throw new Error('credentials for healthplanet must be specified.');
        }

        this.#baseUrl = 'https://www.healthplanet.jp';
        this.#http = axios.create({
            baseURL: this.#baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
            responseType: 'json',
            validateStatus: () => true,
        });
    }

    #credentials_are_set_in_env_vars() {
        if (
            !process.env.HEALTHPLANET_CLIENT_ID ||
            !process.env.HEALTHPLANET_CLIENT_SECRET ||
            !process.env.HEALTHPLANET_ACCESS_TOKEN ||
            !process.env.HEALTHPLANET_REFRESH_TOKEN ||
            !process.env.HEALTHPLANET_EXPIRATION
        )
            return false;

        this.#client_id = process.env.HEALTHPLANET_CLIENT_ID;
        this.#client_secret = process.env.HEALTHPLANET_CLIENT_SECRET;
        this.#access_token = process.env.HEALTHPLANET_ACCESS_TOKEN;
        this.#refresh_token = process.env.HEALTHPLANET_REFRESH_TOKEN;
        this.#expiration = process.env.HEALTHPLANET_EXPIRATION;
        return true;
    }

    #credentials_are_set_in_setting_files() {
        const credentialsPath = path.join(
            process.env.HOME,
            '.healthplanet',
            'credentials.yml'
        );
        const tokensPath = path.join(
            process.env.HOME,
            '.healthplanet',
            'tokens.yml'
        );
        if (!fs.existsSync(credentialsPath) || !fs.existsSync(tokensPath))
            return false;

        const credentials = yaml.load(fs.readFileSync(credentialsPath, 'utf8'));
        const tokens = yaml.load(fs.readFileSync(tokensPath, 'utf8'));
        if (
            !credentials.client_id ||
            !credentials.client_secret ||
            !tokens.access_token ||
            !tokens.refresh_token ||
            !tokens.expiration
        )
            return false;

        this.#client_id = credentials.client_id;
        this.#client_secret = credentials.client_secret;
        this.#access_token = tokens.access_token;
        this.#refresh_token = tokens.refresh_token;
        this.#expiration = tokens.expiration;
        return true;
    }

    #formatDate(str) {
        const year = str.slice(0, 4);
        const month = str.slice(4, 6);
        const date = str.slice(6, 8);
        const hour = str.slice(8, 10);
        const minute = str.slice(10, 12);
        return `${year}/${month}/${date} ${hour}:${minute}`;
    }

    async updateToken() {
        if (new Date().getTime() < this.#expiration) {
            return;
        }
        const params = {
            client_id: this.#client_id,
            client_secret: this.#client_secret,
            redirect_uri: 'localhost',
            grant_type: 'refresh_token',
            refresh_token: this.#refresh_token,
        };
        const res = await this.#http.post('/oauth/token', {}, { params });
        if (res.status < 200 || 300 <= res.status) {
            console.error(res);
            throw new Error(
                'could not refresh access token for "www.healthplanet.jp".'
            );
        }
        this.#access_token = res.data.access_token;
        this.#refresh_token = res.data.refresh_token;
        this.#expiration =
            parseInt(this.#access_token.split('/')[0]) + res.data.expires_in;
        this.#updateToken();
    }

    #updateToken() {
        if (this.#credentials_specified_by === 'ENV_VARS') {
            process.env.HEALTHPLANET_ACCESS_TOKEN = this.#access_token;
            process.env.HEALTHPLANET_REFRESH_TOKEN = this.#refresh_token;
            process.env.HEALTHPLANET_EXPIRATION = this.#expiration;
        }
        if (this.#credentials_specified_by === 'FILES') {
            const tokensPath = path.join(
                process.env.HOME,
                '.healthplanet',
                'tokens.yml'
            );
            fs.writeFileSync(
                tokensPath,
                yaml.dump({
                    access_token: this.#access_token,
                    refresh_token: this.#refresh_token,
                    expiration: this.#expiration,
                })
            );
        }
    }

    async fetchWeight() {
        await this.updateToken();
        const params = {
            access_token: this.#access_token,
            date: '1',
            tag: '6021',
        };
        const res = await this.#http.get('/status/innerscan.json', { params });
        if (res.status < 200 || 300 <= res.status) {
            console.error(res);
            throw new Error(
                '"www.healthplanet.jp" has returned an irregular response.'
            );
        }
        const newest = res.data.data[0];
        return {
            val: parseFloat(newest.keydata).toFixed(1) + 'kg',
            date: this.#formatDate(newest.date),
        };
    }
}

module.exports = WeightScale;
