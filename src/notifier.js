'use strict';

const axios = require('axios');

class Notifier {
    #http;

    constructor(slackBotToken) {
        this.#http = axios.create({
            baseURL: 'https://slack.com/api',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                Authorization: `Bearer ${slackBotToken}`,
            },
            responseType: 'json',
            validateStatus: () => true,
        });
    }

    async postMessageToSlack(params) {
        const res = await this.#http.post('/chat.postMessage', params);
        if (res.status < 200 || 300 <= res.status) {
            console.error(res);
            throw new Error('"slack.com" has returned an irregular response.');
        }
        return res.data;
    }
}

module.exports = Notifier;
