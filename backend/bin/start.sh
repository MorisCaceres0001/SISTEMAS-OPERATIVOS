#!/usr/bin/env bash
# Script simple para arrancar el backend cargando .env
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."
cd "$ROOT_DIR"

# Cargar .env si existe
if [ -f ".env" ]; then
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

NODE_BIN=$(command -v node || echo "/usr/bin/node")
if [ ! -x "$NODE_BIN" ]; then
  echo "Node no encontrado en PATH: $NODE_BIN" >&2
  exit 1
fi

# Ejecutar
exec "$NODE_BIN" server.js
