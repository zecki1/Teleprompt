#!/usr/bin/env bash
# =============================================================================
# Deploy completo do backend Teleprompt na VM GCP (idempotente).
#
# PRÉ-REQUISITOS (rodar no Cloud Shell ANTES deste script):
#   1. Upload da service account p/ o Cloud Shell (botão "Upload File"): ~/firebase-service-account.json
#   2. gcloud compute ssh --zone=us-central1-a vps-projeto-final --command="mkdir -p ~/Teleprompt/secrets"
#   3. gcloud compute scp --zone=us-central1-a ~/firebase-service-account.json \
#        zeckiregino1@vps-projeto-final:~/Teleprompt/secrets/firebase-service-account.json
#   4. Abrir o firewall (Cloud Shell):
#        gcloud compute firewall-rules-create allow-https --allow=tcp:443 --description="HTTPS API" || true
#
# EXECUÇÃO:
#   Dentro da VM:   cd ~/Teleprompt && git pull && bash scripts/deploy-vm.sh
# =============================================================================
set -euo pipefail

DOMAIN="api.teleprompt.zecki1.com.br"
EMAIL="admin@zecki1.com.br"
DIR="$HOME/Teleprompt"
SA="$DIR/secrets/firebase-service-account.json"

cd "$DIR"
echo "==> [1/8] Atualizando o repo (branch dotnet) e preparando pasta"
git fetch origin
git switch dotnet 2>/dev/null || git checkout dotnet
git pull --ff-only
mkdir -p secrets data
echo "    - Commit atual: $(git rev-parse --short HEAD) em $(pwd)"

if [ ! -s "$SA" ]; then
  echo ""
  echo "ERRO: $SA não existe."
  echo "Sem a service account o sync do Firestore NÃO roda e as contas do Firebase"
  echo "não são importadas (o ezequiel.rmoncao@sp.senai.br não consegue entrar)."
  echo "Siga os passos 1-3 da seção PRÉ-REQUISITOS e rode o script de novo."
  exit 1
fi
echo "==> [2/8] Service account OK: $SA ($(wc -c < "$SA") bytes)"

BE_ENV="$DIR/secrets/backend.env"
echo "==> [3/8] Garantindo chave JWT segura (auto-geração idempotente)"
if [ ! -f "$BE_ENV" ]; then
  if [ -f "$DIR/backend/secrets.env.example" ]; then
    cp "$DIR/backend/secrets.env.example" "$BE_ENV"
  else
    touch "$BE_ENV"
  fi
fi
if grep -qE '^JWT_KEY=(COLOQUE_UMA_CHAVE|)$' "$BE_ENV"; then
  NEW_JWT="$(openssl rand -base64 48 | tr -d '\n')"
  if grep -qE '^JWT_KEY=' "$BE_ENV"; then
    sed -i "s#^JWT_KEY=.*#JWT_KEY=$NEW_JWT#" "$BE_ENV"
  else
    printf 'JWT_KEY=%s\n' "$NEW_JWT" >> "$BE_ENV"
  fi
  echo "    - JWT_KEY gerada e salva em secrets/backend.env (mantida entre deploys)."
fi
JWT_KEY="$(grep -E '^JWT_KEY=' "$BE_ENV" | head -1 | cut -d= -f2-)"
[ -n "$JWT_KEY" ] || { echo "ERRO: JWT_KEY vazia em $BE_ENV"; exit 1; }
export JWT_KEY
# Também grava em .env (raiz) para o docker compose interpolar em comandos
# manuais (ps/logs/up) sem depender de export — arquivo ignorado pelo git.
if [ ! -f "$DIR/.env" ] || ! grep -qE '^JWT_KEY=' "$DIR/.env"; then
  printf 'JWT_KEY=%s\n' "$JWT_KEY" > "$DIR/.env"
fi

echo "==> [4/8] Subindo o container (build + background)"
sudo systemctl start docker || sudo service docker start || true
docker compose -f docker-compose.api.yml up -d --build
docker compose -f docker-compose.api.yml ps

echo "==> [5/8] Aguardando boot e coletando logs de Firebase/sync"
for i in $(seq 1 20); do
  if curl -sf -o /dev/null http://127.0.0.1:5000/health; then
    echo "    - API de pé após ${i}s (health OK)"
    break
  fi
  sleep 1
done
echo "    - Logs relevantes (Firebase/sync/erro):"
docker compose -f docker-compose.api.yml logs --tail 400 backend \
  | grep -iE "firebase|sync|erro|error|fail|exception|warn" | tail -40 || true

echo "==> [6/8] nginx + certbot (HTTPS)"
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y nginx
fi
if ! command -v certbot >/dev/null 2>&1; then
  sudo apt-get install -y certbot python3-certbot-nginx
fi
sudo cp "$DIR/deploy/api-nginx.conf" "/etc/nginx/sites-available/$DOMAIN"
sudo ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx || sudo systemctl restart nginx

if ! sudo test -d "/etc/letsencrypt/live/$DOMAIN"; then
  echo "    - Emitindo certificado SSL (Let's Encrypt)..."
  sudo certbot --nginx -d "$DOMAIN" --agree-tos -m "$EMAIL" --non-interactive --redirect
else
  echo "    - Certificado já existe; reemitindo/garantindo..."
  sudo certbot --nginx -d "$DOMAIN" --agree-tos -m "$EMAIL" --non-interactive --redirect
fi
sudo systemctl reload nginx

echo "==> [7/8] Verificação externa"
curl -s -o /dev/null -w "    - https://$DOMAIN/swagger/v1/swagger.json -> HTTP %{http_code}\n" "https://$DOMAIN/swagger/v1/swagger.json" || true
curl -s -o /dev/null -w "    - https://$DOMAIN/health          -> HTTP %{http_code}\n" "https://$DOMAIN/health" || true
docker compose -f docker-compose.api.yml ps

echo "==> [8/8] Resumo"
echo "    - API pública: https://$DOMAIN (swagger em /swagger)"
echo "    - Chave JWT: secrets/backend.env (gerada automaticamente; não commitar)"
echo "    - Contas importadas do Firestore usam a senha temporária: Migrated@Temp123!"
echo "      (troque depois no Perfil)."
echo "    - Logs ao vivo: docker compose -f docker-compose.api.yml logs -f --tail 200 backend"
echo "    - Sync manual:  POST /api/v1/admin/firebase/sync (SuperAdmin) — logs no console da API."
echo "FEITO."