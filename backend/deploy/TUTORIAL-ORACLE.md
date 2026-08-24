# Tutorial — Publicar Teleprompt na Oracle Cloud (Grátis Para Sempre)

> Servidor europeu recomendado no cadastro: **Germany Central (Frankfurt)** ou
> **Netherlands (Amsterdam)** — regiões com boa disponibilidade de instâncias **ARM Ampere A1**
> (o plano gratuito dá até **4 CPUs e 24 GB de RAM** em máquinas ARM, muito mais que as AMD de 1 GB).

---

## Fase 0 — Criar a conta (uma vez só)

1. Acesse **https://www.oracle.com/br/cloud/free/** → *Start for free*.
2. Preencha com seus dados reais. Vai pedir **cartão de crédito apenas para validação**
   (não cobra nada dos recursos "Always Free" — pode bloquear ~R$2 temporariamente e estorna).
3. **Home Region**: escolha `Germany Central (Frankfurt)` ou `Netherlands Northwest (Amsterdam)`.
   ⚠️ Não dá para trocar depois — recursos grátis ficam na região inicial.
4. Confirme o e-mail e aguarde ~15 min para liberar o acesso ao console.

> 💡 Se quiser menor latência do Brasil, `Brazil East (São Paulo)` também existe — mas
> instâncias ARM costumam esgotar lá. Como você pediu Europa: Frankfurt é uma ótima escolha.

---

## Fase 1 — Criar o servidor (Compute Instance)

No console (**cloud.oracle.com** → menu ☰ → Compute → Instances → *Create Instance*):

| Campo | Valor |
|---|---|
| Name | `teleprompt` |
| Image | **Ubuntu 24.04** (clicar em "Edit" para mudar do default Oracle Linux) |
| Shape | **VM.Standard.A1.Flex** (Ampere ARM) |
| OCPU | `2` |
| Memory | `12 GB` |
| Boot volume | `50 GB` |
| SSH keys | *Generate a key pair* → **baixe a chave privada (.key) e guarde** |

Clique **Create** e anote o **Public IP Address** da instância.

> ⚠️ Erro "Out of host capacity"? É esgotamento temporário da região. Troque o
> *Availability Domain* (AD-1 → AD-2…) e tente de novo; se persistir, tente mais tarde.

### Abrir as portas 80/443 no firewall da nuvem

Menu ☰ → Networking → Virtual Cloud Networks → sua VCN → Security Lists → *Default Security List* → **Add Ingress Rules** (duas regras):

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

---

## Fase 2 — Preparar o servidor (comando único)

Na sua máquina (Git Bash, dentro de `backend/deploy/`):

```bash
chmod 400 ~/Downloads/sua-chave.key
ssh -i ~/Downloads/sua-chave.key ubuntu@SEU_IP_PUBLICO
```

Dentro do servidor, baixe e rode o script que preparei:

```bash
curl -fsSL https://raw.githubusercontent.com/SEU-USUARIO/SEU-REPO/main/backend/deploy/oracle-server-setup.sh -o setup.sh
# ou copie o arquivo manualmente (scp) — ver Fase 3
sudo bash setup.sh seu-dominio.com.br
```

Ele instala automaticamente: **runtime .NET 10 (arm64), Nginx, Certbot (HTTPS grátis),
firewall local, serviço systemd** e cria a pasta `/opt/teleprompt`.

---

## Fase 3 — Publicar a aplicação

Da SUA máquina (Git Bash), na raiz do projeto:

```bash
cd backend/deploy
chmod +x publish-to-oracle.sh
./publish-to-oracle.sh ubuntu@SEU_IP_PUBLICO ~/caminho/da-chave.key
```

O script faz: `dotnet publish` (Release) → envia via `scp` → reinicia o serviço.
Ao final o app está em `http://SEU_IP`.

### Levar o banco com os dados migrados do Firestore

```bash
scp -i ~/caminho/da-chave.key \
    backend/src/Teleprompt.Api/teleprompt-dev.db \
    ubuntu@SEU_IP_PUBLICO:/opt/teleprompt/data/teleprompt.db
sudo systemctl restart teleprompt     # no servidor
```

---

## Fase 4 — HTTPS grátis + domínio

1. No painel de DNS do zecki1.com.br, crie um registro:
   `teleprompt` (A) → `SEU_IP_PUBLICO`
2. No servidor, gere o certificado:

```bash
sudo certbot --nginx -d teleprompt.zecki1.com.br
```

Pronto: `https://teleprompt.zecki1.com.br` = hub (Angular em `/app/`, Next configurado em `hub-config.json`).

---

## Fase 5 — Apontar os frontends

**zecki1.com.br/teleprompt** — crie a pasta `teleprompt/` no seu site com:

```html
<meta http-equiv="refresh" content="0;url=https://teleprompt.zecki1.com.br/" />
```

**Vercel (Next.js)** — Environment Variables →
`NEXT_PUBLIC_USE_FIREBASE=false`, `NEXT_PUBLIC_API_URL=https://teleprompt.zecki1.com.br`
→ Redeploy.

**hub-config.json** (em `/opt/teleprompt/wwwroot/`) →
`{ "nextUrl": "https://SEU-APP.vercel.app" }`

---

## Manutenção

```bash
# Ver logs da aplicação
sudo journalctl -u teleprompt -f

# Reiniciar após atualizar arquivos
sudo systemctl restart teleprompt

# Atualizar tudo (da sua máquina)
cd backend/deploy && ./publish-to-oracle.sh ubuntu@SEU_IP ...
```

## Custos: R$ 0,00

Recursos usados (Always Free): 2 OCPU + 12 GB RAM ARM, 50 GB disco,
IP público, transferência de 10 TB/mês — todos dentro da cota gratuita perpétua.
