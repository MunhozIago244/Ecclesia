# 🚀 Guia Rápido de Inicialização - Ecclesia

## ⚡ Start Rápido (5 minutos)

### Passo 1: Instalar Dependências

```bash
cd "c:\Users\iagom\OneDrive\Desktop\Ecclesia Project\Ecclesia"
npm install --legacy-peer-deps
```

> **Nota**: Usa `--legacy-peer-deps` devido ao React 19

### Passo 2: Verificar .env

Certifique-se que o arquivo `.env` existe com:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/ecclesia
PORT=5000
SESSION_SECRET=sua_chave_secreta
NODE_ENV=development

# SMTP (Opcional - sistema funciona sem)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM_NAME=Ecclesia
APP_URL=http://localhost:5173
```

### Passo 3: Banco de Dados

Se ainda não criou o banco:

```bash
npm run db:push
```

### Passo 4: Iniciar

```bash
npm run dev
```

Aguarde a mensagem:
```
[Server] Servidor rodando na porta 5000
[Vite] Ready in 2000ms
```

### Passo 5: Acessar

Abra: `http://localhost:5173`

**Login**:
- Email: `admin@ecclesia.com`
- Senha: `admin123`

---

## 🎯 Testar Distribuição Automática

### 1. Criar Dados de Teste (se necessário)

```sql
-- Conectar ao PostgreSQL
psql -U postgres -d ecclesia

-- Criar ministério
INSERT INTO ministries (name, description) 
VALUES ('Louvor', 'Ministério de música');

-- Criar usuários
INSERT INTO users (name, email, password, active, role) 
VALUES 
  ('João Silva', 'joao@teste.com', 'hash123', true, 'member'),
  ('Maria Santos', 'maria@teste.com', 'hash123', true, 'member');

-- Associar ao ministério
INSERT INTO ministry_members (user_id, ministry_id, status)
VALUES 
  ((SELECT id FROM users WHERE email = 'joao@teste.com'), 
   (SELECT id FROM ministries WHERE name = 'Louvor'), 
   'APPROVED'),
  ((SELECT id FROM users WHERE email = 'maria@teste.com'), 
   (SELECT id FROM ministries WHERE name = 'Louvor'), 
   'APPROVED');

-- Criar escala
INSERT INTO schedules (ministry_id, name, date, time)
VALUES 
  ((SELECT id FROM ministries WHERE name = 'Louvor'),
   'Culto Domingo',
   CURRENT_DATE + INTERVAL '7 days',
   '10:00:00');
```

### 2. Acessar Sistema

1. Login como admin
2. Menu lateral: **Admin → Escalas**
3. Clicar no botão roxo **"Distribuição Automática"** (topo direita)

### 3. Gerar Sugestões

1. **Data Inicial**: Hoje
2. **Data Final**: Daqui a 30 dias
3. **Ministério**: Selecione "Louvor" ou deixe "Todos"
4. Clicar **"Gerar Sugestões"**

### 4. Revisar e Aplicar

1. Revisar as sugestões mostradas
2. Ver pontuações de cada voluntário
3. Clicar **"Aplicar Distribuição"**
4. Aguardar confirmação de sucesso

### 5. Verificar Resultados

```sql
-- Ver assignments criados
SELECT 
  u.name as voluntario,
  s.name as escala,
  s.date,
  sa.status
FROM schedule_assignments sa
JOIN users u ON sa.user_id = u.id
JOIN schedules s ON sa.schedule_id = s.id
ORDER BY s.date DESC
LIMIT 10;
```

---

## 📧 Testar Emails (Opcional)

### Modo Simulado (Padrão)

Sem configurar SMTP, o sistema funciona mas apenas loga:

```
[Email] 📧 MODO SIMULADO
[Email] Para: joao@teste.com
[Email] Assunto: Você foi escalado para...
[Email] Email não enviado (modo simulado)
```

### Modo Real (Com SMTP)

1. **Gmail**: Use App Password
   - Acesse: https://myaccount.google.com/apppasswords
   - Gere senha de app
   - Use no .env

2. **Outlook**: Use conta normal
   ```env
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=seu_email@outlook.com
   SMTP_PASS=sua_senha
   ```

3. **Outros**: Configure conforme provedor

---

## 🔍 Verificar Funcionamento

### Checklist Rápido

- [ ] ✅ npm install rodou sem erros
- [ ] ✅ `npm run dev` iniciou com sucesso
- [ ] ✅ Frontend carrega em localhost:5173
- [ ] ✅ Login funciona
- [ ] ✅ Página Admin → Escalas carrega
- [ ] ✅ Botão "Distribuição Automática" visível
- [ ] ✅ Dialog abre ao clicar
- [ ] ✅ Formulário aceita datas
- [ ] ✅ "Gerar Sugestões" funciona
- [ ] ✅ Sugestões são mostradas
- [ ] ✅ "Aplicar Distribuição" funciona
- [ ] ✅ Toast de sucesso aparece
- [ ] ✅ Assignments criados no banco

### Comandos Úteis

```bash
# Ver logs do servidor
# (console do terminal onde rodou npm run dev)

# Verificar banco de dados
psql -U postgres -d ecclesia

# Ver schedules
SELECT * FROM schedules ORDER BY date DESC LIMIT 5;

# Ver assignments
SELECT * FROM schedule_assignments ORDER BY id DESC LIMIT 10;

# Ver emails (se configurado)
# Check inbox do email configurado
```

---

## ⚠️ Troubleshooting Rápido

### Erro: "Cannot find module 'nodemailer'"

**Solução**:
```bash
npm install nodemailer --legacy-peer-deps
npm install @types/nodemailer --save-dev --legacy-peer-deps
```

### Erro: "Port 5000 already in use"

**Solução**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Ou mude a porta no .env
PORT=5001
```

### Erro: "Database connection failed"

**Solução**:
1. Verifique PostgreSQL está rodando
2. Confirme DATABASE_URL no .env
3. Teste conexão: `psql -U postgres -d ecclesia`

### Dialog não abre

**Solução**:
1. Ctrl+Shift+R (limpar cache navegador)
2. Verificar console do navegador (F12)
3. Recompilar: `npm run build`

### Sem sugestões geradas

**Solução**:
1. Criar escalas para o período selecionado
2. Criar usuários e associar a ministérios
3. Verificar status "active" dos usuários
4. Ampliar período de busca

---

## 📱 Atalhos do Sistema

### Navegação

- **Dashboard**: `/`
- **Admin Escalas**: `/admin/schedules`
- **Admin Ministérios**: `/admin/ministries`
- **Admin Usuários**: `/admin/users`

### Teclado (Dialog Distribuição)

- **Esc**: Fechar dialog
- **Tab**: Navegar entre campos
- **Enter**: (em botões) Executar ação

---

## 🎨 Customização Rápida

### Alterar Cores do Botão

Arquivo: `client/src/pages/Admin/AdminSchedules.tsx`

```tsx
// Linha ~203
<Button
  className="gap-2 rounded-2xl h-14 px-6 
    bg-gradient-to-r from-purple-600 to-indigo-600
    hover:from-purple-700 hover:to-indigo-700"
>
```

Troque `purple` e `indigo` por outras cores Tailwind.

### Alterar Pesos do Algoritmo

Arquivo: `server/scheduler.ts`

```typescript
// Linha ~150
const AVAILABILITY_WEIGHT = 40;    // Padrão: 40
const SPECIALIZATION_WEIGHT = 30;  // Padrão: 30
const ROTATION_WEIGHT = 20;        // Padrão: 20
const CONFIRMATION_WEIGHT = 10;    // Padrão: 10
```

Ajuste conforme necessário (soma deve ser 100).

---

## 📚 Documentação Completa

Para referência detalhada, consulte:

1. **Sistema Completo**: [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
2. **Distribuição Automática**: [docs/AUTO_SCHEDULER.md](docs/AUTO_SCHEDULER.md)
3. **Notificações**: [docs/EMAIL_NOTIFICATIONS.md](docs/EMAIL_NOTIFICATIONS.md)
4. **Instalação Emails**: [INSTALL_NOTIFICATIONS.md](INSTALL_NOTIFICATIONS.md)
5. **Instalação Scheduler**: [INSTALL_SCHEDULER.md](INSTALL_SCHEDULER.md)

---

## ✅ Está Pronto!

Se todos os passos acima funcionaram, o sistema está 100% operacional!

**Próximos passos sugeridos**:
1. Criar dados reais (ministérios, usuários, escalas)
2. Testar distribuição automática com dados reais
3. Configurar SMTP para emails reais (opcional)
4. Treinar administradores no uso do sistema
5. Fazer backup do banco de dados

**Divirta-se usando o Ecclesia! 🎉**

---

**Tempo estimado de setup**: 5-10 minutos  
**Dificuldade**: Fácil  
**Pré-requisitos**: Node.js 18+, PostgreSQL 15+
