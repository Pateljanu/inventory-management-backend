# syntax=docker/dockerfile:1

# ---------- base ----------
FROM node:22-alpine AS base
WORKDIR /app

# ---------- production dependencies (from the committed lockfile) ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- development image (used by docker-compose.dev.yml) ----------
# Includes dev dependencies (nodemon, pino-pretty, vitest); source is bind-mounted at runtime.
FROM base AS dev
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---------- production image (default target) ----------
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
# Never run as root. Secrets are injected at runtime by the platform, never baked into the image.
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/health/live').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/server.js"]
