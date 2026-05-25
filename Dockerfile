FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV AA_TRANSLATOR_HOST=0.0.0.0
ENV AA_TRANSLATOR_PORT=3000
ENV AA_TRANSLATOR_DATA_DIR=/app/data

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "--env-file-if-exists=.env", "dist/server/src/server/node-entry.js"]
