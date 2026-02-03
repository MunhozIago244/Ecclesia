# ⚠️ AVISO DE SEGURANÇA - LEIA ANTES DE USAR

## 🔐 Sobre Credenciais nos Arquivos de Documentação

**IMPORTANTE**: Todos os exemplos de credenciais SMTP, senhas e API keys nesta documentação são **PLACEHOLDERS FICTÍCIOS** para fins educacionais.

### ❌ Exemplos que NÃO são credenciais reais:

- `SG.sua_api_key_aqui` → Placeholder do SendGrid
- `apikey` → Usuário padrão do SendGrid/Mailgun
- `abcd efgh ijkl mnop` → Exemplo de senha de app do Gmail
- `seu_access_key` / `seu_secret_key` → Placeholders AWS
- `XXXXXXXXXXXXXXXX` → Máscara de exemplo

### ✅ Como usar com segurança:

1. **NUNCA** commite arquivos `.env` com credenciais reais
2. Use `.env.example` para templates
3. Adicione `.env` ao `.gitignore` (já configurado)
4. Gere suas próprias credenciais nos serviços oficiais:
   - Gmail: https://myaccount.google.com/apppasswords
   - SendGrid: https://app.sendgrid.com/settings/api_keys
   - AWS SES: https://console.aws.amazon.com/iam/

### 🛡️ GitGuardian Alerts

Se você recebeu um alerta do GitGuardian:

1. ✅ **Falso positivo** - Se for exemplo de documentação (como este)
2. ❌ **Real** - Se commitou arquivo `.env` real

**Se commitou credenciais reais**:

```bash
# 1. Revogue as credenciais imediatamente no serviço
# 2. Gere novas credenciais
# 3. Limpe o histórico do Git:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 4. Force push (CUIDADO - só em repositórios pessoais)
git push origin --force --all
```

### 📚 Mais Informações

- Ver: [.gitguardian.yaml](.gitguardian.yaml) - Config para ignorar falsos positivos
- Ver: [.gitignore](.gitignore) - Arquivos nunca commitados
- Ver: [.env.example](.env.example) - Template seguro

---

**Lembre-se**: Quando em dúvida, SEMPRE considere uma credencial como comprometida e a renove.

Segurança primeiro! 🔒
