# Planck

A fast, minimal task tracker with kanban boards. Built as a pet project — clean architecture, smooth drag-and-drop, instant updates without confirmation dialogs.

---

## Features

- **Boards, columns, tasks, subtasks** – full hierarchy, all levels independently manageable
- **Drag-and-drop everywhere** – reorder boards, columns, tasks, and subtasks via [@dnd-kit](https://dndkit.com)
- **Inline editing** – double-click any board or column title to rename it in place
- **Task panel** – slide-in editor for task description and subtasks, with autosaving
- **Optimistic updates** – UI reflects changes instantly, requests happen in the background
- **Subtask management** – toggle completion, edit text, reorder via drag-and-drop
- **Smooth animations** – panel transitions and list updates powered by GSAP
- **i18n ready** – internationalization via i18next *(in progress)*

---

## Stack

**Client**
- React 19
- TypeScript
- Vite
- react-query v3
- @dnd-kit
- GSAP
- SASS

**Server**
- Node.js + Express 5
- Prisma + SQLite (better-sqlite3)
- Zod
- TypeScript

---

## Requirements

- Node.js >= 18
- Yarn

---

## Getting Started

**1. Clone the repo**

```bash
git clone https://github.com/relisum/planck.git
cd planck
```

**2. Install dependencies**

```bash
yarn install-deps
```

This installs dependencies for the root, client, and server workspaces.

**3. Set up the database**

```bash
cd server
npx prisma migrate dev
```

Optionally seed with fake data:

```bash
npx prisma db seed
```

**4. Configure environment**

Create `server/.env`:

```env
DATABASE_URL="./dev.db"
PORT=3000
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

**5. Run**

```bash
yarn dev
```

Starts both client (Vite) and server (ts-node-dev) concurrently.

- Client: http://localhost:5173
- Server: http://localhost:3000

---

## Project Structure

```
planck/
├── client/          # React frontend (light FSD architecture)
│   ├── src/
│   │   ├── entities/
│   │   ├── features/
│   │   ├── shared/
│   │   └── widgets/
├── server/          # Express backend
│   ├── prisma/
│   ├── src/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── mocks/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
└── package.json     # Yarn workspaces root
```

---

## Roadmap

- [ ] Authentication
- [ ] Multi-user support
- [ ] i18n (en/ru)
- [ ] Due dates
- [ ] Task labels / priorities

---

## License

MIT