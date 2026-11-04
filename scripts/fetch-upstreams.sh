#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p vendor
if [ ! -d vendor/buildsuite_core/.git ]; then
  git clone https://github.com/BuildSuite-io/buildsuite_core.git vendor/buildsuite_core
fi
git -C vendor/buildsuite_core fetch origin b93246cd4e9bc365ff2eafd8f6b6a72999134502
git -C vendor/buildsuite_core checkout --detach b93246cd4e9bc365ff2eafd8f6b6a72999134502
