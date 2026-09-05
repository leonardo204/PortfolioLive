FROM node:20-alpine AS base
# pnpm 버전을 고정한다. latest로 두면 새 pnpm이 나올 때마다 빌드가 깨진다.
# (pnpm 11은 Node 20에서 돌지 않는다.) 로컬에서 잠금 파일을 만든 버전과 맞춘다.
RUN corepack enable && corepack prepare pnpm@10.6.4 --activate
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
