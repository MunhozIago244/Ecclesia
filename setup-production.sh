#!/bin/bash

# 🚀 Script de Deploy Rápido - Ecclesia
# Este script prepara o sistema para produção

set -e

echo "🚀 Ecclesia - Preparação para Produção"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de sucesso
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Função de erro
error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Função de aviso
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Função de info
info() {
    echo -e "ℹ $1"
}

# Verificar Node.js
echo "Verificando dependências..."
if ! command -v node &> /dev/null; then
    error "Node.js não encontrado. Instale Node.js 18+ primeiro."
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js versão 18+ é necessária. Você tem: $(node -v)"
fi
success "Node.js $(node -v) detectado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    error "npm não encontrado"
fi
success "npm $(npm -v) detectado"

# Verificar PostgreSQL (opcional)
if command -v psql &> /dev/null; then
    success "PostgreSQL $(psql --version | cut -d' ' -f3) detectado"
else
    warning "PostgreSQL não detectado localmente (ok se usar serviço cloud)"
fi

echo ""
echo "======================================"
echo "Instalando dependências..."
echo "======================================"

npm install --legacy-peer-deps || error "Falha ao instalar dependências"
success "Dependências instaladas"

echo ""
echo "======================================"
echo "Verificando variáveis de ambiente..."
echo "======================================"

if [ ! -f .env ]; then
    warning "Arquivo .env não encontrado"
    info "Copiando .env.example para .env..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        success ".env criado a partir de .env.example"
        echo ""
        echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações:"
        echo ""
        echo "1. DATABASE_URL - URL do PostgreSQL"
        echo "2. SESSION_SECRET - Chave secreta (mínimo 32 caracteres)"
        echo "3. SMTP_* - Configurações de email (opcional)"
        echo ""
        
        # Gerar SESSION_SECRET automaticamente
        if command -v openssl &> /dev/null; then
            SESSION_SECRET=$(openssl rand -hex 32)
            echo "SESSION_SECRET gerado automaticamente:"
            echo "$SESSION_SECRET"
            echo ""
            info "Atualizando .env com SESSION_SECRET..."
            
            # Substituir no arquivo .env
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
            else
                sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
            fi
            success "SESSION_SECRET configurado"
        else
            warning "openssl não encontrado. Gere SESSION_SECRET manualmente:"
            echo "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        fi
        
        echo ""
        read -p "Pressione ENTER após configurar o .env..."
    else
        error ".env.example não encontrado"
    fi
else
    success "Arquivo .env encontrado"
    
    # Verificar variáveis críticas
    if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=$" .env; then
        warning "DATABASE_URL não configurada em .env"
    else
        success "DATABASE_URL configurada"
    fi
    
    if ! grep -q "SESSION_SECRET=" .env || grep -q "SESSION_SECRET=$" .env || grep -q "SESSION_SECRET=sua_chave" .env; then
        warning "SESSION_SECRET não configurada corretamente"
        
        if command -v openssl &> /dev/null; then
            SESSION_SECRET=$(openssl rand -hex 32)
            echo ""
            echo "SESSION_SECRET gerado:"
            echo "$SESSION_SECRET"
            echo ""
            info "Adicione ao seu .env:"
            echo "SESSION_SECRET=$SESSION_SECRET"
        fi
    else
        success "SESSION_SECRET configurada"
    fi
fi

echo ""
echo "======================================"
echo "Verificando banco de dados..."
echo "======================================"

# Carregar variáveis do .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
    warning "DATABASE_URL não definida. Configuração do banco será necessária."
else
    info "Tentando conectar ao banco..."
    
    # Tentar aplicar schema
    if npm run db:push; then
        success "Schema do banco aplicado com sucesso"
    else
        warning "Não foi possível aplicar schema. Verifique DATABASE_URL"
        info "Execute manualmente: npm run db:push"
    fi
fi

echo ""
echo "======================================"
echo "Verificando build..."
echo "======================================"

info "Testando build de desenvolvimento..."
if npm run dev -- --host &
then
    DEV_PID=$!
    sleep 5
    
    if kill -0 $DEV_PID 2>/dev/null; then
        success "Servidor de desenvolvimento iniciado"
        kill $DEV_PID
        wait $DEV_PID 2>/dev/null
    else
        error "Falha ao iniciar servidor"
    fi
else
    error "Falha no build de desenvolvimento"
fi

echo ""
echo "======================================"
echo "✅ Preparação Completa!"
echo "======================================"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. 🔧 Desenvolvimento Local:"
echo "   npm run dev"
echo ""
echo "2. 🚀 Deploy em Produção:"
echo ""
echo "   • Render.com (Recomendado):"
echo "     https://render.com/deploy"
echo ""
echo "   • Railway.app:"
echo "     railway login"
echo "     railway init"
echo "     railway up"
echo ""
echo "   • VPS Manual:"
echo "     Veja: DEPLOY_GUIDE.md"
echo ""
echo "3. 📖 Documentação:"
echo "   • DEPLOY_GUIDE.md - Guia completo de deploy"
echo "   • PRODUCTION_CHECKLIST.md - Checklist de produção"
echo "   • README.md - Visão geral do projeto"
echo ""
echo "4. ⚙️ Configurações Importantes:"
echo "   • Edite .env com suas credenciais"
echo "   • Configure SMTP para emails"
echo "   • Crie usuário admin inicial"
echo ""
echo "======================================"
echo "🎉 Ecclesia está pronto!"
echo "======================================"
