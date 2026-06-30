FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm ci --workspaces=false && \
    npm ci --workspace=client && \
    npm ci --workspace=server

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/package.json ./client/
COPY --from=builder /app/server/package.json ./server/

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

RUN mkdir -p /data /uploads && chown -R nodejs:nodejs /data /uploads

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data
ENV UPLOAD_DIR=/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD node -e "
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required in production.');
    process.exit(1);
  }
" && node server/dist/index.js