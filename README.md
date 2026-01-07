# ⛪ Ecclesia | Church Management System

> **Transformando a gestão ministerial em uma experiência fluida, moderna e organizada.**

O **Ecclesia** é uma plataforma robusta projetada para simplificar a vida operacional de igrejas. Com foco em usabilidade e design contemporâneo, o sistema centraliza o gerenciamento de membros, ministérios, escalas de serviço e infraestrutura, permitindo que a liderança dedique menos tempo à burocracia e mais tempo às pessoas.

---

## ✨ Funcionalidades Principais

### 👥 Gestão de Membros & Perfis
* **Controle de Acesso:** Níveis de permissão distintos para Administradores, Líderes e Usuários.
* **Perfis Dinâmicos:** Bio, foto, contatos e preferências visuais.
* **Status de Membresia:** Gestão simplificada de membros ativos e inativos.

### 🎸 Ministérios e Equipes
* **Estrutura Hierárquica:** Organização de grupos com líderes responsáveis delegados.
* **Especialidades / Funções:** Definição de especialidades por ministério (ex: Guitarra, Vocal, Mídia, Recepção).
* **Gestão de Voluntários:** Painel administrativo para adicionar e remover membros e definir suas funções.

### 📅 Escalas e Eventos (WIP)
* **Calendário de Cultos:** Planejamento de cultos recorrentes e eventos especiais.
* **Atribuição de Funções:** Escala de voluntários baseada em suas especialidades cadastradas.
* **Prevenção de Conflitos:** Sistema inteligente para evitar que um membro seja escalado em dois lugares simultaneamente.

### 🏗️ Infraestrutura e Patrimônio
* **Inventário de Equipamentos:** Controle de equipamentos e ativos da igreja.
* **Gestão de Locais:** Cadastro de salas, auditórios e pontos de encontro.

---

## 🚀 Tecnologias

O Ecclesia utiliza o estado da arte do ecossistema JavaScript/TypeScript para garantir performance e escalabilidade:

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Shadcn UI |
| **Animações** | Framer Motion |
| **Estado Remoto** | TanStack Query (React Query) |
| **Backend** | Node.js, Express |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Autenticação** | Passport.js (Baseada em Sessão) |

---

## 🎨 Design System

O sistema segue uma linguagem visual moderna e acolhedora:
* **Interface Orgânica:** Cards e componentes com arredondamento de `2.5rem` para um visual amigável.
* **Temas Adaptativos:** Suporte total a temas claro e escuro, ajustando cores dinamicamente sem valores fixos.
* **Experiência do Usuário:** Feedback visual imediato com Toasts e estados de carregamento via Skeletons.

---

## 🛠️ Como rodar o projeto

### 1. Pré-requisitos
* Node.js (v18+)
* PostgreSQL (Local ou via Docker)

### 2. Instalação
```bash
# Clone o repositório
git clone [https://github.com/MunhozIago244/ecclesia.git](https://github.com/MunhozIago244/ecclesia.git)

# Entre na pasta
cd ecclesia

# Instale as dependências
npm install