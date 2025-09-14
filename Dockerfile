# ---
# Production Dockerfile for Action Figure Builder
# Uses Node 20 Alpine and pnpm (via Corepack) to install prod deps
# ---

FROM node:20-alpine AS deps
WORKDIR /app

# Enable pnpm via Corepack and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@latest --activate \
  && pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy only what the app needs at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY server.js ./server.js
COPY public ./public

EXPOSE 3000
CMD ["node", "server.js"]

