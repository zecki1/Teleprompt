#!/usr/bin/env bash
# ============================================================
# Setup do servidor Oracle Cloud (Ubuntu 24.04 ARM) — Teleprompt
# Uso (no servidor): sudo bash oracle-server-setup.sh [dominio]
#   dominio é opcional; se informado, já configura o Nginx para ele.
# ============================================================
set -euo pipefail

DOMAIN="${1:-_}"

echo "==> [1/7] Atualizando sistema…"
apt-get update -qq && apt-get upgrade -y -qq

echo "==> [2/7] Instalando runtime .NET 10 (arm64)…"
if ! command -v dotnet >/dev/null 2>&1; then
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 10.0 --runtime aspnetcore --install-dir /usr/share/dotnet
  ln -sf /usr/share/dotnet/dotnet /usr/local/bin/dotnet
fi
dotnet --list-runtimes

echo "==> [3/7] Instalando Nginx e Certbot…"
apt-get install -y -qq nginx certbot python3-certbot-nginx

echo "==> [4/7] Criando estrutura em /opt/teleprompt…"
mkdir -p /opt/teleprompt/{app,data,wwwroot}
id -u teleprompt >/dev/null 2>&1 || useradd --system --home /opt/teleprompt teleprompt
chown -R teleprompt:teleprompt /opt/teleprompt

echo "==> [5/7] Firewall local (além das regras da nuvem)…"
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
netfilter-persistent save 2>/dev/null || iptables-save > /etc/iptables/rules.v4

echo "==> [6/7] Serviço systemd…"
cat > /etc/systemd/system/teleprompt.service <<'UNIT'
[Unit]
Description=Teleprompt API (.NET)
After=network.target

[Service]
WorkingDirectory=/opt/teleprompt/app
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:8080
ExecStart=/usr/local/bin/dotnet /opt/teleprompt/app/Teleprompt.Api.dll
Restart=always
RestartSec=5
User=teleprompt
SyslogIdentifier=teleprompt

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now teleprompt 2>/dev/null || true

echo "==> [7/7] Nginx (reverse proxy)…"
SERVER_NAME="server_name _;"
if [ "$DOMAIN" != "_" ]; then SERVER_NAME="server_name ${DOMAIN};"; fi
cat > /etc/nginx/sites-available/teleprompt <<NGINX
server {
    listen 80;
    ${SERVER_NAME}

    client_max_body_size 25M;
    proxy_http_version 1.1;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }

    # SignalR (websockets)
    location /hubs/ {
        proxy_pass          http://127.0.0.1:8080;
        proxy_set_header    Host \$host;
        proxy_set_header    X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto \$scheme;
        proxy_set_header    Upgrade \$http_upgrade;
        proxy_set_header    Connection "upgrade";
        proxy_read_timeout  100d;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/teleprompt /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo
echo "✅ Servidor pronto!"
[ "$DOMAIN" != "_" ] && echo "→ Quando o DNS apontar para este IP, rode: sudo certbot --nginx -d ${DOMAIN}"
echo "→ Publique o app da sua máquina com: ./publish-to-oracle.sh ubuntu@SEU_IP"
