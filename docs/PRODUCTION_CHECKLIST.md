# ✅ Checklist de Produção - Ecclesia

## 📋 Antes do Deploy

### 1. Código e Versionamento
- [ ] Todo código commitado no Git
- [ ] Branch `main` estável e testada
- [ ] `.env` NÃO está no repositório
- [ ] `.gitignore` configurado corretamente
- [ ] `README.md` atualizado
- [ ] Documentação completa

### 2. Configuração do Ambiente
- [ ] `NODE_ENV=production` configurado
- [ ] `SESSION_SECRET` gerado (mínimo 32 caracteres aleatórios)
- [ ] `DATABASE_URL` configurada
- [ ] `PORT` definida (5000)
- [ ] `APP_URL` configurada com domínio correto

### 3. Banco de Dados
- [ ] PostgreSQL provisionado
- [ ] Credenciais seguras criadas
- [ ] `DATABASE_URL` testada
- [ ] Schema aplicado (`npm run db:push`)
- [ ] Backup configurado
- [ ] Índices verificados

### 4. Email (SMTP)
- [ ] Provedor de email escolhido (Gmail/SendGrid/SES)
- [ ] Credenciais SMTP configuradas
- [ ] Email de teste enviado com sucesso
- [ ] Templates de email verificados
- [ ] Sender verificado (se SendGrid/SES)

### 5. Segurança
- [ ] Senhas fortes em todas as variáveis
- [ ] Rate limiting configurado
- [ ] CORS configurado (se necessário)
- [ ] Headers de segurança verificados
- [ ] SSL/HTTPS habilitado
- [ ] Firewall configurado (se VPS)

### 6. Performance
- [ ] Build de produção testado localmente
- [ ] Assets otimizados (imagens, scripts)
- [ ] Queries do banco otimizadas
- [ ] Cache configurado
- [ ] CDN configurado (opcional)

---

## 🚀 Durante o Deploy

### 1. Plataforma de Hospedagem
- [ ] Conta criada (Render/Railway/VPS)
- [ ] Repositório conectado (se GitHub deploy)
- [ ] Build command configurado: `npm install --legacy-peer-deps`
- [ ] Start command configurado: `npm run dev`
- [ ] Health check configurado (se disponível)

### 2. Variáveis de Ambiente
Verificar TODAS as variáveis:

```env
✓ NODE_ENV=production
✓ DATABASE_URL=postgresql://...
✓ SESSION_SECRET=xxxxxxxxxxxxx
✓ PORT=5000
✓ APP_URL=https://...
✓ SMTP_HOST=smtp....
✓ SMTP_PORT=587
✓ SMTP_SECURE=false
✓ SMTP_USER=xxx
✓ SMTP_PASS=xxx
✓ SMTP_FROM_NAME=Ecclesia
```

### 3. Primeiro Deploy
- [ ] Deploy iniciado
- [ ] Logs monitorados
- [ ] Build completado sem erros
- [ ] Aplicação iniciou corretamente
- [ ] URL acessível
- [ ] Página de login carrega

### 4. Inicialização do Banco
- [ ] Schema aplicado automaticamente
- [ ] Ou executar manualmente: `npm run db:push`
- [ ] Tabelas criadas
- [ ] Relações verificadas

---

## ✅ Após o Deploy

### 1. Testes Funcionais

#### Login e Autenticação
- [ ] Página de login carrega
- [ ] Registro de novo usuário funciona
- [ ] Login com credenciais corretas funciona
- [ ] Logout funciona
- [ ] Sessão persiste após refresh
- [ ] Redirecionamento correto após login

#### Dashboard
- [ ] Dashboard carrega
- [ ] Cards de estatísticas exibem dados
- [ ] Gráficos renderizam (se houver)
- [ ] Navegação entre páginas funciona

#### Ministérios
- [ ] Listagem de ministérios funciona
- [ ] Criar novo ministério funciona
- [ ] Editar ministério funciona
- [ ] Adicionar membros funciona
- [ ] Adicionar funções funciona
- [ ] Deletar ministério funciona

#### Escalas
- [ ] Listagem de escalas funciona
- [ ] Criar nova escala funciona
- [ ] Editar escala funciona
- [ ] Adicionar membros manualmente funciona
- [ ] Auto-distribuição funciona
- [ ] Visualizar escala funciona
- [ ] Deletar escala funciona

#### Notificações de Email
- [ ] Email de boas-vindas enviado
- [ ] Email de atribuição enviado
- [ ] Email de lembrete enviado
- [ ] Email de escala criada enviado
- [ ] Formato dos emails correto
- [ ] Links nos emails funcionam

#### Admin
- [ ] Painel de admin acessível (apenas admin)
- [ ] Gerenciar usuários funciona
- [ ] Aprovar usuários funciona
- [ ] Logs de auditoria funcionam
- [ ] Permissões respeitadas

### 2. Testes de Performance
- [ ] Página carrega em menos de 3 segundos
- [ ] Navegação é fluida
- [ ] Queries não estão lentas
- [ ] Sem memory leaks
- [ ] Sem erros no console

### 3. Testes de Segurança
- [ ] HTTPS habilitado
- [ ] Cookies secure/httpOnly
- [ ] CSRF protection ativo
- [ ] SQL injection protegido (Drizzle ORM)
- [ ] XSS protegido (React escaping)
- [ ] Rate limiting funcionando
- [ ] Autenticação obrigatória em rotas protegidas

### 4. Monitoramento
- [ ] Logs acessíveis
- [ ] Erros sendo registrados
- [ ] Uptime monitoring configurado (opcional)
- [ ] Alertas configurados (opcional)
- [ ] Métricas disponíveis

---

## 👥 Configuração Inicial

### 1. Criar Usuário Admin

**Opção A: Via Shell (Render/Railway)**
```bash
# Conectar ao banco
psql $DATABASE_URL

# Criar admin (use bcrypt para hash da senha)
INSERT INTO users (name, email, password, role, active, created_at)
VALUES (
  'Administrador',
  'admin@suaigreja.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'admin',
  true,
  NOW()
);
```

**Opção B: Via Registro**
1. Registre usuário normalmente
2. No banco, atualize role para 'admin':
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@suaigreja.com';
```

### 2. Configuração Inicial do Sistema

Após login como admin:

1. **Criar Ministérios Base**:
   - Louvor
   - Multimídia
   - Recepção
   - Infantil
   - etc.

2. **Adicionar Funções aos Ministérios**:
   - Ex: Louvor → Vocal, Guitarra, Bateria, Teclado
   - Ex: Multimídia → Projeção, Som, Câmera

3. **Cadastrar Membros**:
   - Convidar usuários para registrar
   - Aprovar usuários pendentes
   - Atribuir a ministérios

4. **Criar Primeira Escala**:
   - Definir evento/culto
   - Testar distribuição automática
   - Verificar notificações

---

## 🔍 Troubleshooting Comum

### Problema: Aplicação não inicia

**Sintomas**: Deploy ok mas app crashando

**Verificar**:
1. Logs do servidor
2. `DATABASE_URL` está correta?
3. `SESSION_SECRET` está definido?
4. Porta está disponível?

**Solução**:
```bash
# Ver logs
render logs -f  # ou railway logs

# Verificar variáveis
echo $DATABASE_URL
```

### Problema: Banco não conecta

**Sintomas**: "Connection refused" ou "timeout"

**Verificar**:
1. Banco está online?
2. URL está correta (internal vs external)?
3. Firewall bloqueando?

**Solução**:
```bash
# Testar conexão
psql $DATABASE_URL

# Se falhar, verificar IP/porta/credenciais
```

### Problema: Emails não enviam

**Sintomas**: "SMTP error" ou emails não chegam

**Verificar**:
1. Credenciais SMTP corretas?
2. Senha de app (se Gmail)?
3. Sender verificado (se SendGrid)?
4. Porta 587 aberta?

**Solução**:
```bash
# Testar SMTP
npm install -g nodemailer-cli
nodemailer-cli \
  --host=smtp.gmail.com \
  --port=587 \
  --user=seu@email.com \
  --pass=senha \
  --to=destino@email.com \
  --subject=Teste \
  --body="Teste"
```

### Problema: Session não persiste

**Sintomas**: Logout automático, sessão perdida

**Verificar**:
1. `SESSION_SECRET` está definido?
2. Cookies estão habilitados?
3. HTTPS configurado?

**Solução**:
- Verificar `SESSION_SECRET` não muda a cada deploy
- Se usar múltiplas instâncias, usar Redis para sessions

### Problema: Build muito lento

**Sintomas**: Deploy demora muito

**Solução**:
- Usar `--legacy-peer-deps` no install
- Limpar cache: `npm cache clean --force`
- Upgrade plano se free tier

---

## 📊 Métricas de Sucesso

### Performance
- ✅ Tempo de resposta < 500ms (média)
- ✅ Tempo de carregamento < 3s
- ✅ Uptime > 99.5%

### Funcionalidade
- ✅ Zero erros críticos
- ✅ Todas features funcionando
- ✅ Emails chegando

### Usuários
- ✅ Admin criado
- ✅ Membros conseguem usar
- ✅ Feedback positivo

---

## 📚 Documentação de Referência

- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Guia completo de deploy
- [README.md](./README.md) - Visão geral do projeto
- [REVISAO_COMPLETA.md](./REVISAO_COMPLETA.md) - Revisão técnica
- [.env.example](./.env.example) - Variáveis de ambiente

---

## 🎉 Deploy Completo!

Quando todos os itens estiverem ✅:

1. ✅ Sistema está em produção
2. ✅ Usuários podem acessar
3. ✅ Todas funcionalidades operacionais
4. ✅ Monitoramento ativo
5. ✅ Backup configurado

**🚀 Parabéns! Seu sistema Ecclesia está rodando em produção!**

---

## 📞 Suporte

- **Issues**: https://github.com/seu-usuario/ecclesia/issues
- **Email**: suporte@ecclesia.app (se configurado)
- **Documentação**: Veja arquivos .md no projeto

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
