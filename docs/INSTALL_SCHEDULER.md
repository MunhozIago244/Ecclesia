# Guia de Instalação - Sistema de Distribuição Automática

Este guia detalha os passos necessários para instalar e configurar o sistema de distribuição automática de escalas no Ecclesia.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Ecclesia já instalado e funcionando
- ✅ Node.js 18+ instalado
- ✅ PostgreSQL 15+ configurado
- ✅ Banco de dados com schema atualizado
- ✅ Sistema de autenticação funcionando

## 🚀 Instalação

### Passo 1: Verificar Arquivos

O sistema já está incluído no projeto. Verifique se os seguintes arquivos existem:

```bash
# Backend
server/scheduler.ts        # ✅ Serviço de distribuição automática
server/routes.ts           # ✅ Contém 3 novos endpoints
server/storage.ts          # ✅ Método getScheduleAssignments() adicionado

# Documentação
docs/AUTO_SCHEDULER.md     # ✅ Documentação completa
INSTALL_SCHEDULER.md       # ✅ Este arquivo
```

### Passo 2: Verificar Schema do Banco

O sistema utiliza as tabelas existentes. Confirme que seu banco possui:

```sql
-- Verificar tabelas necessárias
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users',
  'schedules', 
  'schedule_assignments',
  'ministries',
  'ministry_members',
  'ministry_functions'
);
```

**Resultado esperado**: 6 tabelas encontradas

### Passo 3: Verificar Campos Obrigatórios

```sql
-- Verificar campos em users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'name', 'email', 'active');

-- Verificar campos em schedules
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schedules' 
AND column_name IN ('id', 'ministry_id', 'date', 'time');

-- Verificar campos em schedule_assignments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schedule_assignments' 
AND column_name IN ('id', 'schedule_id', 'user_id', 'function_id', 'status', 'confirmed');
```

**Se algum campo estiver faltando**, atualize o schema com as migrações apropriadas.

### Passo 4: Compilar o Projeto

```bash
# Navegar para o diretório do projeto
cd "c:\Users\iagom\OneDrive\Desktop\Ecclesia Project\Ecclesia"

# Instalar dependências (se necessário)
npm install

# Compilar TypeScript
npm run build

# Verificar erros de compilação
# Não deve haver erros relacionados a scheduler.ts ou routes.ts
```

**Saída esperada**: Build bem-sucedido sem erros.

### Passo 5: Iniciar o Servidor

```bash
# Modo desenvolvimento
npm run dev

# OU modo produção
npm start
```

**Verificar no console**:
```
[Server] Sistema de distribuição automática inicializado
[Server] Servidor rodando na porta 5000
```

## 🧪 Testes de Funcionalidade

### Teste 1: Verificar Endpoints Disponíveis

```bash
# Testar se os endpoints estão acessíveis
curl http://localhost:5000/api/schedules/auto-suggest -I

# Resposta esperada: 
# HTTP/1.1 405 Method Not Allowed (pois GET não é permitido)
# Isso confirma que o endpoint existe
```

### Teste 2: Gerar Sugestões (Teste Básico)

**2.1. Preparar dados de teste**:

```sql
-- Criar ministério de teste (se não existir)
INSERT INTO ministries (name, description) 
VALUES ('Teste Distribuição', 'Ministério para testar distribuição automática')
ON CONFLICT DO NOTHING
RETURNING id;
-- Anote o ID retornado

-- Criar usuário de teste (se não existir)
INSERT INTO users (name, email, password, active, role) 
VALUES ('João Teste', 'joao@teste.com', 'hash123', true, 'member')
ON CONFLICT DO NOTHING
RETURNING id;
-- Anote o ID retornado

-- Associar usuário ao ministério
INSERT INTO ministry_members (user_id, ministry_id, status)
VALUES (
  (SELECT id FROM users WHERE email = 'joao@teste.com'),
  (SELECT id FROM ministries WHERE name = 'Teste Distribuição'),
  'APPROVED'
);

-- Criar escala de teste
INSERT INTO schedules (ministry_id, name, date, time)
VALUES (
  (SELECT id FROM ministries WHERE name = 'Teste Distribuição'),
  'Escala Teste',
  CURRENT_DATE + INTERVAL '7 days',
  '10:00:00'
)
RETURNING id;
-- Anote o ID retornado
```

**2.2. Fazer requisição de teste**:

```bash
# Substituir as datas conforme necessário
curl -X POST http://localhost:5000/api/schedules/auto-suggest \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SEU_SESSION_ID" \
  -d '{
    "startDate": "2024-02-01",
    "endDate": "2024-02-29",
    "ministryId": null,
    "requireApproval": true
  }'
```

**Resposta esperada**:

```json
{
  "success": true,
  "suggestions": [
    {
      "scheduleId": 1,
      "scheduleName": "Escala Teste",
      "scheduleDate": "2024-02-08T10:00:00.000Z",
      "suggestions": [
        {
          "userId": 1,
          "userName": "João Teste",
          "functionId": null,
          "functionName": null,
          "score": 85,
          "reasons": [
            "Disponível no horário",
            "Não escalado recentemente"
          ]
        }
      ]
    }
  ],
  "stats": {
    "totalSchedules": 1,
    "totalSuggestions": 1,
    "avgScore": 85
  }
}
```

### Teste 3: Validar Atribuição

```bash
# Validar se um usuário pode ser escalado
curl -X POST http://localhost:5000/api/schedules/validate-assignment \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SEU_SESSION_ID" \
  -d '{
    "userId": 1,
    "scheduleId": 1
  }'
```

**Resposta esperada**:

```json
{
  "valid": true,
  "reason": "Usuário pode ser escalado"
}
```

### Teste 4: Aplicar Distribuição (Teste Completo)

**4.1. Gerar sugestões e salvar resposta**:

```bash
curl -X POST http://localhost:5000/api/schedules/auto-suggest \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SEU_SESSION_ID" \
  -d '{
    "startDate": "2024-02-01",
    "endDate": "2024-02-29"
  }' > suggestions.json
```

**4.2. Aplicar as sugestões**:

```bash
# Usar o JSON salvo da etapa anterior
curl -X POST http://localhost:5000/api/schedules/auto-apply \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SEU_SESSION_ID" \
  -d @suggestions.json
```

**Resposta esperada**:

```json
{
  "success": true,
  "applied": 1,
  "failed": 0,
  "errors": [],
  "message": "Distribuição aplicada com sucesso"
}
```

**4.3. Verificar no banco de dados**:

```sql
-- Confirmar que assignment foi criado
SELECT 
  sa.id,
  u.name as user_name,
  s.name as schedule_name,
  sa.status
FROM schedule_assignments sa
JOIN users u ON sa.user_id = u.id
JOIN schedules s ON sa.schedule_id = s.id
WHERE s.name = 'Escala Teste';
```

**Resultado esperado**: 1 linha mostrando a atribuição criada.

## 🔧 Troubleshooting de Instalação

### Problema: Erro de Compilação

**Sintoma**:
```
error TS2305: Module '"./scheduler"' has no exported member 'schedulerService'.
```

**Solução**:
```bash
# Verificar se o arquivo existe
ls server/scheduler.ts

# Se não existir, copiar do backup ou recriar
# Se existir, verificar sintaxe TypeScript

# Limpar cache e recompilar
rm -rf node_modules/.cache
npm run build
```

### Problema: Endpoint Não Encontrado (404)

**Sintoma**:
```
HTTP/1.1 404 Not Found
```

**Solução**:
```typescript
// Verificar em server/routes.ts se as rotas estão registradas
// Procurar por estas linhas:

app.post("/api/schedules/auto-suggest", ...);
app.post("/api/schedules/auto-apply", ...);
app.post("/api/schedules/validate-assignment", ...);

// Se não estiverem, adicionar manualmente
```

### Problema: Erro de Autenticação

**Sintoma**:
```json
{
  "error": "Unauthorized"
}
```

**Solução**:
```bash
# 1. Fazer login primeiro
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecclesia.com",
    "password": "sua_senha"
  }' \
  -c cookies.txt

# 2. Usar cookie nas requisições
curl -X POST http://localhost:5000/api/schedules/auto-suggest \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{...}'
```

### Problema: Nenhuma Sugestão Retornada

**Sintoma**:
```json
{
  "success": true,
  "suggestions": [],
  "stats": {
    "totalSchedules": 0
  }
}
```

**Solução**:
```sql
-- Verificar se existem escalas no período
SELECT COUNT(*) FROM schedules 
WHERE date BETWEEN '2024-02-01' AND '2024-02-29';

-- Se retornar 0, criar escalas de teste
INSERT INTO schedules (ministry_id, name, date, time)
VALUES 
  (1, 'Escala 1', CURRENT_DATE + 1, '10:00'),
  (1, 'Escala 2', CURRENT_DATE + 7, '10:00');

-- Verificar se há voluntários ativos
SELECT COUNT(*) FROM users WHERE active = true;

-- Se retornar 0, ativar usuários
UPDATE users SET active = true WHERE id IN (1, 2, 3);
```

### Problema: Erro no Banco de Dados

**Sintoma**:
```
Error: relation "schedule_assignments" does not exist
```

**Solução**:
```bash
# Executar migrações do Drizzle
npm run db:push

# OU manualmente criar tabelas (se não usar Drizzle)
psql -U postgres -d ecclesia -f migrations/schema.sql
```

## 📝 Configuração Opcional

### 1. Ajustar Pesos do Algoritmo

Edite `server/scheduler.ts` para customizar o comportamento:

```typescript
// Linha ~150 em calculateVolunteerScore()

const AVAILABILITY_WEIGHT = 40;    // Padrão: 40
const SPECIALIZATION_WEIGHT = 30;  // Padrão: 30
const ROTATION_WEIGHT = 20;        // Padrão: 20
const CONFIRMATION_WEIGHT = 10;    // Padrão: 10
const MAX_RECENT_ALLOWED = 8;      // Padrão: 8 escalações/mês
```

**Após alterar, recompilar**:
```bash
npm run build
npm restart
```

### 2. Habilitar Logs Detalhados

```typescript
// Adicionar em server/scheduler.ts, método suggestDistribution()

console.log(`[Scheduler] Processando ${schedules.length} escalas`);
console.log(`[Scheduler] Encontrados ${volunteers.length} voluntários`);

// E em calculateVolunteerScore()
console.log(`Score para ${volunteer.name}: ${score}/100`);
```

### 3. Configurar Notificações por Email

Se o EmailService estiver instalado:

```typescript
// Em server/routes.ts, endpoint auto-apply

// Após criar assignment, enviar email
import { emailService } from "./email";

await emailService.sendScheduleAssignment(
  assignment,
  user.email,
  schedule.name
);
```

## ✅ Checklist de Instalação

Use esta checklist para confirmar que tudo está funcionando:

- [ ] ✅ Arquivos do scheduler existem (scheduler.ts, routes.ts, storage.ts)
- [ ] ✅ Projeto compila sem erros TypeScript
- [ ] ✅ Servidor inicia sem erros no console
- [ ] ✅ Endpoint `/api/schedules/auto-suggest` responde (mesmo que 405)
- [ ] ✅ Banco de dados possui todas as tabelas necessárias
- [ ] ✅ Existem dados de teste (ministério, usuários, escalas)
- [ ] ✅ Teste de sugestão retorna JSON válido
- [ ] ✅ Teste de validação funciona corretamente
- [ ] ✅ Teste de aplicação cria assignments no banco
- [ ] ✅ Documentação está acessível (AUTO_SCHEDULER.md)

## 🎉 Próximos Passos

Após instalação bem-sucedida:

1. **Integrar com Frontend**: Criar interface de usuário para distribuição automática
2. **Testar em Produção**: Usar dados reais e validar comportamento
3. **Monitorar Performance**: Observar tempo de resposta e precisão das sugestões
4. **Coletar Feedback**: Perguntar aos administradores sobre a experiência
5. **Otimizar Algoritmo**: Ajustar pesos baseado nos resultados reais

## 📚 Documentação Relacionada

- [Documentação Completa do Scheduler](docs/AUTO_SCHEDULER.md)
- [Documentação de API](docs/API.md)
- [Guia de Email Notifications](docs/EMAIL_NOTIFICATIONS.md)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor (`console.log`)
2. Confirme que todas as dependências estão instaladas
3. Teste endpoints manualmente com `curl`
4. Consulte a seção de Troubleshooting
5. Entre em contato com a equipe de desenvolvimento

---

**Data da Instalação**: _________  
**Versão Instalada**: 1.0.0  
**Instalado por**: _________

✅ **Instalação Completa!**
