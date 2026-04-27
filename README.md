# 🐾 SOS Pet

> Plataforma web que conecta pessoas para ajudar a encontrar animais perdidos.

---

## 📐 Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Home    │  │  Busca   │  │  Relato  │  │  Meu Pet   │  │
│  │  (Feed)  │  │ (Search) │  │  Rápido  │  │  (Gestão)  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └─────────────┴─────────────┴───────────────┘         │
│                    Axios + AuthContext                        │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP / REST (JSON)
┌───────────────────────────▼──────────────────────────────────┐
│                    BACKEND (Node.js + Express)                │
│                                                               │
│  ┌─────────┐   ┌────────────┐   ┌──────────────┐            │
│  │  Routes │──▶│Controllers │──▶│   Services   │            │
│  └─────────┘   └────────────┘   └──────┬───────┘            │
│                                         │                     │
│  ┌─────────────────────┐      ┌─────────▼───────┐           │
│  │    Middlewares       │      │     Models       │           │
│  │  • auth (JWT)        │      │  (pg queries)    │           │
│  │  • error handler     │      └─────────┬────────┘          │
│  │  • validator         │                │                    │
│  │  • multer (upload)   │      ┌─────────▼────────┐          │
│  └─────────────────────┘      │   PostgreSQL DB   │          │
│                                │  + earthdistance │          │
└────────────────────────────────┴──────────────────┘          │
```

---

## 🗄️ Modelagem do Banco de Dados

### Tabela `users`
| Coluna          | Tipo        | Descrição                      |
|-----------------|-------------|--------------------------------|
| id              | UUID PK     | Identificador único            |
| name            | VARCHAR     | Nome completo                  |
| email           | VARCHAR UQ  | E-mail (único)                 |
| password_hash   | VARCHAR     | Senha criptografada (bcrypt)   |
| phone           | VARCHAR     | Telefone opcional              |
| avatar_url      | TEXT        | URL do avatar                  |
| is_active       | BOOLEAN     | Conta ativa/inativa            |
| created_at      | TIMESTAMPTZ | Data de criação                |
| updated_at      | TIMESTAMPTZ | Última atualização (trigger)   |

### Tabela `quick_reports` (relatos sem login)
| Coluna           | Tipo        | Descrição                         |
|------------------|-------------|-----------------------------------|
| id               | UUID PK     | Identificador único               |
| location_text    | TEXT        | Descrição textual do local        |
| latitude         | DECIMAL     | Coordenada geográfica             |
| longitude        | DECIMAL     | Coordenada geográfica             |
| city             | VARCHAR     | Cidade                            |
| neighborhood     | VARCHAR     | Bairro                            |
| photo_url        | TEXT        | Caminho da foto (obrigatório)     |
| reporter_name    | VARCHAR     | Nome de quem relatou (opcional)   |
| reporter_phone   | VARCHAR     | Telefone de contato               |
| accepts_contact  | BOOLEAN     | Aceita ser contactado?            |
| contact_methods  | JSONB       | ["WhatsApp", "Ligação", "SMS"]    |
| wants_updates    | BOOLEAN     | Quer receber atualizações?        |
| reporter_email   | VARCHAR     | E-mail para atualizações          |
| animal_type      | VARCHAR     | dog / cat / bird / other          |
| animal_color     | VARCHAR     | Cor(es) do animal                 |
| description      | TEXT        | Descrição adicional               |
| status           | VARCHAR     | active / resolved                 |
| created_at       | TIMESTAMPTZ |                                   |
| updated_at       | TIMESTAMPTZ |                                   |

### Tabela `lost_pets` (anúncios com login)
| Coluna                 | Tipo        | Descrição                     |
|------------------------|-------------|-------------------------------|
| id                     | UUID PK     | Identificador único           |
| user_id                | UUID FK     | Referência ao dono (users.id) |
| name                   | VARCHAR     | Nome do animal                |
| type                   | VARCHAR     | dog / cat / bird / other      |
| breed                  | VARCHAR     | Raça                          |
| color                  | VARCHAR     | Cor(es)                       |
| approximate_age        | VARCHAR     | Idade aproximada              |
| last_seen_location     | TEXT        | Último local visto            |
| last_seen_latitude     | DECIMAL     | Coordenada geográfica         |
| last_seen_longitude    | DECIMAL     | Coordenada geográfica         |
| city                   | VARCHAR     | Cidade                        |
| neighborhood           | VARCHAR     | Bairro                        |
| description            | TEXT        | Detalhes do animal            |
| contact_phone          | VARCHAR     | Telefone de contato           |
| contact_email          | VARCHAR     | E-mail de contato             |
| reward_info            | TEXT        | Info sobre recompensa         |
| status                 | VARCHAR     | lost / found / closed         |
| photos                 | JSONB       | Array de URLs de fotos        |
| created_at             | TIMESTAMPTZ |                               |
| updated_at             | TIMESTAMPTZ |                               |

### Relacionamentos
```
users 1──N lost_pets   (user_id → users.id, CASCADE DELETE)
```

---

## 📁 Estrutura de Arquivos

```
sos-pet/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      ← Pool de conexão PostgreSQL
│   │   │   ├── migrate.js       ← Script de migrations
│   │   │   └── upload.js        ← Configuração do Multer
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── quickReport.controller.js
│   │   │   ├── lostPet.controller.js
│   │   │   └── search.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js    ← JWT authenticate / optionalAuth
│   │   │   └── error.middleware.js   ← validateRequest / errorHandler / notFound
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── quickReport.model.js
│   │   │   └── lostPet.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── reports.routes.js
│   │   │   ├── pets.routes.js
│   │   │   └── search.routes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx
    │   │   │   └── ProtectedRoute.jsx
    │   │   └── ui/
    │   │       ├── index.jsx        ← Button, Input, Badge, Spinner, Card, Empty
    │   │       ├── ui.module.css
    │   │       ├── AnimalCard.jsx
    │   │       └── AnimalCard.module.css
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── QuickReport.jsx    ← 3 steps, sem login
    │   │   ├── LostPetForm.jsx    ← requer login
    │   │   ├── SearchPage.jsx     ← filtros + geolocalização
    │   │   └── MyPets.jsx         ← gestão de anúncios
    │   ├── services/
    │   │   ├── api.js             ← Axios instance + interceptors
    │   │   └── index.js           ← authService, reportService, petService, searchService
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css              ← Design tokens (CSS variables)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🔌 API — Rotas

### Autenticação
| Método | Rota           | Auth | Descrição              |
|--------|----------------|------|------------------------|
| POST   | /auth/register | ❌   | Registro de usuário    |
| POST   | /auth/login    | ❌   | Login + JWT            |
| GET    | /auth/me       | ✅   | Dados do usuário atual |

### Relatos Rápidos
| Método | Rota              | Auth | Descrição               |
|--------|-------------------|------|-------------------------|
| POST   | /reports/quick    | ❌   | Criar relato (multipart)|
| GET    | /reports/quick    | ❌   | Listar relatos          |
| GET    | /reports/quick/:id| ❌   | Detalhe de um relato    |

### Pets Perdidos
| Método | Rota                   | Auth | Descrição                  |
|--------|------------------------|------|----------------------------|
| POST   | /pets/lost             | ✅   | Criar anúncio (multipart)  |
| GET    | /pets/lost             | ❌   | Listar anúncios            |
| GET    | /pets/lost/:id         | ❌   | Detalhe de um anúncio      |
| GET    | /pets/my               | ✅   | Meus anúncios              |
| PATCH  | /pets/lost/:id/status  | ✅   | Atualizar status           |

### Busca
| Método | Rota         | Auth | Descrição                             |
|--------|--------------|------|---------------------------------------|
| GET    | /search      | ❌   | Busca com filtros e raio geo          |
| GET    | /search/feed | ❌   | Feed: últimos relatos + perdidos      |

#### Parâmetros de busca (`GET /search`)
```
?type=dog          → filtra por tipo
&color=preto       → filtra por cor
&breed=labrador    → filtra por raça
&city=São Paulo    → filtra por cidade
&lat=-23.55        → latitude (ativa busca por raio)
&lng=-46.63        → longitude (ativa busca por raio)
&radius=5          → raio em km (padrão: 5)
&page=1            → paginação
&limit=20          → itens por página
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/sos-pet.git
cd sos-pet
```

### 2. Configure o banco de dados
```sql
-- No psql ou pgAdmin:
CREATE DATABASE sos_pet;
CREATE USER qp_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE sos_pet TO qp_user;
```

### 3. Configure o Backend
```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais
npm install
npm run migrate     # Cria as tabelas
npm run dev         # Inicia em modo desenvolvimento
# API disponível em http://localhost:3001
```

### 4. Configure o Frontend
```bash
cd ../frontend
cp .env.example .env
# Edite VITE_API_URL se necessário
npm install
npm run dev         # Inicia em modo desenvolvimento
# Frontend disponível em http://localhost:5173
```

---

## 🔐 Variáveis de Ambiente

### Backend (`.env`)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://qp_user:sua_senha@localhost:5432/sos_pet
JWT_SECRET=seu_jwt_secret_super_seguro_aqui_min_32_chars
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001
```

---

## 🚢 Deploy

### Frontend → Vercel
```bash
cd frontend
npm run build
# Faça upload para a Vercel via CLI ou GitHub integration
# Defina VITE_API_URL=https://sua-api.railway.app
```

### Backend → Railway / Render
1. Crie um serviço Web apontando para `/backend`
2. Configure as variáveis de ambiente
3. O comando de start é `npm start`
4. Para o banco, use o PostgreSQL gerenciado da plataforma

---

## 🤖 Diferenciais e Evolução Futura

### Upload de imagens em produção (AWS S3 / Cloudinary)
```javascript
// Substituir o multer local por:
// npm install @aws-sdk/client-s3 multer-s3
// ou
// npm install cloudinary multer-storage-cloudinary

// No upload.js, trocar o storage diskStorage por:
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'sos-pet', allowed_formats: ['jpg', 'png', 'webp'] },
});
```

### IA para reconhecimento de imagens
```javascript
// Integração futura com AWS Rekognition ou Google Vision API
// Objetivo: identificar raça, cor e tipo de animal automaticamente
// Fluxo sugerido:
// 1. Upload da foto → S3
// 2. Chamar Rekognition.detectLabels()
// 3. Extrair: tipo de animal, cor dominante, raça (se possível)
// 4. Pré-preencher campos do formulário automaticamente
```

### Notificações em tempo real
```javascript
// Socket.io para alertar donos quando um relato bater com o perfil do pet perdido
// Matching automático por: tipo + cor + localização próxima
```

### Matching automático
```sql
-- Query de matching: quando um relato é criado,
-- buscar lost_pets compatíveis na região
SELECT lp.* FROM lost_pets lp
WHERE lp.type = $1
AND lp.status = 'lost'
AND earth_distance(
  ll_to_earth(lp.last_seen_latitude, lp.last_seen_longitude),
  ll_to_earth($2, $3)
) / 1000 <= 10;  -- raio de 10km
```

---

## 📋 Checklist de Funcionalidades

- [x] Autenticação (registro, login, JWT, bcrypt)
- [x] Middleware de autenticação e rota opcional
- [x] Cadastro rápido sem login (relatos)
- [x] Upload de imagem (multer, validação de tipo e tamanho)
- [x] Cadastro completo de pet perdido (autenticado)
- [x] Busca com filtros (tipo, cor, raça, cidade)
- [x] Busca por raio geográfico (earthdistance)
- [x] Feed da página inicial
- [x] Gestão de status do anúncio (perdido → encontrado → encerrado)
- [x] Sistema de contato configurável (WhatsApp / Ligação / SMS)
- [x] Opção de receber atualizações
- [x] Validação de dados no backend (express-validator)
- [x] Tratamento de erros centralizado
- [x] Design system com CSS variables
- [x] Responsivo (mobile-first)
- [x] Rotas protegidas no frontend
- [x] Paginação nas listagens
- [ ] Notificações por e-mail (futuro)
- [ ] Matching automático com IA (futuro)
- [ ] Upload para S3/Cloudinary (futuro)
- [ ] PWA / push notifications (futuro)

---

Feito com 🐾 por engenheiros que amam animais.
