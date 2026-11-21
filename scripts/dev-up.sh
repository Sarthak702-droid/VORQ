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
# Existing sites also need new DocTypes/hooks when the application image changes.
docker compose --env-file deployment/.env -f deployment/compose.yaml wait create-site
docker compose --env-file deployment/.env -f deployment/compose.yaml exec -T backend bench --site frontend migrate
docker compose --env-file deployment/.env -f deployment/compose.yaml restart backend queue-long queue-short scheduler
# Nginx resolves upstream addresses at startup; backend restart can change its IP.
docker compose --env-file deployment/.env -f deployment/compose.yaml restart frontend
python3 scripts/verify-auth-deployment.py
printf '%s\n' 'Backend: http://127.0.0.1:18080' 'Frontend: run npm ci && npm run dev' 'Development admin password: deployment/.env (never commit it)'
