#!/usr/bin/env bash
# Diagnóstico rápido do estado da VM Teleprompt (não altera nada).
set -uo pipefail
DOMAIN="api.teleprompt.zecki1.com.br"

echo "================= 1) Container ================="
docker ps -a --filter "name=backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1 || echo "(docker indisponivel)"

echo
echo "================= 2) Backend direto (127.0.0.1:5000) ================="
curl -s -o /dev/null -w "  /health   -> HTTP %{http_code}\n" --max-time 5 http://127.0.0.1:5000/health || echo "  /health   -> SEM RESPOSTA"
curl -s -o /dev/null -w "  /swagger  -> HTTP %{http_code}\n" --max-time 5 http://127.0.0.1:5000/swagger/v1/swagger.json || echo "  /swagger  -> SEM RESPOSTA"

echo
echo "================= 3) Logs do backend (firebase/sync/erros) ================="
docker compose -f "$HOME/Teleprompt/docker-compose.api.yml" logs --tail 300 backend 2>&1 \
  | grep -iE "firebase|sync|error|fail|exception|warn|now listening" | tail -35 || echo "(sem logs ou container parado)"

echo
echo "================= 4) nginx ================="
ls -la /etc/nginx/sites-enabled/ 2>&1
sudo nginx -t 2>&1 | tail -3
echo "  - ss -ltnp (listeners):"
ss -ltnp 2>/dev/null | grep -E ":80|:443|:5000" || true

echo
echo "================= 5) Certificado ================="
sudo test -d "/etc/letsencrypt/live/$DOMAIN" && echo "  CERT OK: /etc/letsencrypt/live/$DOMAIN" || echo "  SEM certificado (certbot ainda nao rodou)"

echo
echo "================= 6) Testes externos ================="
curl -s -o /dev/null -w "  https://$DOMAIN/health -> HTTP %{http_code}\n" --max-time 8 "https://$DOMAIN/health" || echo "  https://$DOMAIN/health  -> SEM RESPOSTA"
curl -s -o /dev/null -w "  http://$DOMAIN:80      -> HTTP %{http_code}\n" --max-time 8 "http://$DOMAIN/" || echo "  http://$DOMAIN          -> SEM RESPOSTA"