#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Prefer project .logs when writable, otherwise fall back to $HOME
PREFERRED_LOG_DIR="$ROOT_DIR/.logs"
FALLBACK_LOG_DIR="$HOME/SISTEMAS-OPERATIVOS-logs"
if mkdir -p "$PREFERRED_LOG_DIR" 2>/dev/null; then
	LOG_DIR="$PREFERRED_LOG_DIR"
else
	mkdir -p "$FALLBACK_LOG_DIR" 2>/dev/null || true
	LOG_DIR="$FALLBACK_LOG_DIR"
fi

echo "Starting SystemD Manager (local dev) — backend on 8081, frontend on 3000"

# Kill existing local instances started by this script (not systemd)
pkill -f "node .*backend/server.js" || true
pkill -f "react-scripts" || true

echo "Starting backend (PORT=8081)..."
nohup env PORT=8081 node "$ROOT_DIR/backend/server.js" > "$LOG_DIR/backend-8081.log" 2>&1 &
sleep 0.8

echo "Starting frontend dev server (PORT=3000)..."
pushd "$ROOT_DIR/frontend" >/dev/null
nohup env PORT=3000 HOST=0.0.0.0 npm start > "$LOG_DIR/frontend-dev.log" 2>&1 &
popd >/dev/null

echo "Started. Logs:"
echo "  Backend: $LOG_DIR/backend-8081.log"
echo "  Frontend: $LOG_DIR/frontend-dev.log"
echo "To stop local instances run: pkill -f 'node .*backend/server.js' && pkill -f react-scripts"

echo "Waiting 1s and showing tail of logs (first 40 lines each)"
sleep 1

echo "--- backend log ---"
tail -n 40 "$LOG_DIR/backend-8081.log" || true

echo "--- frontend log ---"
tail -n 40 "$LOG_DIR/frontend-dev.log" || true

echo "Done. Open http://localhost:3000 (frontend) — backend API: http://localhost:8081/api"
