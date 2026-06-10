# ──────────────────────────────────────────────────────────────
# Multi-stage build for NOCTURNE.
# Stage 1: Node 20-alpine builds the Vite bundle.
# Stage 2: nginx-alpine serves the static dist/ — tiny + fast cold start.
#
# Build-time secrets:
#   VITE_HA_URL    — Home Assistant base URL (e.g. http://192.168.1.141:8123)
#   VITE_HA_TOKEN  — long-lived access token
# Vite inlines these at build time, so they MUST be passed as --build-arg
# (or `args:` in docker-compose / Portainer stack env vars).
# ──────────────────────────────────────────────────────────────

FROM node:20-alpine AS build
WORKDIR /app

# Cache deps separately from source.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Receive HA credentials and expose them to the Vite build.
ARG VITE_HA_URL
ARG VITE_HA_TOKEN
ENV VITE_HA_URL=$VITE_HA_URL
ENV VITE_HA_TOKEN=$VITE_HA_TOKEN

COPY . .
RUN npm run build

# ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
LABEL org.opencontainers.image.title="nocturne"
LABEL org.opencontainers.image.description="NOCTURNE — smart-home command-deck dashboard"
LABEL org.opencontainers.image.source="https://github.com/rmupfumira/kitchen-dashboard"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
