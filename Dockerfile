# syntax = docker/dockerfile:1.4

ARG NODE_VERSION=20

FROM --platform=$TARGETPLATFORM node:${NODE_VERSION}-slim

ARG UID="991"
ARG GID="991"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  libjemalloc-dev libjemalloc2 \
  && ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so \
  && corepack enable \
  && groupadd -g "${GID}" summaly \
  && useradd -l -u "${UID}" -g "${GID}" -m -d /app summaly \
  && find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /u+s -ignore_readdir_race -exec chmod u-s {} \; \
  && find / -type d -path /sys -prune -o -type d -path /proc -prune -o -type f -perm /g+s -ignore_readdir_race -exec chmod g-s {} \; \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists

USER summaly
WORKDIR /app
COPY --chown=summaly:summaly . ./

ENV NODE_ENV=production

RUN corepack install \
  && pnpm i --frozen-lockfile --aggregate-output \
  && pnpm install fastify-cli \
  && corepack pack

ENV COREPACK_ENABLE_NETWORK=0
ENV LD_PRELOAD=/usr/local/lib/libjemalloc.so
ENV MALLOC_CONF=background_thread:true,metadata_thp:auto,dirty_decay_ms:30000,muzzy_decay_ms:30000

CMD ["pnpm", "fastify", "start", "./dist/index.js"]

EXPOSE 3000
