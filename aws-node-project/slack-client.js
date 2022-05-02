'use strict';

class SlackClient {
  #httpClient;

  constructor(axios, slackBotToken) {
    this.#httpClient = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Authorization: `Bearer ${slackBotToken}`,
      },
      responseType: 'json',
      validateStatus: () => true,
    });
  }

  async postMessage(params) {
    const res = await this.#httpClient.post('/chat.postMessage', params);
    if ((res.status < 200) | (300 <= res.status)) {
      console.error(res);
      throw new Error('slack server has returned an irregular response.');
    }
    return res.data;
  }
}

module.exports = SlackClient;
