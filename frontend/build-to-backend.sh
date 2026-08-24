#!/usr/bin/env bash
# Build do Angular já copiado para o backend (servido em /app).
set -e
cd "$(dirname "$0")"
MSYS_NO_PATHCONV=1 npx ng build --output-path ../backend/src/Teleprompt.Api/wwwroot/app --base-href /app/ --output-hashing all

# O builder gera tudo dentro de browser/ — achata para wwwroot/app/.
APP=../backend/src/Teleprompt.Api/wwwroot/app
if [ -d "$APP/browser" ]; then
  cp -r "$APP/browser/." "$APP/"
  rm -rf "$APP/browser" "$APP/prerendered-routes.json"
fi
echo "OK → backend/src/Teleprompt.Api/wwwroot/app"
