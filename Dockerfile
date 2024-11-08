FROM node:20-slim AS builder

WORKDIR /app

COPY ./ ./
RUN corepack enable \
 && pnpm i --frozen-lockfile --aggregate-output \
 && NODE_ENV=production pnpm run build

FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN corepack enable \
 && pnpm i --frozen-lockfile --aggregate-output

COPY --from=builder /app/dist ./dist

CMD ["pnpm", "run", "serve"]

EXPOSE 3000
