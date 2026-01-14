# IPVC Lost & Found (Classroom)

Aplicacao web para anuncios de objetos perdidos/encontrados, com chat em tempo real e notificacoes.

## Requisitos do enunciado (resumo)
- API RESTful (Node.js + Express)
- Base de dados nao relacional (MongoDB)
- Tempo real (Socket.IO)
- Frontend (React)
- Autenticacao (login e registo)
- Deploy (Render/Vercel ou similar)
- README com instalacao, execucao e membros do grupo

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Socket.IO
- Frontend: React + Vite, Axios, Socket.IO Client

## Estrutura
- `backend/` - API, sockets e modelos MongoDB
- `frontend/` - SPA React

## Configuracao

### Backend
1) Copiar `.env.example` para `.env` em `backend/` e ajustar os valores:
```
MONGO_URI=mongodb://localhost:27017/ipvc-lostfound
JWT_SECRET=change_me
PORT=4000
```

2) Instalar dependencias:
```
cd backend
npm install
```

3) (Opcional) Popular dados:
```
node seed.js
```

4) Iniciar API:
```
npm run dev
```
A API fica em `http://localhost:4000`.

### Frontend
1) Instalar dependencias:
```
cd frontend
npm install
```

2) Iniciar frontend:
```
npm run dev
```
A app fica em `http://localhost:5173` (default Vite).

## Funcionalidades
- Registo e login de utilizadores (JWT)
- Criar e listar anuncios (perdido/encontrado)
- Chat em tempo real por anuncio
- Notificacoes em tempo real
- Perfil com anuncios do utilizador

## Endpoints principais (API)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/objects`
- `POST /api/objects` (auth)
- `GET /api/objects/:id`
- `DELETE /api/objects/:id` (auth)
- `GET /api/objects/:id/messages` (auth)
- `GET /api/chats` (auth)
- `GET /api/notifications` (auth)

## Deploy
- Backend (API): https://ipvc-lost-found.onrender.com
- Frontend: https://ipvc-lost-found-qyuz.onrender.com/

## Membros do grupo
- Luis Flores - 31442
- Daniel Alves - 31383

## Uso de IA
Foi usado ChatGPT para ajudar a estruturar o README e rever os requisitos.
Também foi usado para melhoria de front-end e ajuda de resolução de bugs.


## Comandos rapidos
- Backend dev: `npm run dev` (em `backend/`)
- Frontend dev: `npm run dev` (em `frontend/`)
