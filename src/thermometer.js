'use strict';

const axios = require('axios');

class Thermometer {
    #baseUrl;
    #http;

    constructor(natureRemoToken) {
        if (!natureRemoToken) {
            throw Error('Bearer token for Nature Remo must be specified.');
        }
        this.#baseUrl = 'https://api.nature.global';
        this.#http = axios.create({
            baseURL: this.#baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${natureRemoToken}`,
            },
            responseType: 'json',
            validateStatus: () => true,
        });
    }

    async fetchTemperature() {
        const res = await this.#http.get('/1/devices');
        if (res.status < 200 || 300 <= res.status) {
            console.error(res);
            throw new Error(
                `${this.#baseUrl} has returned an irregular response.`
            );
        }
        const te = res.data[0].newest_events.te;
        const createdAt = new Date(te.created_at);

        return {
            val: te.val.toFixed(1) + '℃',
            date: this.#formDate(createdAt),
        };
    }

    #pad(str, len) {
        return ('0000' + str).slice(-len);
    }

    #formDate(createdAt) {
        const year = this.#pad(createdAt.getFullYear(), 4);
        const month = this.#pad(createdAt.getMonth() + 1, 2);
        const date = this.#pad(createdAt.getDate(), 2);
        const minute = this.#pad(createdAt.getHours(), 2);
        const second = this.#pad(createdAt.getMinutes(), 2);
        return `${year}/${month}/${date} ${minute}:${second}`;
    }
}

module.exports = Thermometer;
