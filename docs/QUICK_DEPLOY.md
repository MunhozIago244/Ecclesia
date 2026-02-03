# 🚀 Deploy Rápido - Guia Simplificado

> **3 opções para colocar seu sistema no ar em minutos**

---

## 🎯 Escolha Sua Plataforma

| Plataforma | ⏱️ Tempo | 💰 Custo | 🔧 Dificuldade | ⭐ Recomendação |
|------------|----------|----------|----------------|-----------------|
| **Render** | 10 min | Free tier | Fácil | ⭐⭐⭐⭐⭐ Melhor opção |
| **Railway** | 5 min | $5/mês grátis | Muito fácil | ⭐⭐⭐⭐ |
| **VPS** | 30 min | A partir de $5/mês | Avançado | ⭐⭐⭐ |

---

## 1️⃣ Render.com (Recomendado) 🏆

### Por que Render?
- ✅ **100% gratuito** para começar
- ✅ Deploy automático via GitHub
- ✅ PostgreSQL incluso
- ✅ SSL gratuito
- ✅ Zero configuração de servidor

### Passo a Passo

#### 1. Prepare o GitHub
```bash
# Seu código já está pronto!
# Apenas faça push para o GitHub:
git init
git add .
git commit -m "Deploy Ecclesia"
git remote add origin https://github.com/SEU_USUARIO/ecclesia.git
git push -u origin main
```

#### 2. Deploy com 1 Clique

**Opção A: Botão de Deploy**
1. Clique no botão Deploy abaixo:

   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/SEU_USUARIO/ecclesia)

2. Aguarde 5-10 minutos
3. Acesse sua URL: `https://seu-app.onrender.com`
4. **Pronto!** ✅

**Opção B: Manual (se botão não funcionar)**

1. Acesse [render.com](https://render.com) → Login com GitHub
2. **New** → **PostgreSQL**
   - Name: `ecclesia-db`
   - Plan: Free
   - Create Database
   - **Copie a "Internal Database URL"**

3. **New** → **Web Service**
   - Connect seu repositório
   - Name: `ecclesia-app`
   - Build Command: `npm install --legacy-peer-deps`
   - Start Command: `npm run dev`
   - Plan: Free

4. **Environment Variables** (adicione todas):
   ```env
   NODE_ENV=production
   DATABASE_URL=cole_a_url_do_banco_aqui
   SESSION_SECRET=gere_uma_chave_aleatoria
   PORT=5000
   ```

   **Gerar SESSION_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Click **Create Web Service**

#### 3. Inicializar Banco

Após deploy, no painel do Web Service:
1. **Shell** (aba superior)
2. Execute:
   ```bash
   npm run db:push
   ```

#### 4. Criar Admin

No Shell:
```bash
psql $DATABASE_URL

-- Cole e edite:
INSERT INTO users (name, email, password, role, active, created_at)
VALUES (
  'Admin',
  'admin@igreja.com',
  -- Use: https://bcrypt-generator.com para gerar hash da senha
  '$2a$10$...seu_hash_aqui...',
  'admin',
  true,
  NOW()
);
```

### ✅ Deploy Completo!
Acesse: `https://seu-app.onrender.com`

**Tempo total: ~10 minutos**

---

## 2️⃣ Railway.app 🚄

### Por que Railway?
- ✅ Deploy **ultra rápido** (5 min)
- ✅ Interface moderna
- ✅ $5 de crédito grátis/mês
- ✅ PostgreSQL com 1 clique

### Passo a Passo

#### 1. Deploy Instantâneo

```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Deploy (2 comandos!)
railway init
railway up
```

#### 2. Adicionar PostgreSQL

No dashboard:
1. **New** → **Database** → **PostgreSQL**
2. Aguarde provisionamento

#### 3. Configurar Variáveis

No serviço, aba **Variables**:
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=gere_sua_chave
PORT=5000
```

#### 4. Aplicar Schema

No terminal Railway:
```bash
railway run npm run db:push
```

### ✅ Deploy Completo!
URL gerada automaticamente com SSL

**Tempo total: ~5 minutos**

---

## 3️⃣ VPS (DigitalOcean/Linode) 💻

### Por que VPS?
- ✅ Controle total
- ✅ Performance dedicada
- ✅ Escalável
- ❌ Requer conhecimento técnico

### Requisitos
- Ubuntu 22.04 LTS
- 1GB RAM (mínimo)
- 20GB storage

### Setup Rápido

```bash
# 1. Conectar
ssh root@seu-ip

# 2. Instalar tudo
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx
npm install -g pm2

# 3. Configurar PostgreSQL
sudo -u postgres psql
CREATE DATABASE ecclesia;
CREATE USER ecclesia_user WITH PASSWORD 'senha_forte';
GRANT ALL PRIVILEGES ON DATABASE ecclesia TO ecclesia_user;
\q

# 4. Clonar projeto
git clone https://github.com/seu-usuario/ecclesia.git
cd ecclesia
npm install --legacy-peer-deps

# 5. Configurar .env
nano .env
# Cole suas variáveis (veja .env.example)

# 6. Iniciar com PM2
npm run db:push
pm2 start npm --name "ecclesia" -- run dev
pm2 save
pm2 startup

# 7. Nginx (proxy)
# Copie config de DEPLOY_GUIDE.md para /etc/nginx/sites-available/ecclesia
systemctl restart nginx

# 8. SSL gratuito
certbot --nginx -d seudominio.com
```

### ✅ Deploy Completo!
Acesse: `https://seudominio.com`

**Tempo total: ~30 minutos**

---

## 📧 Configurar Emails (Opcional)

### Gmail (Rápido)

1. **Ativar 2FA**: https://myaccount.google.com/security
2. **Criar senha de app**: https://myaccount.google.com/apppasswords
3. **Adicionar ao .env**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=seu@gmail.com
   SMTP_PASS=senha_de_app_gerada
   SMTP_FROM_NAME=Ecclesia
   ```

### SendGrid (Profissional)

1. Criar conta: https://sendgrid.com (100 emails/dia grátis)
2. Criar API Key
3. **Adicionar ao .env**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=sua_api_key
   ```

---

## 🆘 Problemas Comuns

### App não inicia
```bash
# Ver logs
render logs  # ou: railway logs  # ou: pm2 logs

# Verificar variáveis
echo $DATABASE_URL
```

### Banco não conecta
```bash
# Testar conexão
psql $DATABASE_URL

# Se falhar, verificar URL/credenciais
```

### Emails não enviam
- Verificar credenciais SMTP
- Gmail: usar senha de app, não senha normal
- Testar com: `npm install -g nodemailer-cli`

---

## ✅ Checklist Final

Antes de usar em produção:

- [ ] ✅ Deploy completo
- [ ] ✅ Banco inicializado (`npm run db:push`)
- [ ] ✅ Admin criado
- [ ] ✅ HTTPS habilitado
- [ ] ✅ Emails configurados (ou em modo simulado)
- [ ] ✅ Testado: login, criar ministério, criar escala

---

## 📚 Documentação Completa

Para guias detalhados:

- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - Guia completo (todas opções)
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Checklist detalhado
- **[README.md](./README.md)** - Visão geral do projeto

---

## 🎉 Pronto!

Escolha uma opção acima e em **minutos** seu sistema estará no ar!

**Recomendação**: Comece com **Render** (mais fácil e gratuito).

---

**Dúvidas?** Veja documentação completa ou abra uma issue no GitHub.
