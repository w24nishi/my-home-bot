'use strict';

const Thermometer = require('./thermometer');
const WeightScale = require('./weight-scale');

let thermometer = null;
let weightScale = null;

async function respondToMessage(req, notifier) {
    const message = req.body.event.text;
    const items = [];
    const promises = [];
    if (message.includes('室温')) {
        items.push('室温');
        thermometer ||
            (thermometer = new Thermometer(process.env.NATURE_REMO_TOKEN));
        promises.push(thermometer.fetchTemperature());
    }
    if (message.includes('体重')) {
        items.push('体重');
        weightScale || (weightScale = new WeightScale());
        promises.push(weightScale.fetchWeight());
    }
    if (promises.length < 1) return;

    const fetchResults = await Promise.allSettled(promises);

    const attachments = [];
    for (let i = 0; i < fetchResults.length; i++) {
        const item = items[i];
        const fetchResult = fetchResults[i];
        if (fetchResult.status === 'fulfilled') {
            const data = fetchResult.value;
            attachments.push({
                text: `${item}は ${data.val} です。（${data.date} 現在）`,
            });
        } else {
            attachments.push({
                text: `${item}の取得に失敗しました。`,
            });
        }
    }

    const params = {
        channel: req.body.event.channel,
        attachments,
    };
    return await notifier.postMessageToSlack(params);
}

module.exports.respondToMessage = respondToMessage;
