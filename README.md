# My Home Bot

Nature Remoとタニタの体組成計の利用者は、それぞれのセンサー情報をWeb APIで取得できます。
これらを取得して報告するSlack Botです。

## 動作環境

Raspberry Pi 上の Node.js 16.8.0 で動作させることを想定していますが、似たような環境であればだいたい動くと思います。
Nodeのバージョンは12程度以降であれば動くと思います。（未確認）

## データ取得のための設定

### 室温取得のための設定

室温を取得するのに[Nature Remo](https://nature.global/)を利用します。
[API概要](https://developer.nature.global/)を参照してアクセストークンを取得し、取得したトークンを `NATURE_REMO_TOKEN` 環境変数に設定します。

```bash
$ export NATURE_REMO_TOKEN=[取得したトークン]
```

### 体重取得のための設定

体重を取得するのに[タニタ](https://shop.tanita.co.jp/shop/)の体組成計を利用します。
[HealthPlanet](https://www.healthplanet.jp/)にユーザ登録し、[API仕様](https://www.healthplanet.jp/apis/api.html)を参照して

- `client_id`
- `client_secret`
- `access_token`
- `refresh_token`
- `expiration`

を取得します。
ただし、 `access_token` と `refresh_token` は、 `client_id` と `client_secret` を使って `/oauth/token` から取得します。

`access_token` は `"(timestamp)/(token)"` の形式になっているので、そのtimestampの値と、 `/oauth/token` からのレスポンスに含まれる `expires_in` を足した値を `expiration` とします。

これらの値は、環境変数

- `HEALTHPLANET_CLIENT_ID`
- `HEALTHPLANET_CLIENT_SECRET`
- `HEALTHPLANET_ACCESS_TOKEN`
- `HEALTHPLANET_REFRESH_TOKEN`
- `HEALTHPLANET_EXPIRATION`

にそれぞれ設定するか、もしくはBotを実行するユーザの
`$HOME/.healthplanet/credentials.yml` に `client_id` と `client_secret` を、
`$HOME/.healthplanet/tokens.yml` に `access_token` と `refresh_token` と `expiration` を、それぞれYAML形式で記述します。

環境変数

- `HEALTHPLANET_ACCESS_TOKEN`
- `HEALTHPLANET_REFRESH_TOKEN`
- `HEALTHPLANET_EXPIRATION`

もしくは `tokens.yml` は、Botによって更新されることがあります。

## Slack投稿の設定

新規Slack AppにBots機能を付与し、 Bot Token Scopes の `app_mentions:read` と `chat:write` を許可します。

"OAuth & Permissions" に表示される AppBot User OAuth Token と、
"Basic Information" に表示される Signing Secret を、それぞれ環境変数

- `SLACK_BOT_TOKEN_PROD`
- `SLACK_SIGNING_SECRET_PROD`

に設定します。

## 利用方法

適当なディレクトリにリポジトリをcloneし、

```bash
$ cd my-home-bot
$ npm install --production
$ node src/server.js
```

で、ポート番号8080でサーバが起動します。
Slack App の設定で Event Subscriptions を有効化し、 Request URL に実行環境の8080番ポートを指定します。

実行環境がNAT内にあるなどの理由でSlackから直接アクセスできない場合は、[ngrok](https://ngrok.com/)を使うのがおすすめです。

"Subscribe to bot events" で `app_mention` のsubscriptionを設定すれば、準備完了です。
ワークスペースにBotをインストールし、任意のチャンネルにBotを追加し、Botをメンションして室温と体重を尋ねれば答えてくれます。

## License

[The MIT License](./LICENSE)
