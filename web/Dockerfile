FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
# 방문 기록 토큰 — Next.js 미들웨어(엣지 런타임)는 빌드 때 값을 굳혀 넣는 경우가 있어
# 빌드 시점과 실행 시점 양쪽에 모두 넣어 둔다.
ARG TRAFFIC_TOKEN=""
ENV TRAFFIC_TOKEN=$TRAFFIC_TOKEN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN mkdir -p node_modules/.prisma && cp -r $(find node_modules/.pnpm -path '*/.prisma/client' -type d | head -1) node_modules/.prisma/client
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm i -g prisma@6 tsx
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "server.js"]
