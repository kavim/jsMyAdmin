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

RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/package.json ./client/
COPY --from=builder /app/server/package.json ./server/

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

RUN mkdir -p /tmp/jsmyadmin/uploads && chown -R nodejs:nodejs /tmp/jsmyadmin

USER nodejs

ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=/tmp/jsmyadmin/uploads

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server/dist/index.js"]