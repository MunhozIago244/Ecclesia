# Changelog - Sistema de Distribuição Automática de Escalas

Todas as mudanças notáveis neste módulo serão documentadas neste arquivo.

## [1.0.0] - 2024-02-04

### 🎉 Lançamento Inicial

Primeiro lançamento do sistema de distribuição automática de escalas para o Ecclesia.

### ✨ Adicionado

#### Serviço Principal (`server/scheduler.ts`)
- **SchedulerService**: Classe singleton para gerenciar distribuição automática
- **Algoritmo de Pontuação Inteligente**:
  - Critério de Disponibilidade (40 pontos): Verifica status ativo e conflitos de horário
  - Critério de Especialização (30 pontos): Prioriza voluntários com funções correspondentes
  - Critério de Rotatividade (20 pontos): Equilibra carga de trabalho baseado em histórico de 30 dias
  - Critério de Taxa de Confirmação (10 pontos): Recompensa voluntários confiáveis
- **Método `suggestDistribution()`**: Gera sugestões sem modificar banco de dados
- **Método `applyDistribution()`**: Aplica sugestões criando assignments e enviando emails
- **Método `validateAssignment()`**: Valida atribuição individual antes de criar
- **Método `calculateVolunteerScore()`**: Calcula pontuação de 0-100 para cada candidato

#### API Endpoints (`server/routes.ts`)
- **POST `/api/schedules/auto-suggest`**:
  - Parâmetros: `startDate`, `endDate`, `ministryId`, `requireApproval`
  - Retorna: Lista de sugestões com scores e razões
  - Requer: Autenticação
  - Permissões: Admin ou Leader
  
- **POST `/api/schedules/auto-apply`**:
  - Parâmetros: `suggestions` (array de sugestões)
  - Retorna: Contadores de sucesso/falha e lista de erros
  - Requer: Autenticação + Permissão de Admin
  - Ação: Cria schedule_assignments e envia emails
  
- **POST `/api/schedules/validate-assignment`**:
  - Parâmetros: `userId`, `scheduleId`
  - Retorna: `{ valid: boolean, reason: string }`
  - Requer: Autenticação
  - Uso: Validação antes de criação manual de assignments

#### Camada de Dados (`server/storage.ts`)
- **Método `getScheduleAssignments(scheduleId)`**:
  - Retorna: Array de assignments para uma escala específica
  - Uso: Verificar duplicatas e conflitos
  - Tipo de Retorno: `ScheduleAssignment[]`

#### Documentação
- **`docs/AUTO_SCHEDULER.md`**: Documentação completa do sistema (580+ linhas)
  - Visão geral e características
  - Como funciona (fluxo de trabalho e arquitetura)
  - API endpoints com exemplos completos
  - Algoritmo de pontuação detalhado
  - Exemplos de uso práticos
  - Guia de integração
  - 4 casos de uso reais
  - Troubleshooting completo
  - Configurações avançadas
  
- **`INSTALL_SCHEDULER.md`**: Guia de instalação passo a passo (400+ linhas)
  - Pré-requisitos e verificações
  - 5 passos de instalação
  - 4 testes de funcionalidade
  - Troubleshooting de instalação
  - Configurações opcionais
  - Checklist de instalação

- **`CHANGELOG_SCHEDULER.md`**: Este arquivo

### 🔧 Modificado

#### `server/routes.ts`
- Importado `schedulerService` de `./scheduler`
- Importado tipo `insertScheduleAssignmentSchema` de `@shared/schema`
- Adicionadas 3 novas rotas na seção de schedules
- Integrado com sistema de permissões existente

#### `server/storage.ts`
- Adicionado método `getScheduleAssignments()` para buscar assignments por scheduleId
- Melhoria na consulta de schedule assignments
- Suporte para validação de duplicatas

#### `shared/schema.ts`
- Importado tipo `ScheduleAssignment` para uso no scheduler service
- Garantia de tipagem forte em todo o fluxo

### 🏗️ Arquitetura

#### Padrões Utilizados
- **Singleton Pattern**: SchedulerService é instanciado uma vez e reutilizado
- **Dependency Injection**: Service recebe storage como dependência
- **Separation of Concerns**: Lógica de negócio separada de rotas e dados
- **Type Safety**: TypeScript forte em todas as camadas

#### Estrutura de Dados

**MinistryMember (Extended User)**:
```typescript
{
  id: number,
  name: string,
  email: string,
  active: boolean,
  ministryId: number,
  functionId: number | null,
  functionName: string | null
}
```

**VolunteerWithScore**:
```typescript
{
  user: User,
  functionId: number | null,
  functionName: string | null,
  score: number,      // 0-100
  reasons: string[]   // Explicações da pontuação
}
```

**DistributionSuggestion**:
```typescript
{
  scheduleId: number,
  scheduleName: string,
  scheduleDate: string,
  suggestions: [{
    userId: number,
    userName: string,
    functionId: number | null,
    functionName: string | null,
    score: number,
    reasons: string[]
  }]
}
```

### 📊 Estatísticas

- **Linhas de Código**: ~800 novas linhas
  - scheduler.ts: 476 linhas
  - routes.ts: +80 linhas
  - storage.ts: +10 linhas
  - Documentação: 1000+ linhas
  
- **Testes Cobertos**:
  - Geração de sugestões ✅
  - Aplicação de distribuição ✅
  - Validação de assignments ✅
  - Cálculo de pontuação ✅
  
- **Compatibilidade**:
  - Node.js: 18+
  - PostgreSQL: 15+
  - TypeScript: 5.6+

### 🎯 Critérios de Aceitação Atendidos

- [x] Sistema calcula pontuação inteligente para voluntários
- [x] Considera disponibilidade (sem conflitos de horário)
- [x] Prioriza especialização (funções correspondentes)
- [x] Equilibra rotatividade (evita sobrecarga)
- [x] Recompensa confiabilidade (taxa de confirmação)
- [x] Gera sugestões sem modificar banco (modo preview)
- [x] Permite aplicação automática com validação
- [x] Valida assignments individuais antes de criar
- [x] Integra com sistema de emails para notificações
- [x] Documenta completamente o sistema
- [x] Fornece exemplos práticos de uso
- [x] Inclui troubleshooting detalhado

### 🔒 Segurança

- **Autenticação Obrigatória**: Todos os endpoints requerem usuário logado
- **Autorização por Permissões**: 
  - `auto-suggest`: Requer `canManageSchedules` (Admin ou Leader)
  - `auto-apply`: Requer Admin
  - `validate-assignment`: Qualquer usuário autenticado
- **Validação de Entrada**: Datas, IDs e estruturas validadas
- **SQL Injection Protection**: Uso de Drizzle ORM com queries parametrizadas
- **Type Safety**: TypeScript previne erros de tipo em runtime

### ⚡ Performance

- **Otimizações**:
  - Singleton pattern evita re-instanciação do service
  - Queries SQL otimizadas com joins eficientes
  - Cálculo de score em memória (sem queries adicionais)
  - Validação em lote com Promise.all
  
- **Benchmarks Esperados** (servidor comum):
  - Gerar sugestões para 10 escalas: ~500ms
  - Aplicar distribuição de 20 assignments: ~2s (incluindo emails)
  - Validar 1 assignment: ~50ms

### 🐛 Correções

#### Problemas Resolvidos Durante Desenvolvimento

1. **Erro de Tipo: Schedule sem 'assignments'**
   - Problema: Type Schedule não incluía propriedade assignments
   - Solução: Criado método `getScheduleAssignments()` em storage
   - Commit: Adicionado tipo `ScheduleAssignment` aos imports

2. **Import Faltando: insertScheduleAssignmentSchema**
   - Problema: Schema não importado em routes.ts
   - Solução: Adicionado import de `@shared/schema`
   - Impacto: Permite validação de dados no endpoint auto-apply

3. **Erro de Contexto: this.storage não definido**
   - Problema: Referência incorreta ao storage em método estático
   - Solução: Usado `storage` diretamente (importação global)
   - Melhoria: Mantida consistência com outros serviços

4. **Tipos Implícitos 'any' em Callbacks**
   - Problema: TypeScript não inferindo tipo em .find()
   - Solução: Anotações de tipo explícitas `(a: ScheduleAssignment)`
   - Benefício: Type safety completo em todo o código

### 📋 Tarefas Futuras (Roadmap)

#### v1.1.0 (Curto Prazo)
- [ ] Interface frontend para distribuição automática
- [ ] Visualização de sugestões antes de aplicar
- [ ] Histórico de distribuições aplicadas
- [ ] Estatísticas de uso do sistema

#### v1.2.0 (Médio Prazo)
- [ ] Preferências pessoais dos voluntários (horários favoritos)
- [ ] Machine Learning para prever probabilidade de confirmação
- [ ] Dashboard de análise e relatórios
- [ ] Export de relatórios em PDF/Excel

#### v2.0.0 (Longo Prazo)
- [ ] Integração com calendário externo (Google Calendar)
- [ ] Modo "piloto automático" totalmente autônomo
- [ ] Suporte a múltiplos fusos horários
- [ ] Webhooks para integrações externas
- [ ] API pública para aplicativos mobile

### 🤝 Contribuições

Este módulo foi desenvolvido como parte do Ecclesia Project para melhorar a experiência de gestão de escalas em igrejas e organizações religiosas.

**Desenvolvido por**: Equipe Ecclesia  
**Versão**: 1.0.0  
**Data de Lançamento**: 04 de Fevereiro de 2024

### 📞 Suporte

Para reportar bugs ou solicitar features:
1. Abra uma issue no GitHub
2. Consulte a documentação completa
3. Entre em contato com a equipe de desenvolvimento

---

## Histórico de Versões

### [1.0.0] - 2024-02-04
- Lançamento inicial do sistema de distribuição automática

---

**Nota**: Este changelog segue o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
