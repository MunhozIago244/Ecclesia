# 🔧 Guia de Troubleshooting - Erro 500 no Vercel

## 📋 Checklist de Diagnóstico

### 1. Verificar Logs da Vercel (OBRIGATÓRIO)

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Deployments** → Clique no deployment mais recente
4. Aba **Logs** ou **Runtime Logs**
5. Procure por erros em vermelho

**O que procurar:**
- `DATABASE_URL must be set` → Variável de ambiente não configurada
- `Connection refused` → Problema de conexão com Neon
- `SSL connection required` → DATABASE_URL sem SSL
- `Cannot find module` → Dependência faltando
- `SyntaxError` → Erro de compilação TypeScript

---

## 🔑 Problema 1: DATABASE_URL sem SSL

### Sintoma
```
Error: SSL connection required
ou
Error: connection refused
```

### Solução

**No painel da Vercel:**
1. Vá em **Settings** → **Environment Variables**
2. Encontre `DATABASE_URL`
3. **IMPORTANTE:** A URL deve terminar com `?sslmode=require`

**Formato correto:**
```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Se sua URL não tem `?sslmode=require`:**
- Adicione manualmente no final da URL
- Ou use a connection string do Neon que já vem com SSL

---

## 🔑 Problema 2: Variável de Ambiente Não Configurada

### Sintoma
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

### Solução

1. No painel da Vercel: **Settings** → **Environment Variables**
2. Adicione:
   - **Name:** `DATABASE_URL`
   - **Value:** Sua connection string do Neon
   - **Environment:** Production, Preview, Development (marque todos)
3. **Redeploy** após adicionar

---

## 🔑 Problema 3: Dependências Faltando

### Sintoma
```
Error: Cannot find module '@vercel/node'
ou
Error: Cannot find module 'pg'
```

### Solução

O `package.json` já está correto, mas verifique:

1. **No Vercel:**
   - Vá em **Settings** → **General**
   - Verifique se **Install Command** está como: `npm install`
   - Verifique se **Build Command** está como: `npm run build`

2. **Se ainda der erro:**
   - Force um novo deploy: **Deployments** → **Redeploy**

---

## 🔑 Problema 4: Erro de Compilação TypeScript

### Sintoma
```
SyntaxError: Unexpected token
ou
TypeError: Cannot read property
```

### Solução

1. **Teste localmente primeiro:**
   ```bash
   npm run build
   ```

2. **Se der erro local:**
   - Corrija os erros de TypeScript
   - Execute `npm run check` para ver erros de tipo

3. **Se funcionar local mas falhar no Vercel:**
   - Verifique se `tsconfig.json` está correto
   - O Vercel compila automaticamente com `@vercel/node`

---

## 🔑 Problema 5: Timeout na Conexão

### Sintoma
```
Error: Connection timeout
ou
Error: connect ETIMEDOUT
```

### Solução

1. **Use Connection Pooler do Neon:**
   - No painel do Neon, use a connection string do **Pooler** (não direta)
   - Ela geralmente tem `-pooler` no hostname

2. **Verifique Firewall:**
   - No Neon: **Settings** → **IP Allowlist**
   - Adicione `0.0.0.0/0` para permitir todas as conexões (ou IPs específicos da Vercel)

---

## 🧪 Teste de Conexão

### Endpoint de Health Check

Após o deploy, teste:
```
https://seu-projeto.vercel.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "online",
  "db": "connected",
  "time": "2024-01-01T00:00:00.000Z",
  "env": "production"
}
```

**Se retornar erro:**
- Verifique os logs da Vercel
- Verifique se `DATABASE_URL` está configurada
- Verifique se a URL tem `?sslmode=require`

---

## 📝 Variáveis de Ambiente Necessárias

Configure estas no Vercel:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | ✅ SIM | Connection string do Neon com `?sslmode=require` |
| `SESSION_SECRET` | ⚠️ Recomendado | String aleatória para sessões (ex: `openssl rand -hex 32`) |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ Se usar upload | Nome da cloud no Cloudinary |
| `CLOUDINARY_API_KEY` | ⚠️ Se usar upload | API Key do Cloudinary |
| `CLOUDINARY_API_SECRET` | ⚠️ Se usar upload | API Secret do Cloudinary |

---

## 🚀 Passos para Resolver

1. ✅ **Verifique os logs** (mais importante!)
2. ✅ **Confirme DATABASE_URL** com `?sslmode=require`
3. ✅ **Teste `/api/health`** após deploy
4. ✅ **Redeploy** se mudou variáveis de ambiente
5. ✅ **Verifique dependências** no package.json

---

## 💡 Dicas

- **Sempre verifique os logs primeiro** - eles mostram o erro exato
- **Use Connection Pooler do Neon** - é mais estável para serverless
- **Teste localmente** antes de fazer deploy
- **Redeploy após mudar variáveis** - elas só são aplicadas em novo deploy

---

## 📞 Ainda com Problemas?

Se após seguir todos os passos ainda houver erro:

1. Copie o erro completo dos logs da Vercel
2. Verifique se `DATABASE_URL` está correta
3. Teste a connection string diretamente com `psql` ou cliente PostgreSQL
4. Verifique se o banco Neon está ativo (não pausado)
