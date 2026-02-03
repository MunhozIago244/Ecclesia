# 🔧 Troubleshooting - Deploy no Render

## Problema: Build falhou com erro ERESOLVE

### Sintoma
```
npm error ERESOLVE could not resolve
npm error While resolving: react-day-picker@8.10.1
npm error peer react@"^16.8.0 || ^17.0.0 || ^18.0.0"
```

### Causa
O Render executa `npm install` sem a flag `--legacy-peer-deps` necessária para resolver conflitos de peer dependencies.

### ✅ Solução

O projeto já está configurado com:

1. **Arquivo `.npmrc`** na raiz do projeto:
   ```
   legacy-peer-deps=true
   ```

2. **Arquivo `render.yaml`** com comando correto:
   ```yaml
   buildCommand: npm install --legacy-peer-deps --include=dev
   ```

### Passos para Resolver

#### Se você está usando o botão "Deploy to Render":

1. O `render.yaml` será lido automaticamente ✅
2. O `.npmrc` será usado automaticamente ✅
3. **Não é necessária ação adicional!**

#### Se você configurou manualmente no painel do Render:

1. Acesse seu serviço no Render Dashboard
2. Vá em **Settings**
3. Localize **Build Command**
4. **Altere para**:
   ```bash
   npm install --legacy-peer-deps --include=dev
   ```
5. Clique **Save Changes**
6. Faça um novo deploy: **Manual Deploy** → **Deploy latest commit**

---

## Problema: Módulos não encontrados após build

### Sintoma
```
Error: Cannot find module 'express'
Error: Cannot find module '@types/...'
```

### Causa
Dependências de desenvolvimento não foram instaladas.

### ✅ Solução

Certifique-se que o Build Command inclui `--include=dev`:
```bash
npm install --legacy-peer-deps --include=dev
```

---

## Problema: Banco de dados não conecta

### Sintoma
```
Error: connect ECONNREFUSED
Connection timeout
```

### ✅ Soluções

1. **Verificar DATABASE_URL**:
   - Use a **Internal Connection String** (não a External)
   - Formato: `postgres://user:pass@hostname.render.com/database`

2. **No painel do banco PostgreSQL**:
   - Copie **Internal Database URL**
   - Cole nas variáveis de ambiente do Web Service

3. **Aplicar Schema**:
   ```bash
   # No Shell do Render
   npm run db:push
   ```

---

## Problema: App inicia mas crasheia

### Sintoma
```
Application failed to respond
Health check failed
```

### ✅ Soluções

1. **Verificar logs em tempo real**:
   - Dashboard → Logs
   - Procure por erros específicos

2. **Variáveis de ambiente obrigatórias**:
   ```env
   NODE_ENV=production
   DATABASE_URL=postgres://...
   SESSION_SECRET=...
   PORT=5000
   ```

3. **Gerar SESSION_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

## Problema: Build demora muito (>10 minutos)

### Causa
Free tier tem recursos limitados.

### ✅ Soluções

1. **Adicionar arquivo `.renderignore`** (já criado):
   ```
   tests/
   playwright-report/
   ```

2. **Esperar pacientemente**:
   - Primeiro build: 10-15 minutos
   - Builds subsequentes: 5-7 minutos (cache)

3. **Considerar upgrade**:
   - Starter plan: $7/mês (build mais rápido)

---

## Problema: Variável ${{Postgres.DATABASE_URL}} não funciona

### Causa
Sintaxe do Render para referenciar recursos.

### ✅ Solução

**No render.yaml** (automático):
```yaml
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: ecclesia-db
      property: connectionString
```

**No painel manual**:
1. Não use `${{...}}`
2. Cole a URL completa diretamente
3. Ou use "Add from" → "Database" → Selecione seu PostgreSQL

---

## Problema: Deploy funciona mas página não carrega

### Sintoma
- Deploy successful ✅
- Mas site mostra erro 502 ou não responde

### ✅ Soluções

1. **Verificar se app está rodando**:
   ```bash
   # No Shell do Render
   ps aux | grep node
   ```

2. **Verificar PORT**:
   - Render define automaticamente a variável `PORT`
   - Seu app deve usar `process.env.PORT || 5000`
   - **Já configurado no projeto!** ✅

3. **Verificar Health Check**:
   - Crie endpoint: `GET /api/health`
   - Retorna: `{ status: "ok" }`
   - Configure em Settings → Health Check Path: `/api/health`

---

## Problema: SMTP/Emails não funcionam

### Sintoma
```
Error: connect ETIMEDOUT smtp.gmail.com:587
```

### ✅ Soluções

1. **Modo Simulado (desenvolvimento)**:
   - Deixe variáveis SMTP vazias
   - Emails serão exibidos no console

2. **Gmail**:
   - Use senha de app, não senha normal
   - Gerar em: https://myaccount.google.com/apppasswords

3. **SendGrid (recomendado produção)**:
   - Criar conta: https://sendgrid.com
   - Gerar API Key
   - Configurar:
     ```env
     SMTP_HOST=smtp.sendgrid.net
     SMTP_PORT=587
     SMTP_USER=apikey
     SMTP_PASS=SG.xxxxxxxx
     ```

---

## Problema: Cannot find module 'drizzle-orm'

### Causa
Drizzle não foi instalado corretamente.

### ✅ Solução

1. **Limpar cache do Render**:
   - Settings → Clear Build Cache
   - Fazer novo deploy

2. **Verificar package.json**:
   ```json
   "dependencies": {
     "drizzle-orm": "^0.38.3"
   }
   ```

---

## Problema: Build passa mas site mostra "Not Found"

### Causa
Arquivos estáticos não estão sendo servidos.

### ✅ Solução

Já configurado no `server/index.ts`:
```typescript
app.use(express.static("dist/public"));
```

Se ainda não funcionar:
1. Verificar se pasta `dist/public` existe após build
2. Ver logs: podem haver erros no build do Vite

---

## 🆘 Ainda com problemas?

### 1. Ver Logs Detalhados
```bash
# No seu terminal local com Render CLI
render logs --tail

# Ou no painel
Dashboard → Logs → Últimos 1000 linhas
```

### 2. Testar Localmente
```bash
# Simular ambiente de produção
NODE_ENV=production npm run dev

# Verificar se funciona localmente
```

### 3. Shell Interativo
```bash
# Acessar Shell do Render
Dashboard → Shell

# Testar conexões
psql $DATABASE_URL
node --version
npm list
```

### 4. Suporte Render
- Documentação: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

---

## ✅ Checklist de Debug

Quando algo não funciona:

- [ ] Logs mostram erros específicos?
- [ ] Todas variáveis de ambiente estão definidas?
- [ ] DATABASE_URL está correta (Internal)?
- [ ] Schema foi aplicado (`npm run db:push`)?
- [ ] Build Command tem `--legacy-peer-deps`?
- [ ] Start Command é `npm run dev`?
- [ ] Node version >=18?
- [ ] Commit foi pushed para GitHub?

---

## 📞 Contato

Se nada resolver:
1. Copie os logs completos
2. Verifique documentação completa em `/docs`
3. Abra uma issue no GitHub com:
   - Logs do erro
   - Configurações usadas
   - Passos que seguiu

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0
