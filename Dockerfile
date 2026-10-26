FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENTRYPOINT ["node", "dist/index.js"]
