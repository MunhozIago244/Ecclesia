# 📧 Sistema de Notificações por Email

## Visão Geral

O Ecclesia agora possui um sistema completo de notificações por email para manter os membros informados sobre ações importantes no sistema.

## Funcionalidades Implementadas

### 1. **Notificações de Ministérios**
- ✅ **Aprovação de Solicitação**: Email enviado quando um líder aprova a participação em um ministério
- ✅ **Rejeição de Solicitação**: Notificação quando uma solicitação não é aprovada

### 2. **Notificações de Escalas**
- ✅ **Nova Atribuição**: Email automático quando um voluntário é escalado para um serviço
- 🔄 **Lembretes**: Template preparado para lembretes 1 dia antes (requer agendamento - não implementado)

### 3. **Notificações de Conta**
- ✅ **Boas-vindas**: Email de bienvenida ao criar nova conta
- ✅ **Conta Ativada**: Notificação quando admin ativa uma conta
- ✅ **Conta Desativada**: Notificação quando admin desativa uma conta

## Configuração

### 1. Instalar Dependências

```bash
npm install --legacy-peer-deps
```

As dependências já foram adicionadas ao `package.json`:
- `nodemailer@^6.9.8`
- `@types/nodemailer@^6.4.14`

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Configurações de Email (Opcional - para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM_NAME=Ecclesia

# URL da aplicação (para links nos emails)
APP_URL=http://localhost:5173
```

#### Configuração para Gmail

1. Acesse as [Configurações de Conta do Google](https://myaccount.google.com/)
2. Vá em **Segurança** → **Verificação em duas etapas**
3. Após habilitar, procure por **Senhas de app**
4. Gere uma senha para "Email" ou "Aplicativo personalizado"
5. Use essa senha em `SMTP_PASS`

#### Outros Provedores

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_aqui
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua_senha_mailgun
```

### 3. Modo Simulado (Desenvolvimento)

Se as variáveis SMTP **não** estiverem configuradas, o sistema funcionará em **modo simulado**:

```
📧 [Email] Modo simulado - Email para user@example.com: ✅ Bem-vindo ao ministério Louvor!
```

Os emails são logados no console, mas não são enviados de fato. Ideal para desenvolvimento!

## Arquitetura

### Estrutura de Arquivos

```
server/
  ├── email.ts          # Serviço de email (novo)
  ├── routes.ts         # Integração com rotas (modificado)
  ├── auth.ts           # Notificação de boas-vindas (modificado)
  └── storage.ts        # Método getMinistryFunction adicionado
```

### Serviço de Email (`server/email.ts`)

O serviço é implementado como **Singleton** e exporta uma instância única:

```typescript
import { emailService } from "./email";

// Verificar se está habilitado
if (emailService.isEnabled()) {
  console.log("Notificações ativas!");
}

// Enviar email
await emailService.sendMinistryApproval(
  "user@example.com",
  "João Silva",
  "Louvor"
);
```

### Métodos Disponíveis

| Método | Descrição |
|--------|-----------|
| `sendMinistryApproval()` | Aprovação de participação em ministério |
| `sendMinistryRejection()` | Rejeição de solicitação |
| `sendScheduleAssignment()` | Nova escala atribuída |
| `sendScheduleReminder()` | Lembrete de escala (preparado para cron) |
| `sendAccountActivation()` | Conta foi ativada pelo admin |
| `sendAccountDeactivation()` | Conta foi desativada |
| `sendWelcome()` | Boas-vindas ao novo usuário |
| `send()` | Envio genérico de email |

## Integração com Rotas

### Exemplo: Aprovação de Ministério

```typescript
// routes.ts - linha ~130
app.patch("/api/admin/ministry-requests/:id", async (req, res) => {
  const { status } = req.body;
  
  if (status === "APPROVED") {
    const user = await storage.getUser(updated.userId);
    const ministry = await storage.getMinistry(updated.ministryId);
    
    await emailService.sendMinistryApproval(
      user.email,
      user.name,
      ministry.name
    );
  }
});
```

### Pontos de Integração

1. **`/api/admin/ministry-requests/:id` (PATCH)** - Aprovação/Rejeição
2. **`/api/admin/users/:id` (PATCH)** - Ativação/Desativação
3. **`/api/schedules/:id/assign` (POST)** - Atribuição de escalas
4. **`/api/register` (POST)** - Boas-vindas

## Templates de Email

Todos os emails seguem um **design consistente** com:

- 🎨 Header com gradiente (indigo/violet)
- 📧 Logo Ecclesia
- 📄 Conteúdo responsivo e limpo
- 🔗 Botões de ação (CTAs)
- 📱 Layout mobile-friendly

### Visualização

```html
⛪ Ecclesia
Sistema de Gestão Ministerial
━━━━━━━━━━━━━━━━━━━━━━━━━

Olá, João Silva!

Sua solicitação para participar do ministério
Louvor foi aprovada pela liderança.

[ Ver Meus Ministérios ]

━━━━━━━━━━━━━━━━━━━━━━━━━
© 2026 Ecclesia. Todos os direitos reservados.
```

## Tratamento de Erros

O sistema é **não-bloqueante**: se o envio de email falhar, a operação principal **não é interrompida**.

```typescript
try {
  await emailService.sendScheduleAssignment(...);
} catch (emailError) {
  console.error("Erro ao enviar email:", emailError);
  // A escala é criada mesmo assim
}
```

## Logs e Monitoramento

Todos os envios são logados:

```
✅ [Email] Enviado para user@example.com: 📅 Nova escala: Culto de Domingo
❌ [Email] Erro ao enviar para invalid@email.com: Connection timeout
ℹ️ [Email] Serviço desabilitado (variáveis SMTP não configuradas)
```

## Próximos Passos (Não Implementado)

### 1. Lembretes Agendados
Criar um **cron job** para enviar lembretes automáticos:

```typescript
// Exemplo com node-cron
import cron from "node-cron";

// Todo dia às 10h, verifica escalas para amanhã
cron.schedule("0 10 * * *", async () => {
  const tomorrow = addDays(new Date(), 1);
  const schedules = await getSchedulesForDate(tomorrow);
  
  for (const schedule of schedules) {
    for (const assignment of schedule.assignments) {
      await emailService.sendScheduleReminder(...);
    }
  }
});
```

### 2. Notificações em Tempo Real
Implementar WebSocket para notificações instantâneas no frontend.

### 3. Preferências de Notificação
Permitir que usuários escolham quais emails desejam receber.

### 4. Templates Customizáveis
Painel admin para editar templates de email.

## Segurança

✅ **Senhas nunca são enviadas por email**  
✅ **Links incluem URL configurável** (`APP_URL`)  
✅ **SMTP com autenticação obrigatória**  
✅ **Suporte a TLS/SSL**

## Solução de Problemas

### Email não está sendo enviado

1. Verifique se todas as variáveis SMTP estão configuradas
2. Confirme que `SMTP_USER` e `SMTP_PASS` estão corretos
3. Para Gmail, certifique-se de usar uma "Senha de app"
4. Verifique os logs do servidor para mensagens de erro

### Email vai para spam

- Configure **SPF/DKIM** no seu domínio
- Use um serviço profissional (SendGrid, Mailgun)
- Evite palavras "suspeitas" nos assuntos

### Erro de conexão SMTP

```
Error: Connection timeout
```

- Verifique `SMTP_HOST` e `SMTP_PORT`
- Alguns provedores bloqueiam porta 25, use 587
- Firewall pode estar bloqueando conexões SMTP

## Performance

- Emails são enviados de forma **assíncrona** (não bloqueante)
- Tempo médio de envio: **100-500ms** por email
- Para envios em massa, considere usar uma **fila** (Bull, BeeQueue)

## Compatibilidade

- ✅ Node.js 18+
- ✅ PostgreSQL (via Drizzle ORM)
- ✅ Express.js
- ✅ TypeScript 5+

---

## Suporte

Para mais informações ou reportar problemas:
- 📧 Email: munhoziago244@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/MunhozIago244/Ecclesia/issues)
