FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace configs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/wt-protocol/package.json ./packages/wt-protocol/
COPY apps/wt-web/package.json ./apps/wt-web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/wt-protocol ./packages/wt-protocol
COPY apps/wt-web ./apps/wt-web

# Build protocol and web
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @worktree/protocol build || true
RUN pnpm --filter wt-web build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "--filter", "wt-web", "start"]
