FROM node:22-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# to understand why libc6-compat might be needed for native modules in Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/wt-protocol/package.json ./packages/wt-protocol/
COPY apps/wt-web/package.json ./apps/wt-web/
COPY apps/wt-ide/package.json ./apps/wt-ide/

# Copy clean source code (excluding host node_modules via .dockerignore)
COPY packages/wt-protocol ./packages/wt-protocol
COPY apps/wt-web ./apps/wt-web
COPY apps/wt-ide ./apps/wt-ide

# Install workspace dependencies inside container
RUN pnpm install --frozen-lockfile

# Build protocol & Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:8005
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @worktree/protocol build || true
RUN pnpm --filter wt-web build

# Production Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "--filter", "wt-web", "start"]
