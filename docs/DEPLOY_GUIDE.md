# 🚀 Guia de Deploy para Produção - Ecclesia

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 15+ instalado
- Conta em serviço de hospedagem (Render, Railway, Heroku, ou VPS)
- Domínio (opcional)

---

## 🎯 Opções de Deploy

### Opção 1: Render.com (Recomendado) ✅

**Vantagens**:
- ✅ Free tier disponível
- ✅ PostgreSQL incluído
- ✅ Deploy automático via GitHub
- ✅ SSL gratuito
- ✅ Fácil configuração

#### Passo a Passo - Render

**1. Preparar Repositório**

```bash
# 1. Inicializar Git (se ainda não fez)
git init
git add .
git commit -m "Initial commit - Ecclesia v1.0"

# 2. Criar repositório no GitHub
# Acesse: https://github.com/new

# 3. Push para GitHub
git remote add origin https://github.com/SEU_USUARIO/ecclesia.git
git branch -M main
git push -u origin main
```

**2. Criar Conta no Render**

- Acesse: https://render.com
- Faça login com GitHub
- Autorize acesso aos repositórios

**3. Criar PostgreSQL Database**

1. Dashboard → "New" → "PostgreSQL"
2. Configurações:
   - **Name**: `ecclesia-db`
   - **Database**: `ecclesia`
   - **User**: `ecclesia_user`
   - **Region**: Escolha mais próximo
   - **Plan**: Free (256 MB RAM)
3. Clique "Create Database"
4. **IMPORTANTE**: Copie a "Internal Database URL" (começa com `postgres://`)

**4. Criar Web Service**

1. Dashboard → "New" → "Web Service"
2. Conecte seu repositório GitHub
3. Configurações:
   - **Name**: `ecclesia-app`
   - **Region**: Mesma do banco
   - **Branch**: `main`
   - **Root Directory**: deixe vazio
   - **Runtime**: `Node`
   - **Build Command**: `npm install --legacy-peer-deps --include=dev`
   - **Start Command**: `npm run dev`
   - **Plan**: Free (512 MB RAM)

**5. Configurar Variáveis de Ambiente**

No painel do Web Service, vá em "Environment" e adicione:

```env
NODE_ENV=production
DATABASE_URL=sua_internal_database_url_aqui
SESSION_SECRET=gere_uma_chave_aleatoria_segura_aqui
PORT=5000

# SMTP (Opcional - para emails reais)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM_NAME=Ecclesia
APP_URL=https://seu-app.onrender.com
```

**Como gerar SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**6. Deploy Automático**

- Clique "Create Web Service"
- Aguarde o build (5-10 minutos)
- Acesse sua URL: `https://seu-app.onrender.com`

**7. Configurar Banco de Dados**

Após primeiro deploy bem-sucedido:

1. No painel do Web Service, vá em "Shell"
2. Execute:
```bash
npm run db:push
```

**8. Criar Usuário Admin**

No Shell do Render:
```bash
# Conectar ao PostgreSQL
psql $DATABASE_URL

# Criar admin
INSERT INTO users (name, email, password, role, active)
VALUES (
  'Administrador',
  'admin@suaigreja.com',
  '$2a$10$HASH_AQUI', -- Use bcrypt para gerar
  'admin',
  true
);
```

---

### Opção 2: Railway.app ✅

**Vantagens**:
- ✅ Deploy muito rápido
- ✅ $5 de crédito grátis/mês
- ✅ PostgreSQL one-click
- ✅ Interface moderna

#### Passo a Passo - Railway

**1. Criar Projeto**

- Acesse: https://railway.app
- Login com GitHub
- "New Project" → "Deploy from GitHub repo"
- Selecione seu repositório

**2. Adicionar PostgreSQL**

- No projeto, clique "New" → "Database" → "PostgreSQL"
- Aguarde provisionamento

**3. Configurar Variáveis**

No serviço do app, aba "Variables":

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=sua_chave_secreta
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email
SMTP_PASS=sua_senha
APP_URL=${{RAILWAY_STATIC_URL}}
```

**4. Configurar Build**

Settings → Deploy:
- **Build Command**: `npm install --legacy-peer-deps`
- **Start Command**: `npm run dev`

**5. Deploy**

- Railway detecta mudanças e faz deploy automático
- URL gerada automaticamente
- SSL incluído

---

### Opção 3: VPS (DigitalOcean, Linode, AWS EC2)

**Para usuários avançados**

#### Requisitos do Servidor

- **OS**: Ubuntu 22.04 LTS
- **RAM**: Mínimo 1GB (recomendado 2GB)
- **Storage**: 20GB
- **CPU**: 1 vCore

#### Setup Completo

**1. Conectar ao Servidor**

```bash
ssh root@seu-ip
```

**2. Instalar Dependências**

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar Nginx (proxy reverso)
apt install -y nginx

# Instalar Certbot (SSL gratuito)
apt install -y certbot python3-certbot-nginx
```

**3. Configurar PostgreSQL**

```bash
# Trocar para usuário postgres
sudo -u postgres psql

# No psql:
CREATE DATABASE ecclesia;
CREATE USER ecclesia_user WITH PASSWORD 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON DATABASE ecclesia TO ecclesia_user;
\q
```

**4. Clonar Projeto**

```bash
# Criar usuário app
adduser ecclesia --disabled-password

# Trocar para usuário
su - ecclesia

# Clonar repositório
git clone https://github.com/seu-usuario/ecclesia.git
cd ecclesia

# Instalar dependências
npm install --legacy-peer-deps

# Criar .env
nano .env
```

Conteúdo do `.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://ecclesia_user:senha_forte_aqui@localhost:5432/ecclesia
SESSION_SECRET=gere_chave_secreta_aqui
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=senha_app
SMTP_FROM_NAME=Ecclesia
APP_URL=https://seudominio.com
```

**5. Configurar PM2**

```bash
# Aplicar schema do banco
npm run db:push

# Iniciar com PM2
pm2 start npm --name "ecclesia" -- run dev
pm2 save
pm2 startup
```

**6. Configurar Nginx**

```bash
# Voltar para root
exit

# Criar config
nano /etc/nginx/sites-available/ecclesia
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/ecclesia /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**7. Configurar SSL (HTTPS)**

```bash
certbot --nginx -d seudominio.com -d www.seudominio.com
```

**8. Configurar Firewall**

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🔒 Segurança em Produção

### 1. Variáveis de Ambiente

**Nunca commite .env para Git!**

Adicione ao `.gitignore`:
```
.env
.env.production
.env.local
```

### 2. SESSION_SECRET

Gere uma chave forte:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Senhas do Banco

Use senhas fortes (mínimo 32 caracteres):
```bash
openssl rand -base64 32
```

### 4. CORS (se necessário)

Se frontend estiver em domínio diferente, configure CORS no `server/index.ts`:

```typescript
import cors from 'cors';

app.use(cors({
  origin: 'https://seudominio.com',
  credentials: true
}));
```

### 5. Rate Limiting

Já configurado no projeto! Verifique `server/index.ts`:
```typescript
app.use(rateLimiter);
```

---

## 📧 Configurar SMTP para Emails Reais

### Gmail (Recomendado para testes)

**1. Ativar 2FA**
- Acesse: https://myaccount.google.com/security
- Ative "Verificação em duas etapas"

**2. Criar Senha de App**
- Acesse: https://myaccount.google.com/apppasswords
- Gere senha para "Correio"
- Use essa senha no `SMTP_PASS`

**Configuração**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=senha_de_app_gerada
```

### SendGrid (Produção)

**1. Criar conta**: https://sendgrid.com (100 emails/dia grátis)

**2. Criar API Key**:
- Dashboard → Settings → API Keys
- Create API Key

**3. Configuração**:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=sua_api_key_aqui
SMTP_FROM_NAME=Ecclesia
```

### Amazon SES (Produção Enterprise)

Mais barato para alto volume (62.000 emails/mês grátis):

```env
# ⚠️ EXEMPLO - Substitua com suas credenciais reais da AWS
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAXXXXXXXXXXXXXXXX  # AWS Access Key
SMTP_PASS=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # AWS Secret Key
```

---

## 🔍 Monitoramento

### Logs no Render

```bash
# Dashboard → Logs (tempo real)
# ou CLI:
render logs
```

### Logs no Railway

```bash
# Dashboard → Deployments → View Logs
```

### Logs no VPS (PM2)

```bash
pm2 logs ecclesia
pm2 monit
```

---

## 🔄 Atualizações em Produção

### Render/Railway (Automático)

```bash
git add .
git commit -m "Update: descrição"
git push origin main
# Deploy automático inicia
```

### VPS (Manual)

```bash
ssh root@seu-ip
su - ecclesia
cd ecclesia

# Pull mudanças
git pull origin main

# Instalar novas deps (se houver)
npm install --legacy-peer-deps

# Aplicar mudanças no banco (se houver)
npm run db:push

# Reiniciar app
pm2 restart ecclesia
```

---

## 📊 Backup do Banco de Dados

### Render/Railway

Use ferramenta nativa:
```bash
# Render
render db dump ecclesia-db > backup.sql

# Railway
railway run pg_dump > backup.sql
```

### VPS

```bash
# Backup manual
pg_dump -U ecclesia_user ecclesia > backup_$(date +%Y%m%d).sql

# Backup automático (cron)
crontab -e
# Adicionar:
0 2 * * * pg_dump -U ecclesia_user ecclesia > /home/ecclesia/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## ⚡ Performance

### 1. CDN (Opcional)

Use Cloudflare para:
- Cache de assets
- Proteção DDoS
- SSL gratuito

### 2. Otimizações

Já implementadas:
- ✅ Compressão gzip
- ✅ Cache de queries
- ✅ Rate limiting
- ✅ Build otimizado

### 3. Escalabilidade

Para alto tráfego:
- Adicione mais instâncias (load balancer)
- Use Redis para sessions
- Configure CDN
- Otimize queries do banco

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to database"

**Solução**:
1. Verifique `DATABASE_URL` está correto
2. Verifique banco está online
3. Teste conexão:
```bash
psql $DATABASE_URL
```

### Erro: "Port already in use"

**Solução**:
```bash
# Matar processo na porta
lsof -ti:5000 | xargs kill -9
```

### Build falha no Render

**Solução**:
1. Adicione ao `package.json`:
```json
"engines": {
  "node": ">=18.0.0"
}
```
2. Use `--legacy-peer-deps` no build

### App lento

**Soluções**:
1. Upgrade do plano (mais RAM)
2. Adicionar índices no banco
3. Implementar cache Redis
4. Usar CDN

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] ✅ Código commitado no GitHub
- [ ] ✅ `.env` não está no repositório
- [ ] ✅ Banco de dados criado
- [ ] ✅ `DATABASE_URL` configurado
- [ ] ✅ `SESSION_SECRET` gerado (forte)
- [ ] ✅ SMTP configurado (ou modo simulado)
- [ ] ✅ `npm run db:push` executado
- [ ] ✅ Usuário admin criado
- [ ] ✅ SSL/HTTPS configurado
- [ ] ✅ Domínio apontando (se aplicável)
- [ ] ✅ Backup configurado
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Testado em produção

---

## 🎉 Pós-Deploy

Após deploy bem-sucedido:

1. **Teste completo**:
   - Login
   - Criar ministério
   - Criar escala
   - Distribuição automática
   - Notificações (se SMTP configurado)

2. **Documentação**:
   - Compartilhe URL com equipe
   - Crie usuários iniciais
   - Configure ministérios

3. **Treinamento**:
   - Mostre para administradores
   - Explique funcionalidades
   - Tire dúvidas

---

## 📚 Recursos

- **Documentação**: Veja arquivos `.md` no projeto
- **Suporte Render**: https://render.com/docs
- **Suporte Railway**: https://docs.railway.app
- **PostgreSQL**: https://www.postgresql.org/docs

---

**Deploy preparado com sucesso! 🚀**

Escolha a opção que melhor se adequa às suas necessidades e siga o passo a passo.

Para suporte, consulte a documentação ou abra uma issue no GitHub.
