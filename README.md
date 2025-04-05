# VyOS DHCP API

VyOS DHCP APIは、VyOSルーターのDHCPリース情報を管理するためのWebアプリケーションです。このアプリケーションを使用すると、DHCPリースの表示や静的マッピングへの変換が簡単に行えます。

## 機能

- DHCPリース情報の表示
- 静的マッピング情報の表示
- リースを静的マッピングとして予約する機能

## 環境変数

アプリケーションを実行するには、以下の環境変数を設定する必要があります：

- `VYOS_API_URL`: VyOS APIのURL（例: https://vyos.example.com/configure）
- `VYOS_API_KEY`: VyOS APIのアクセスキー

## Dockerを使用した実行方法

### Dockerイメージのビルドと実行

```bash
# イメージをビルド
docker build -t vyos-dhcp-api .

# コンテナを実行
docker run -p 3000:3000 \
  -e VYOS_API_URL=https://vyos.example.com/configure \
  -e VYOS_API_KEY=your_api_key \
  vyos-dhcp-api
```

### Docker Composeを使用した実行

1. 環境変数を設定

`.env`ファイルを作成し、必要な環境変数を設定します：

```
VYOS_API_URL=https://vyos.example.com/configure
VYOS_API_KEY=your_api_key
```

2. Docker Composeでアプリケーションを起動

```bash
docker-compose up -d
```

アプリケーションは http://localhost:3000 でアクセスできます。

## 開発環境での実行方法

1. 依存関係をインストール

```bash
npm install
```

2. 環境変数を設定

`.env.local`ファイルを作成し、必要な環境変数を設定します：

```
VYOS_API_URL=https://vyos.example.com/configure
VYOS_API_KEY=your_api_key
```

3. 開発サーバーを起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 でアクセスできます。

## 本番環境用ビルド

```bash
# アプリケーションをビルド
npm run build

# 本番サーバーを起動
npm start
```
