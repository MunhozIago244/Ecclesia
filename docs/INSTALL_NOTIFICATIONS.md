# 🚀 Guia de Instalação - Sistema de Notificações

## Passo a Passo para Ativar as Notificações por Email

### 1️⃣ Instalar Dependências

Execute o comando abaixo no terminal (na raiz do projeto):

```bash
npm install --legacy-peer-deps
```

> **Nota**: A flag `--legacy-peer-deps` é necessária devido a conflitos de versão do React 19 com algumas dependências. Isso é seguro e não afetará o funcionamento do sistema.

### 2️⃣ Verificar Instalação

Confirme que as seguintes dependências foram adicionadas ao `package.json`:

```json
{
  "dependencies": {
    "nodemailer": "^6.9.8"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.14"
  }
}
```

### 3️⃣ Configurar Variáveis de Ambiente (Opcional)

#### Modo Simulado (Padrão)
Por padrão, o sistema funcionará em **modo simulado**. Os emails serão logados no console mas não enviados:

```
📧 [Email] Modo simulado - Email para user@example.com: ✅ Bem-vindo ao Ecclesia!
```

Nenhuma configuração adicional é necessária para desenvolvimento!

#### Modo Real (Produção)
Para enviar emails reais, configure as variáveis SMTP no arquivo `.env`:

```env
# Configurações de Email (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM_NAME=Ecclesia
APP_URL=http://localhost:5173
```

### 4️⃣ Configurar Gmail (Se usar Gmail)

1. Acesse [Google Account](https://myaccount.google.com/)
2. Vá em **Segurança** → **Verificação em duas etapas** (ative se não estiver)
3. Volte em **Segurança** → **Senhas de app**
4. Selecione **Email** ou crie um app personalizado
5. Copie a senha gerada de 16 caracteres
6. Cole em `SMTP_PASS` no seu `.env`

**Exemplo:**
```env
SMTP_USER=seu.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # (remova os espaços)
```

### 5️⃣ Testar o Sistema

1. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Verifique os logs:**
   ```
   ✅ [Email] Serviço de notificações ativado
   ```
   ou
   ```
   ℹ️ [Email] Serviço desabilitado (variáveis SMTP não configuradas)
   ```

3. **Teste criando uma conta:**
   - Acesse http://localhost:5173/register
   - Crie uma nova conta
   - Verifique o console do servidor
   - Você verá: `📧 [Email] Modo simulado...` ou `✅ [Email] Enviado...`

### 6️⃣ Verificar Funcionalidades

#### Notificações Implementadas:

- ✅ **Boas-vindas** - Ao criar nova conta
- ✅ **Aprovação de Ministério** - Quando líder aprova solicitação
- ✅ **Rejeição de Ministério** - Quando líder rejeita solicitação
- ✅ **Nova Escala** - Quando voluntário é escalado
- ✅ **Conta Ativada** - Admin ativa usuário inativo
- ✅ **Conta Desativada** - Admin desativa usuário

#### Como Testar Cada Uma:

**Boas-vindas:**
1. Registre novo usuário em `/register`
2. Verifique console do servidor

**Aprovação de Ministério:**
1. Usuário comum solicita participação em ministério
2. Admin/Líder acessa `/admin/approvals`
3. Aprova a solicitação
4. Usuário recebe email

**Escala:**
1. Líder acessa `/admin/schedules`
2. Cria nova escala
3. Atribui voluntário
4. Voluntário recebe email

**Ativação de Conta:**
1. Admin acessa `/admin/users`
2. Ativa ou desativa um usuário
3. Usuário recebe email

## 📝 Notas Importantes

### Segurança
- ⚠️ **Nunca commite** o arquivo `.env` com credenciais reais
- ✅ O `.env.example` deve conter apenas exemplos
- ✅ Use variáveis de ambiente no servidor de produção (Vercel, Railway, etc.)

### Performance
- 📧 Emails são enviados de forma **assíncrona** (não bloqueante)
- ⚡ Se o envio falhar, a operação principal continua normalmente
- 📊 Todos os envios são logados para auditoria

### Troubleshooting

**Erro: "Cannot find module 'nodemailer'"**
```bash
npm install --legacy-peer-deps
```

**Emails não chegam (Gmail)**
- Verifique se a verificação em 2 etapas está ativa
- Use senha de app, não a senha normal da conta
- Verifique a caixa de spam

**Erro: "Connection timeout"**
- Verifique firewall/antivírus
- Teste outra porta (465 para SSL)
- Confirme que `SMTP_HOST` está correto

**Emails vão para spam**
- Configure SPF/DKIM no domínio (produção)
- Use serviço profissional (SendGrid, Mailgun)
- Evite excesso de exclamações no assunto

## 🎯 Próximos Passos

Após a instalação, explore:

1. 📖 [Documentação Completa](../docs/EMAIL_NOTIFICATIONS.md)
2. 🔧 Customize templates em `server/email.ts`
3. 🚀 Deploy em produção com variáveis de ambiente
4. 📊 Implemente analytics de emails (opcional)

## 📞 Suporte

- 🐛 Encontrou um bug? [Abra uma issue](https://github.com/MunhozIago244/Ecclesia/issues)
- 💬 Dúvidas? Consulte a [documentação](../docs/EMAIL_NOTIFICATIONS.md)
- 📧 Email: munhoziago244@gmail.com

---

**Status**: ✅ Sistema de Notificações Implementado e Pronto para Uso!
