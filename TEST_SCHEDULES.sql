-- =====================================================
-- Script para Testar a Página de Escalas
-- Execute este script no PostgreSQL para criar dados de teste
-- =====================================================

-- IMPORTANTE: Ajuste os IDs conforme seu banco de dados

-- 1. VERIFICAR USUÁRIO LOGADO
-- Primeiro, identifique o ID do usuário com quem você está logado
SELECT id, name, email
FROM users
WHERE email = 'seu_email@exemplo.com';
-- Anote o ID retornado

-- 2. CRIAR OU USAR MINISTÉRIO EXISTENTE
-- Verifica se já existe
SELECT id, name
FROM ministries LIMIT
5;

-- Se não houver, cria um novo
INSERT INTO ministries
    (name, description)
VALUES
    ('Louvor', 'Ministério de música e adoração')
ON CONFLICT DO NOTHING
RETURNING id, name;

-- 3. CRIAR FUNÇÕES DO MINISTÉRIO
INSERT INTO ministry_functions
    (ministry_id, name, description)
VALUES
    ((SELECT id
        FROM ministries
        WHERE name = 'Louvor'), 'Guitarrista', 'Toca guitarra'),
    ((SELECT id
        FROM ministries
        WHERE name = 'Louvor'), 'Vocalista', 'Canta no louvor'),
    ((SELECT id
        FROM ministries
        WHERE name = 'Louvor'), 'Baterista', 'Toca bateria'),
    ((SELECT id
        FROM ministries
        WHERE name = 'Louvor'), 'Baixista', 'Toca baixo')
ON CONFLICT DO NOTHING;

-- Verifica as funções criadas
SELECT id, name
FROM ministry_functions;

-- 4. CRIAR ESCALAS DE TESTE (SCHEDULES)

-- Escala para HOJE
INSERT INTO schedules
    (date, type, name)
VALUES
    (
        CURRENT_DATE,
        'SERVICE',
        'Culto de Celebração - Hoje'
)
RETURNING id, date, name;

-- Escala para AMANHÃ
INSERT INTO schedules
    (date, type, name)
VALUES
    (
        CURRENT_DATE + INTERVAL
'1 day', 
  'SERVICE', 
  'Culto de Oração'
)
RETURNING id, date, name;

-- Escala para PRÓXIMA SEMANA
INSERT INTO schedules
    (date, type, name)
VALUES
    (
        CURRENT_DATE + INTERVAL
'7 days', 
  'SERVICE', 
  'Culto Dominical'
)
RETURNING id, date, name;

-- Escala PASSADA (ontem)
INSERT INTO schedules
    (date, type, name)
VALUES
    (
        CURRENT_DATE - INTERVAL
'1 day', 
  'SERVICE', 
  'Culto da Semana Passada'
)
RETURNING id, date, name;

-- Escala FUTURA (próximo mês)
INSERT INTO schedules
    (date, type, name)
VALUES
    (
        CURRENT_DATE + INTERVAL
'30 days', 
  'EVENT', 
  'Retiro Espiritual'
)
RETURNING id, date, name;

-- Verifica as escalas criadas
SELECT id, date, type, name
FROM schedules
ORDER BY date DESC LIMIT 10;

-- 5. CRIAR SCHEDULE_ASSIGNMENTS (ASSOCIAR VOCÊ ÀS ESCALAS)
-- ⚠️ IMPORTANTE: Substitua '1' pelo ID do seu usuário (obtido no passo 1)

-- Assignment 1: HOJE - Status CONFIRMADO
INSERT INTO schedule_assignments
(schedule_id, user_id, function_id, status, notes)
VALUES
(
  (SELECT id
FROM schedules
WHERE name = 'Culto de Celebração - Hoje')
,
  1,
-- ⚠️ SUBSTITUA PELO SEU USER ID
(SELECT id
FROM ministry_functions
WHERE name = 'Guitarrista')
,
  'confirmed',
  'Chegar 30 minutos antes para sound check'
);

-- Assignment 2: AMANHÃ - Status PENDENTE
INSERT INTO schedule_assignments
    (schedule_id, user_id, function_id, status, notes)
VALUES
    (
        (SELECT id
        FROM schedules
        WHERE name = 'Culto de Oração'),
        1, -- ⚠️ SUBSTITUA PELO SEU USER ID
        (SELECT id
        FROM ministry_functions
        WHERE name = 'Vocalista'),
        'pending',
        'Por favor, confirme sua presença'
);

-- Assignment 3: PRÓXIMA SEMANA - Status CONFIRMADO
INSERT INTO schedule_assignments
    (schedule_id, user_id, function_id, status, notes)
VALUES
    (
        (SELECT id
        FROM schedules
        WHERE name = 'Culto Dominical'),
        1, -- ⚠️ SUBSTITUA PELO SEU USER ID
        (SELECT id
        FROM ministry_functions
        WHERE name = 'Baixista'),
        'confirmed',
        NULL
);

-- Assignment 4: PASSADO - Status CONFIRMADO
INSERT INTO schedule_assignments
    (schedule_id, user_id, function_id, status, notes)
VALUES
    (
        (SELECT id
        FROM schedules
        WHERE name = 'Culto da Semana Passada'),
        1, -- ⚠️ SUBSTITUA PELO SEU USER ID
        (SELECT id
        FROM ministry_functions
        WHERE name = 'Guitarrista'),
        'confirmed',
        NULL
);

-- Assignment 5: FUTURO - Status DECLINED
INSERT INTO schedule_assignments
    (schedule_id, user_id, function_id, status, notes)
VALUES
    (
        (SELECT id
        FROM schedules
        WHERE name = 'Retiro Espiritual'),
        1, -- ⚠️ SUBSTITUA PELO SEU USER ID
        (SELECT id
        FROM ministry_functions
        WHERE name = 'Vocalista'),
        'declined',
        'Conflito de agenda - estará viajando'
);

-- 6. VERIFICAR OS DADOS CRIADOS
SELECT
    sa.id,
    sa.status,
    s.name as escala,
    s.date,
    s.type,
    u.name as usuario,
    mf.name as funcao,
    sa.notes
FROM schedule_assignments sa
    INNER JOIN schedules s ON sa.schedule_id = s.id
    INNER JOIN users u ON sa.user_id = u.id
    LEFT JOIN ministry_functions mf ON sa.function_id = mf.id
WHERE sa.user_id = 1
-- ⚠️ SUBSTITUA PELO SEU USER ID
ORDER BY s.date DESC;

-- 7. TESTAR O ENDPOINT (equivalente ao que o frontend chama)
-- Execute esta query para ver exatamente o que o endpoint /api/my-assignments retorna:
SELECT
    sa.id,
    sa.schedule_id as "scheduleId",
    sa.user_id as "userId",
    sa.function_id as "functionId",
    sa.status,
    sa.notes,
    json_build_object(
    'id', s.id,
    'date', s.date,
    'type', s.type,
    'name', s.name
  ) as schedule,
    json_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email
  ) as "user",
    json_build_object(
    'id', mf.id,
    'name', mf.name
  ) as "function"
FROM schedule_assignments sa
    INNER JOIN schedules s ON sa.schedule_id = s.id
    INNER JOIN users u ON sa.user_id = u.id
    LEFT JOIN ministry_functions mf ON sa.function_id = mf.id
WHERE sa.user_id = 1
-- ⚠️ SUBSTITUA PELO SEU USER ID
ORDER BY s.date DESC;

-- =====================================================
-- RESULTADO ESPERADO NA TELA
-- =====================================================
-- Após executar este script e recarregar a página de Escalas, você deve ver:
--
-- SEÇÃO "HOJE":
-- - 1 card: "Culto de Celebração - Hoje"
--   - Badge verde "CONFIRMADO"
--   - Pill "GUITARRISTA"
--   - Data de hoje formatada
--   - Nota: "Chegar 30 minutos antes para sound check"
--
-- SEÇÃO "PRÓXIMAS ESCALAS":
-- - Card 1: "Culto de Oração" (amanhã)
--   - Badge amarelo "PENDENTE"
--   - Pill "VOCALISTA"
--   - Nota: "Por favor, confirme sua presença"
--
-- - Card 2: "Culto Dominical" (próxima semana)
--   - Badge verde "CONFIRMADO"
--   - Pill "BAIXISTA"
--
-- - Card 3: "Retiro Espiritual" (próximo mês)
--   - Badge vermelho "RECUSADO"
--   - Pill "VOCALISTA"
--   - Nota: "Conflito de agenda - estará viajando"
--
-- SEÇÃO "ESCALAS ANTERIORES":
-- - 1 card: "Culto da Semana Passada"
--   - Badge verde "CONFIRMADO"
--   - Pill "GUITARRISTA"
--   - Opacidade reduzida (indica passado)
--
-- =====================================================

-- 8. LIMPEZA (OPCIONAL - Para remover os dados de teste)
-- ⚠️ CUIDADO: Isto vai deletar TODAS as escalas e assignments de teste
/*
DELETE FROM schedule_assignments WHERE user_id = 1; -- Seu user ID
DELETE FROM schedules WHERE name LIKE '%Culto%' OR name LIKE '%Retiro%';
DELETE FROM ministry_functions WHERE ministry_id = (SELECT id FROM ministries WHERE name = 'Louvor');
DELETE FROM ministries WHERE name = 'Louvor';
*/

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- Se ainda ver erro "Erro ao carregar escalas":

-- 1. Verificar se o usuário está logado
-- Abra o console do navegador (F12) e digite:
-- document.cookie
-- Deve aparecer um cookie de sessão

-- 2. Verificar se o endpoint responde
-- No navegador, abra: http://localhost:5000/api/my-assignments
-- Deve retornar um JSON com array de assignments

-- 3. Verificar logs do servidor
-- No terminal onde rodou `npm run dev`, procure por erros
-- Especialmente erros relacionados a getUserScheduleAssignments

-- 4. Verificar se há dados
SELECT COUNT(*) as total_assignments
FROM schedule_assignments
WHERE user_id = 1;
-- Seu user ID

-- 5. Verificar estrutura das tabelas
\d schedule_assignments
\d schedules
\d ministry_functions
\d users
