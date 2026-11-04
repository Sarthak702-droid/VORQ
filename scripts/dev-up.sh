#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f deployment/.env ]; then
  umask 077
  python3 - <<'PY'
import secrets
from pathlib import Path
Path('deployment/.env').write_text('DB_PASSWORD='+secrets.token_urlsafe(24)+'\nADMIN_PASSWORD='+secrets.token_urlsafe(24)+'\n')
PY
fi
[ -d vendor/buildsuite_core ] || bash scripts/fetch-upstreams.sh
docker build -f deployment/Dockerfile -t vorq/erpnext:dev .
docker compose --env-file deployment/.env -f deployment/compose.yaml up -d
printf '%s\n' 'Backend: http://127.0.0.1:18080' 'Frontend: run npm ci && npm run dev' 'Development admin password: deployment/.env (never commit it)'
