'use strict';

const axiosBase = require('axios');
const axios = axiosBase.create({
    baseURL: 'https://slack.com/api',
    headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
    responseType: 'json',
    validateStatus: () => true,
});

async function postMessageToSlack(attachments) {
    const params = {
        channel: 'CEXR1P9MW',
        attachments,
    };
    const res = await axios.post('/chat.postMessage', params);
    if (res.status < 200 || 300 <= res.status) {
        console.error(res);
        throw new Error('"slack.com" has returned an irregular response.');
    }
    return res.data;
}

module.exports.postMessageToSlack = postMessageToSlack;
