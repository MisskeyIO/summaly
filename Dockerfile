# syntax = docker/dockerfile:1.4

ARG NODE_VERSION=20

FROM --platform=$TARGETPLATFORM node:${NODE_VERSION}-slim

WORKDIR /app
COPY ./ ./

ENV NODE_ENV=production
RUN corepack enable \
 && pnpm i --frozen-lockfile --aggregate-output \
 && pnpm install fastify-cli

RUN corepack pack
ENV COREPACK_ENABLE_NETWORK=0

CMD ["pnpm", "fastify", "start", "./dist/index.js"]

EXPOSE 3000
