# ビルドステージ
FROM node:18-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# 実行ステージ
FROM node:18-alpine AS runner

# 作業ディレクトリを設定
WORKDIR /app

# 本番環境用の設定
ENV NODE_ENV production

# 必要なファイルのみをコピー
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 非rootユーザーを使用してセキュリティを向上
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# ポートを公開
EXPOSE 3000

# 環境変数の設定（実行時にオーバーライド可能）
ENV VYOS_API_URL=""
ENV VYOS_API_KEY=""

# アプリケーションを起動
CMD ["npm", "start"]
