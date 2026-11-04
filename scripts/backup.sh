#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose --env-file deployment/.env -f deployment/compose.yaml exec -T backend bench --site frontend backup --with-files
