# Sistema de Distribuição Automática de Escalas

## Visão Geral

O **Sistema de Distribuição Automática** do Ecclesia é um algoritmo inteligente que atribui voluntários a escalas de forma otimizada, considerando múltiplos critérios e garantindo uma distribuição equilibrada e justa.

## Índice

1. [Características](#características)
2. [Como Funciona](#como-funciona)
3. [API Endpoints](#api-endpoints)
4. [Algoritmo de Pontuação](#algoritmo-de-pontuação)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Integração](#integração)
7. [Casos de Uso](#casos-de-uso)
8. [Troubleshooting](#troubleshooting)

---

## Características

### ✨ Funcionalidades Principais

- **Distribuição Inteligente**: Algoritmo baseado em pontuação que considera múltiplos fatores
- **Prevenção de Conflitos**: Evita dupla escalação no mesmo horário
- **Rotatividade Equilibrada**: Distribui carga de trabalho uniformemente entre voluntários
- **Especialização**: Prioriza voluntários com as habilidades necessárias
- **Validação em Tempo Real**: Verifica disponibilidade e conflitos antes de atribuir
- **Modo Sugestão**: Permite revisão manual antes de aplicar mudanças
- **Aplicação Automática**: Opção de aplicar sugestões diretamente ao banco de dados

### 🎯 Benefícios

- Reduz tempo gasto em planejamento manual de escalas
- Garante distribuição justa entre todos os voluntários
- Minimiza erros de atribuição (conflitos, sobrecarga)
- Facilita o gerenciamento de múltiplas escalas simultâneas
- Aumenta satisfação dos voluntários com rotatividade equilibrada

---

## Como Funciona

### Fluxo de Trabalho

```
1. Seleção de Período
   └─> Escolher data inicial e final

2. Busca de Escalas
   └─> Sistema identifica todas as escalas no período

3. Busca de Voluntários
   └─> Lista todos os membros ativos de ministérios relacionados

4. Cálculo de Pontuação
   └─> Para cada voluntário em cada escala:
       ├─> Disponibilidade (40 pontos)
       ├─> Especialização (30 pontos)
       ├─> Rotatividade (20 pontos)
       └─> Taxa de Confirmação (10 pontos)

5. Geração de Sugestões
   └─> Ordena voluntários por pontuação
   └─> Seleciona os melhores candidatos

6. Validação
   └─> Verifica conflitos de horário
   └─> Confirma disponibilidade

7. Aplicação (Opcional)
   └─> Cria assignments no banco de dados
   └─> Envia notificações por email
```

### Arquitetura

```
┌─────────────────────────────────────────┐
│          Frontend (React)               │
│  - Botão "Distribuir Automaticamente"   │
│  - Visualização de Sugestões            │
│  - Aprovação/Rejeição                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      API Routes (Express)               │
│  - POST /api/schedules/auto-suggest     │
│  - POST /api/schedules/auto-apply       │
│  - POST /api/schedules/validate-assign  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    SchedulerService (Singleton)         │
│  - suggestDistribution()                │
│  - applyDistribution()                  │
│  - validateAssignment()                 │
│  - calculateVolunteerScore()            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     DatabaseStorage                     │
│  - getSchedules()                       │
│  - getUsers()                           │
│  - getScheduleAssignments()             │
│  - createScheduleAssignment()           │
└─────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Gerar Sugestões de Distribuição

**Endpoint**: `POST /api/schedules/auto-suggest`

**Descrição**: Analisa escalas e voluntários para gerar sugestões de distribuição sem modificar o banco de dados.

**Request Body**:
```json
{
  "startDate": "2024-02-01",
  "endDate": "2024-02-29",
  "ministryId": 1,
  "requireApproval": true
}
```

**Parâmetros**:
- `startDate` (string, obrigatório): Data inicial no formato YYYY-MM-DD
- `endDate` (string, obrigatório): Data final no formato YYYY-MM-DD
- `ministryId` (number, opcional): ID do ministério específico (null = todos)
- `requireApproval` (boolean, opcional): Se requer aprovação antes de aplicar (padrão: true)

**Response Success** (200):
```json
{
  "success": true,
  "suggestions": [
    {
      "scheduleId": 15,
      "scheduleName": "Louvor - Domingo 10h",
      "scheduleDate": "2024-02-04T10:00:00.000Z",
      "suggestions": [
        {
          "userId": 7,
          "userName": "João Silva",
          "functionId": 2,
          "functionName": "Vocal",
          "score": 95,
          "reasons": [
            "Disponível no horário",
            "Especializado em Vocal",
            "Não escalado recentemente"
          ]
        },
        {
          "userId": 12,
          "userName": "Maria Santos",
          "functionId": 1,
          "functionName": "Instrumento",
          "score": 88,
          "reasons": [
            "Disponível no horário",
            "Especializado em Instrumento",
            "Alta taxa de confirmação"
          ]
        }
      ]
    }
  ],
  "stats": {
    "totalSchedules": 8,
    "totalSuggestions": 16,
    "avgScore": 87.5
  }
}
```

**Response Error** (400/500):
```json
{
  "success": false,
  "message": "Erro ao gerar sugestões",
  "details": "Período inválido: data final anterior à data inicial"
}
```

---

### 2. Aplicar Distribuição Automaticamente

**Endpoint**: `POST /api/schedules/auto-apply`

**Descrição**: Aplica as sugestões de distribuição, criando assignments no banco de dados e enviando notificações.

**Request Body**:
```json
{
  "suggestions": [
    {
      "scheduleId": 15,
      "scheduleName": "Louvor - Domingo 10h",
      "scheduleDate": "2024-02-04T10:00:00.000Z",
      "suggestions": [
        {
          "userId": 7,
          "userName": "João Silva",
          "functionId": 2,
          "functionName": "Vocal",
          "score": 95
        }
      ]
    }
  ]
}
```

**Parâmetros**:
- `suggestions` (array, obrigatório): Array de sugestões geradas pelo endpoint auto-suggest

**Response Success** (200):
```json
{
  "success": true,
  "applied": 14,
  "failed": 2,
  "errors": [
    "João Silva já está escalado para Louvor - Domingo 10h",
    "Maria Santos não está mais ativa"
  ],
  "message": "Distribuição aplicada com sucesso"
}
```

**Response Error** (400/500):
```json
{
  "success": false,
  "message": "Erro ao aplicar distribuição",
  "details": "Formato de sugestões inválido"
}
```

---

### 3. Validar Atribuição Individual

**Endpoint**: `POST /api/schedules/validate-assignment`

**Descrição**: Valida se um usuário pode ser atribuído a uma escala específica antes de criar o assignment.

**Request Body**:
```json
{
  "userId": 7,
  "scheduleId": 15
}
```

**Parâmetros**:
- `userId` (number, obrigatório): ID do usuário a ser validado
- `scheduleId` (number, obrigatório): ID da escala

**Response Success** (200):
```json
{
  "valid": true,
  "reason": "Usuário pode ser escalado"
}
```

**Response Invalid** (200):
```json
{
  "valid": false,
  "reason": "Usuário já escalado para esta data"
}
```

**Response Error** (500):
```json
{
  "valid": false,
  "reason": "Erro ao validar: <mensagem de erro>"
}
```

---

## Algoritmo de Pontuação

### Sistema de Pontos (Total: 100 pontos)

O algoritmo atribui uma pontuação de 0 a 100 para cada voluntário em cada escala, considerando 4 critérios principais:

#### 1. Disponibilidade (40 pontos)

**Peso**: 40% da pontuação total

**Critérios**:
- **Usuário Ativo**: 40 pontos se ativo, 0 se inativo
- **Sem Conflitos de Horário**: Verifica se não há overlap com outras escalas

**Exemplo**:
```typescript
// Usuário ativo e sem conflitos
Score: 40/40 pontos

// Usuário inativo
Score: 0/40 pontos
```

#### 2. Especialização (30 pontos)

**Peso**: 30% da pontuação total

**Critérios**:
- **Função Correspondente**: 30 pontos se o voluntário tem a especialização exata
- **Sem Especialização Definida**: 15 pontos (50% de penalidade)
- **Função Diferente**: 0 pontos

**Exemplo**:
```typescript
// Escala requer "Vocal", voluntário é especializado em "Vocal"
Score: 30/30 pontos

// Escala requer "Vocal", voluntário tem função genérica
Score: 15/30 pontos

// Escala requer "Vocal", voluntário é "Instrumentista"
Score: 0/30 pontos
```

#### 3. Rotatividade (20 pontos)

**Peso**: 20% da pontuação total

**Critérios**:
- Analisa histórico de escalações nos últimos 30 dias
- Quanto menos escalações, maior a pontuação
- Incentiva distribuição equilibrada da carga de trabalho

**Fórmula**:
```typescript
const recentAssignments = /* contagem de escalações nos últimos 30 dias */;
const maxRecentAllowed = 8; // Máximo considerado ideal

if (recentAssignments === 0) {
  score = 20; // Nunca foi escalado recentemente
} else if (recentAssignments <= maxRecentAllowed) {
  score = 20 * (1 - recentAssignments / maxRecentAllowed);
} else {
  score = 0; // Excedeu o limite
}
```

**Exemplo**:
```typescript
// 0 escalações nos últimos 30 dias
Score: 20/20 pontos

// 4 escalações nos últimos 30 dias
Score: 10/20 pontos

// 8 escalações nos últimos 30 dias
Score: 0/20 pontos

// 10+ escalações nos últimos 30 dias
Score: 0/20 pontos
```

#### 4. Taxa de Confirmação (10 pontos)

**Peso**: 10% da pontuação total

**Critérios**:
- Analisa histórico de confirmações em escalas passadas
- Quanto maior a taxa de confirmação, maior a pontuação
- Recompensa voluntários confiáveis

**Fórmula**:
```typescript
const totalAssignments = /* total de escalações */;
const confirmedCount = /* escalações confirmadas */;

if (totalAssignments === 0) {
  score = 10; // Benefício da dúvida para novos membros
} else {
  const confirmationRate = confirmedCount / totalAssignments;
  score = 10 * confirmationRate;
}
```

**Exemplo**:
```typescript
// Novo membro (sem histórico)
Score: 10/10 pontos

// 8 confirmações em 10 escalações (80%)
Score: 8/10 pontos

// 5 confirmações em 10 escalações (50%)
Score: 5/10 pontos

// 0 confirmações em 10 escalações (0%)
Score: 0/10 pontos
```

### Pontuação Total - Exemplos Práticos

#### Exemplo 1: Voluntário Ideal
```
✅ Ativo e disponível: 40/40
✅ Especialização exata: 30/30
✅ Não escalado recentemente: 20/20
✅ 100% de confirmação: 10/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 100/100 pontos ⭐
```

#### Exemplo 2: Voluntário Bom
```
✅ Ativo e disponível: 40/40
⚠️ Função genérica: 15/30
✅ 2 escalações recentes: 15/20
✅ 90% de confirmação: 9/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 79/100 pontos
```

#### Exemplo 3: Voluntário Sobrecarregado
```
✅ Ativo e disponível: 40/40
✅ Especialização exata: 30/30
❌ 10 escalações recentes: 0/20
⚠️ 60% de confirmação: 6/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 76/100 pontos
```

#### Exemplo 4: Voluntário Novo
```
✅ Ativo e disponível: 40/40
⚠️ Sem especialização: 15/30
✅ Novo (sem histórico): 20/20
✅ Novo (benefício dúvida): 10/10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 85/100 pontos
```

---

## Exemplos de Uso

### Exemplo 1: Interface de Administração

```typescript
// Frontend - Página de Escalas Admin
import { useState } from 'react';

function AutoScheduleDialog({ startDate, endDate, ministryId }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  // Passo 1: Gerar sugestões
  const handleGenerateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedules/auto-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ministryId,
          requireApproval: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
        alert(`${data.stats.totalSuggestions} sugestões geradas!`);
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      alert('Erro ao gerar sugestões');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Aplicar sugestões
  const handleApplySuggestions = async () => {
    if (!suggestions) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/schedules/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestions })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.applied} atribuições criadas!\n❌ ${data.failed} falharam.`);
        if (data.errors.length > 0) {
          console.log('Erros:', data.errors);
        }
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      alert('Erro ao aplicar distribuição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleGenerateSuggestions} 
        disabled={loading}
      >
        {loading ? 'Gerando...' : 'Gerar Sugestões'}
      </button>
      
      {suggestions && (
        <>
          <div className="suggestions-list">
            {suggestions.map(sched => (
              <div key={sched.scheduleId}>
                <h3>{sched.scheduleName}</h3>
                {sched.suggestions.map(vol => (
                  <div key={vol.userId}>
                    {vol.userName} - {vol.functionName} 
                    (Pontuação: {vol.score})
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleApplySuggestions}
            disabled={loading}
          >
            {loading ? 'Aplicando...' : 'Aplicar Distribuição'}
          </button>
        </>
      )}
    </div>
  );
}
```

### Exemplo 2: Script de Automação

```bash
# Script Shell para distribuição automática semanal

#!/bin/bash

# Configurações
API_URL="https://ecclesia.app/api/schedules"
START_DATE=$(date +%Y-%m-%d)
END_DATE=$(date -d "+7 days" +%Y-%m-%d)
MINISTRY_ID=1

# Gerar sugestões
SUGGESTIONS=$(curl -X POST "${API_URL}/auto-suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "'${START_DATE}'",
    "endDate": "'${END_DATE}'",
    "ministryId": '${MINISTRY_ID}',
    "requireApproval": false
  }')

# Verificar sucesso
if echo "$SUGGESTIONS" | jq -e '.success' > /dev/null; then
  echo "✅ Sugestões geradas com sucesso"
  
  # Aplicar automaticamente
  curl -X POST "${API_URL}/auto-apply" \
    -H "Content-Type: application/json" \
    -d "$SUGGESTIONS"
    
  echo "✅ Distribuição aplicada"
else
  echo "❌ Erro ao gerar sugestões"
  exit 1
fi
```

### Exemplo 3: Validação Manual

```typescript
// Backend - Validar antes de criar assignment manual

router.post("/api/schedules/:id/assignments", async (req, res) => {
  const { userId, functionId } = req.body;
  const scheduleId = parseInt(req.params.id);

  // Validar antes de criar
  const validation = await schedulerService.validateAssignment(
    userId,
    scheduleId
  );

  if (!validation.valid) {
    return res.status(400).json({
      error: validation.reason
    });
  }

  // Prosseguir com criação normal
  const assignment = await storage.createScheduleAssignment({
    scheduleId,
    userId,
    functionId,
    status: "PENDING"
  });

  res.json(assignment);
});
```

---

## Integração

### Pré-requisitos

1. **Banco de Dados**:
   - Tabelas: `users`, `schedules`, `schedule_assignments`, `ministries`, `ministry_members`
   - Campos necessários: `active` em users, `date` e `time` em schedules

2. **Backend**:
   - Express.js configurado
   - DatabaseStorage implementado
   - Sistema de autenticação funcionando

3. **Email (Opcional)**:
   - EmailService configurado para notificações automáticas

### Passos de Integração

#### 1. Importar o Serviço

```typescript
// server/index.ts ou server/routes.ts
import { schedulerService } from "./scheduler";
```

#### 2. Adicionar Rotas (já incluídas no routes.ts)

As rotas já estão configuradas em `server/routes.ts`:
- `POST /api/schedules/auto-suggest`
- `POST /api/schedules/auto-apply`
- `POST /api/schedules/validate-assignment`

#### 3. Criar Interface Frontend

Adicionar botão na interface de administração de escalas:

```tsx
// client/src/pages/Admin/AdminSchedules.tsx

<Button 
  onClick={() => setShowAutoDistributeDialog(true)}
  className="btn-primary"
>
  <Calendar className="mr-2 h-4 w-4" />
  Distribuir Automaticamente
</Button>
```

#### 4. Implementar Dialog de Distribuição

```tsx
<Dialog open={showAutoDistributeDialog} onOpenChange={setShowAutoDistributeDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Distribuição Automática</DialogTitle>
      <DialogDescription>
        Selecione o período e o sistema irá sugerir a melhor distribuição de voluntários
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Data Inicial</Label>
        <Input type="date" value={startDate} onChange={...} />
      </div>
      
      <div>
        <Label>Data Final</Label>
        <Input type="date" value={endDate} onChange={...} />
      </div>
      
      <div>
        <Label>Ministério (opcional)</Label>
        <Select value={ministryId} onValueChange={...}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os ministérios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ministries.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={...}>Cancelar</Button>
      <Button onClick={handleGenerateSuggestions}>
        Gerar Sugestões
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 5. Testar Integração

```bash
# 1. Testar endpoint de sugestão
curl -X POST http://localhost:5000/api/schedules/auto-suggest \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-02-01",
    "endDate": "2024-02-29"
  }'

# 2. Verificar resposta JSON

# 3. Testar aplicação (se sugestões foram geradas)
# (Copiar JSON de sugestões da resposta anterior)
curl -X POST http://localhost:5000/api/schedules/auto-apply \
  -H "Content-Type: application/json" \
  -d '{"suggestions": [...]}'
```

---

## Casos de Uso

### Caso de Uso 1: Planejamento Mensal

**Cenário**: Igreja planeja escala de louvor para todo o mês

**Passos**:
1. Administrador acessa página de Escalas
2. Clica em "Distribuir Automaticamente"
3. Seleciona período: 01/02/2024 a 29/02/2024
4. Seleciona ministério: "Louvor e Adoração"
5. Clica em "Gerar Sugestões"
6. Revisa as 8 escalas sugeridas
7. Ajusta manualmente 2 casos específicos
8. Clica em "Aplicar Distribuição"
9. Sistema cria 24 assignments
10. Envia 24 emails de notificação

**Resultado**:
- ⏱️ Tempo economizado: ~2 horas de planejamento manual
- ✅ Distribuição equilibrada: todos os voluntários participam 2-3 vezes
- 📧 Notificações automáticas enviadas
- 🎯 Taxa de confirmação esperada: >85%

### Caso de Uso 2: Substituição de Emergência

**Cenário**: Voluntário cancela participação na última hora

**Passos**:
1. Administrador remove assignment cancelado
2. Usa endpoint de validação para verificar candidatos
3. Sistema sugere 3 voluntários disponíveis
4. Seleciona o melhor (maior pontuação)
5. Cria novo assignment manualmente
6. Email de notificação enviado automaticamente

**Resultado**:
- ⏱️ Substituição em <5 minutos
- ✅ Voluntário qualificado encontrado
- 🔔 Novo escalado notificado imediatamente

### Caso de Uso 3: Balanceamento de Carga

**Cenário**: Alguns voluntários estão sobrecarregados

**Passos**:
1. Sistema detecta voluntários com >8 escalações/mês
2. Penaliza na pontuação (score de rotatividade = 0)
3. Prioriza voluntários menos escalados
4. Redistribui futuras escalas automaticamente

**Resultado**:
- ⚖️ Carga equilibrada entre todos os membros
- 😊 Maior satisfação dos voluntários
- 📉 Redução de burnout e cancelamentos

### Caso de Uso 4: Integração de Novos Membros

**Cenário**: Igreja recebe 5 novos voluntários no ministério

**Passos**:
1. Administrador cadastra novos membros
2. Define funções/especialidades
3. Sistema de distribuição automaticamente:
   - Detecta histórico vazio (score de rotatividade = 20/20)
   - Aplica benefício da dúvida (score de confirmação = 10/10)
   - Prioriza esses membros nas próximas escalas
4. Novos membros recebem primeiras atribuições rapidamente

**Resultado**:
- 🎉 Integração rápida e organizada
- 📈 Novos membros se sentem incluídos
- 🔄 Distribuição justa desde o início

---

## Troubleshooting

### Problema 1: Nenhuma Sugestão Gerada

**Sintoma**:
```json
{
  "success": true,
  "suggestions": [],
  "stats": {
    "totalSchedules": 0,
    "totalSuggestions": 0,
    "avgScore": 0
  }
}
```

**Causas Possíveis**:
- Nenhuma escala no período especificado
- Nenhum voluntário ativo no ministério
- Todos os voluntários já escalados

**Soluções**:
1. Verificar se existem escalas criadas no período
2. Confirmar que ministério tem membros ativos
3. Ampliar período de busca
4. Verificar filtros aplicados

### Problema 2: Todos os Scores Baixos

**Sintoma**:
```json
{
  "suggestions": [
    {
      "userId": 7,
      "score": 25,
      "reasons": ["Disponível no horário"]
    }
  ]
}
```

**Causas Possíveis**:
- Voluntários sem especialização definida
- Todos com muitas escalações recentes
- Baixa taxa de confirmação histórica

**Soluções**:
1. Cadastrar funções/especialidades dos membros
2. Aguardar período de descanso entre escalas
3. Ajustar parâmetros do algoritmo (maxRecentAllowed)
4. Revisar dados históricos de confirmação

### Problema 3: Erro ao Aplicar Distribuição

**Sintoma**:
```json
{
  "success": false,
  "message": "Erro ao aplicar distribuição",
  "details": "Database connection timeout"
}
```

**Causas Possíveis**:
- Erro de conexão com banco de dados
- Dados inválidos nas sugestões
- Conflito de transação

**Soluções**:
1. Verificar conexão com PostgreSQL
2. Validar formato JSON das sugestões
3. Tentar novamente após alguns segundos
4. Verificar logs do servidor

### Problema 4: Conflitos de Horário não Detectados

**Sintoma**: Voluntário escalado em dois lugares ao mesmo tempo

**Causas Possíveis**:
- Horários das escalas não configurados corretamente
- Função de validação não chamada
- Race condition em requests simultâneos

**Soluções**:
1. Garantir que schedules tenham `date` e `time` preenchidos
2. Sempre chamar `validateAssignment()` antes de criar
3. Implementar locks de transação no banco
4. Revisar escalas manualmente após distribuição automática

### Problema 5: Emails não Enviados

**Sintoma**: Assignments criados mas voluntários não recebem notificações

**Causas Possíveis**:
- EmailService não configurado
- SMTP com erro
- Modo simulado ativo

**Soluções**:
1. Verificar variáveis de ambiente SMTP
2. Testar EmailService manualmente
3. Verificar logs de erro de email
4. Confirmar que users têm emails cadastrados

---

## Configurações Avançadas

### Ajustar Pesos do Algoritmo

Para customizar o comportamento do algoritmo, edite os pesos em `server/scheduler.ts`:

```typescript
// Linha ~150
private calculateVolunteerScore(
  volunteer: MinistryMember,
  schedule: Schedule,
  recentAssignments: number,
  confirmationRate: number
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // AJUSTE 1: Peso da disponibilidade (padrão: 40)
  const AVAILABILITY_WEIGHT = 40;
  
  // AJUSTE 2: Peso da especialização (padrão: 30)
  const SPECIALIZATION_WEIGHT = 30;
  
  // AJUSTE 3: Peso da rotatividade (padrão: 20)
  const ROTATION_WEIGHT = 20;
  
  // AJUSTE 4: Peso da confirmação (padrão: 10)
  const CONFIRMATION_WEIGHT = 10;
  
  // AJUSTE 5: Limite de escalações recentes (padrão: 8)
  const MAX_RECENT_ALLOWED = 8;
  
  // ... resto do código
}
```

### Adicionar Novos Critérios

Para adicionar critérios personalizados (ex: preferência de horário):

```typescript
// Adicionar novo campo ao schema
// shared/schema.ts
export const users = pgTable("users", {
  // ... campos existentes
  preferredShift: text("preferred_shift"), // "morning", "afternoon", "evening"
});

// Implementar lógica no calculateVolunteerScore
// server/scheduler.ts
if (volunteer.preferredShift === schedule.shift) {
  score += 5; // Bônus de 5 pontos
  reasons.push("Horário preferido");
}
```

### Logging e Monitoramento

Habilitar logs detalhados:

```typescript
// server/scheduler.ts
// Adicionar console.logs para debug

console.log(`[Scheduler] Calculando score para ${volunteer.name}`);
console.log(`  - Disponibilidade: ${availabilityScore}/40`);
console.log(`  - Especialização: ${specializationScore}/30`);
console.log(`  - Rotatividade: ${rotationScore}/20`);
console.log(`  - Confirmação: ${confirmationScore}/10`);
console.log(`  - TOTAL: ${score}/100`);
```

---

## Roadmap Futuro

### Melhorias Planejadas

- [ ] Machine Learning para prever probabilidade de confirmação
- [ ] Sugestões baseadas em preferências pessoais dos voluntários
- [ ] Integração com calendário externo (Google Calendar)
- [ ] Modo "automático total" com distribuição sem aprovação
- [ ] Dashboard de análise de distribuição (relatórios)
- [ ] API para webhooks de notificação
- [ ] Suporte a múltiplos fusos horários
- [ ] Distribuição baseada em proximidade geográfica

---

## Suporte

Para dúvidas ou problemas:

1. Consulte a documentação completa
2. Verifique issues conhecidos no GitHub
3. Entre em contato com a equipe de desenvolvimento
4. Consulte logs do servidor para detalhes de erro

---

## Licença

Este módulo faz parte do projeto Ecclesia e segue a mesma licença do projeto principal.

---

**Última atualização**: Fevereiro 2024  
**Versão**: 1.0.0  
**Autor**: Equipe Ecclesia
