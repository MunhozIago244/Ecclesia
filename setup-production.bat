@echo off
REM 🚀 Script de Deploy Rápido - Ecclesia (Windows)
REM Este script prepara o sistema para produção

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Ecclesia - Preparação para Produção
echo ========================================
echo.

REM Verificar Node.js
echo Verificando dependências...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Node.js não encontrado. Instale Node.js 18+ primeiro.
    echo   Download: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% detectado

REM Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ npm não encontrado
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% detectado

REM Verificar PostgreSQL (opcional)
where psql >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('psql --version') do echo ✓ PostgreSQL detectado: %%i
) else (
    echo ⚠ PostgreSQL não detectado localmente (ok se usar serviço cloud)
)

echo.
echo ========================================
echo Instalando dependências...
echo ========================================
echo.

call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ✗ Falha ao instalar dependências
    pause
    exit /b 1
)
echo ✓ Dependências instaladas

echo.
echo ========================================
echo Verificando variáveis de ambiente...
echo ========================================
echo.

if not exist .env (
    echo ⚠ Arquivo .env não encontrado
    echo ℹ Copiando .env.example para .env...
    
    if exist .env.example (
        copy .env.example .env >nul
        echo ✓ .env criado a partir de .env.example
        echo.
        echo ⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações:
        echo.
        echo 1. DATABASE_URL - URL do PostgreSQL
        echo 2. SESSION_SECRET - Chave secreta (mínimo 32 caracteres)
        echo 3. SMTP_* - Configurações de email (opcional)
        echo.
        
        REM Gerar SESSION_SECRET
        echo Gerando SESSION_SECRET...
        for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set SESSION_SECRET=%%i
        echo.
        echo SESSION_SECRET gerado:
        echo !SESSION_SECRET!
        echo.
        echo ℹ Adicione ao seu .env:
        echo SESSION_SECRET=!SESSION_SECRET!
        echo.
        
        echo.
        echo Pressione qualquer tecla após configurar o .env...
        pause >nul
    ) else (
        echo ✗ .env.example não encontrado
        pause
        exit /b 1
    )
) else (
    echo ✓ Arquivo .env encontrado
    
    REM Verificar variáveis críticas
    findstr /C:"DATABASE_URL=" .env >nul
    if %errorlevel% neq 0 (
        echo ⚠ DATABASE_URL não configurada em .env
    ) else (
        echo ✓ DATABASE_URL configurada
    )
    
    findstr /C:"SESSION_SECRET=" .env >nul
    if %errorlevel% neq 0 (
        echo ⚠ SESSION_SECRET não configurada
        echo.
        echo Gerando SESSION_SECRET...
        for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set SESSION_SECRET=%%i
        echo.
        echo Adicione ao seu .env:
        echo SESSION_SECRET=!SESSION_SECRET!
    ) else (
        echo ✓ SESSION_SECRET configurada
    )
)

echo.
echo ========================================
echo Verificando banco de dados...
echo ========================================
echo.

if exist .env (
    echo ℹ Tentando aplicar schema do banco...
    call npm run db:push
    if %errorlevel% equ 0 (
        echo ✓ Schema do banco aplicado com sucesso
    ) else (
        echo ⚠ Não foi possível aplicar schema. Verifique DATABASE_URL
        echo ℹ Execute manualmente: npm run db:push
    )
) else (
    echo ⚠ .env não encontrado. Configure antes de aplicar schema.
)

echo.
echo ========================================
echo ✅ Preparação Completa!
echo ========================================
echo.
echo 📝 Próximos passos:
echo.
echo 1. 🔧 Desenvolvimento Local:
echo    npm run dev
echo.
echo 2. 🚀 Deploy em Produção:
echo.
echo    • Render.com (Recomendado):
echo      https://render.com/deploy
echo.
echo    • Railway.app:
echo      railway login
echo      railway init
echo      railway up
echo.
echo    • VPS Manual:
echo      Veja: DEPLOY_GUIDE.md
echo.
echo 3. 📖 Documentação:
echo    • DEPLOY_GUIDE.md - Guia completo de deploy
echo    • PRODUCTION_CHECKLIST.md - Checklist de produção
echo    • README.md - Visão geral do projeto
echo.
echo 4. ⚙️ Configurações Importantes:
echo    • Edite .env com suas credenciais
echo    • Configure SMTP para emails
echo    • Crie usuário admin inicial
echo.
echo ========================================
echo 🎉 Ecclesia está pronto!
echo ========================================
echo.

pause
