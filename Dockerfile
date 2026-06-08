# ──────────────────────────────────────────────────────────────
# Multi-stage build for the Smart Home Dashboard.
# Stage 1 builds the Vite bundle on Node 20-alpine.
# Stage 2 serves the static output with nginx-alpine — tiny image,
# fast cold start, perfect for Portainer / homelab deployment.
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS build
WORKDIR /app

# Copy manifests first so npm-install caches as a separate layer.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Then the rest of the source and produce the dist/ bundle.
COPY . .
RUN npm run build

# ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
LABEL org.opencontainers.image.title="dashboard-react"
LABEL org.opencontainers.image.description="Family smart-home dashboard (Vite + React)"
LABEL org.opencontainers.image.source="https://github.com/your-user/dashboard-react"

# Custom config: SPA fallback + sensible caching headers.
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
