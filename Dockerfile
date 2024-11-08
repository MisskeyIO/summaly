FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY ./ ./
RUN corepack enable \
 && pnpm setup \
 && pnpm i --frozen-lockfile --aggregate-output \
 && pnpm install -g fastify-cli

CMD ["pnpm", "fastify", "start", "./dist/index.js"]

EXPOSE 3000
