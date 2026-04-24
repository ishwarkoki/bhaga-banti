FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@10.18.1

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY package.json pnpm-lock.yaml ./

RUN pnpm build && pnpm prune --prod

FROM base AS runtime

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:generate && pnpm db:push && pnpm auth:generate && node dist/app.js"]
