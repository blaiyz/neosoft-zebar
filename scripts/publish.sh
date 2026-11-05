#!/usr/bin/env bash
# Publishes build/ with the Zebar CLI. Takes a JSON file with the release's
# tagName, body and url. The publish and rehearsal workflows both run this, so
# the rehearsal covers the real command. The notes use `=` because the CLI
# reads a separate value that starts with a hyphen as a flag.
set -euo pipefail

release=$1

zebar publish --pack-config ./build/zpack.json \
  --version-override "$(jq -r '.tagName | ltrimstr("v")' "$release")" \
  --commit-sha "$(git rev-parse --short HEAD)" \
  --release-notes="$(jq -r .body "$release")" \
  --release-url "$(jq -r .url "$release")" \
  --api-url "${ZEBAR_API_URL:-https://api.glzr.io}"
