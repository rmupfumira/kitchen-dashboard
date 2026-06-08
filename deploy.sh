#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# deploy.sh — one-shot local deploy / restart of the dashboard.
#
# Usage:
#   ./deploy.sh                 # build + start, host port 8080
#   DASHBOARD_PORT=9000 ./deploy.sh
#   ./deploy.sh logs            # tail logs
#   ./deploy.sh stop            # stop the stack
#   ./deploy.sh pull            # git pull then redeploy (for Portainer-less LAN use)
#
# Portainer note: you can skip this script entirely and add this repo as a
# Stack in Portainer → Stacks → Git repository → Compose path: docker-compose.yml.
# Portainer will git-pull + rebuild on its own schedule.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"

# Resolve `docker compose` v2 (preferred) vs `docker-compose` v1 (fallback).
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERROR: docker compose plugin not found." >&2
  exit 1
fi

cmd="${1:-up}"

case "$cmd" in
  up|start|deploy)
    echo "▸ Building image and starting container…"
    $COMPOSE up -d --build
    echo
    echo "✔ Dashboard is up at http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo localhost):${DASHBOARD_PORT:-8080}"
    echo "  Health: $($COMPOSE ps --format json 2>/dev/null | head -c 100 || true)"
    ;;
  stop|down)
    echo "▸ Stopping…"
    $COMPOSE down
    ;;
  restart)
    echo "▸ Restarting…"
    $COMPOSE down
    $COMPOSE up -d --build
    ;;
  logs)
    $COMPOSE logs -f --tail=200
    ;;
  pull)
    echo "▸ Pulling latest from git…"
    git pull --ff-only
    $COMPOSE up -d --build
    ;;
  *)
    echo "Usage: $0 [up|stop|restart|logs|pull]" >&2
    exit 2
    ;;
esac
