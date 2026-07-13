# Kyanban

A React kanban board web app for tracking daily activities through tickets/cards.

## Features

- **Dashboard** — analytics overview (status, priority, completion rate)
- **Backlog** — create, search, filter, edit, and delete tickets
- **Kanban board** — view tickets across To-Do, In Progress, Blocked, and Done columns
- **Role-based access** — Admin, Instructor, and Member privileges
- **Supabase-ready** — local storage demo mode until credentials are configured

## Tech stack

- React 19 + TypeScript + Vite
- TanStack React Query
- Supabase (optional backend)

## Project structure

```
src/
├── pages/          # Dashboard, Backlog, Kanban views
├── components/     # Reusable UI (Footer, modals, cards)
├── services/       # Facade layer (tickets, auth)
├── storage/        # Local + Supabase implementations
├── hooks/          # useTickets, useAuth, usePermissions
├── types/          # Ticket and auth types
└── lib/            # Supabase client, query client
```

## Getting started

```bash
npm install
npm run dev
```

## Demo accounts (local mode)

| Username    | Password       | Role       |
|-------------|----------------|------------|
| admin       | admin123       | Admin      |
| instructor  | instructor123  | Instructor |
| member      | member123      | Member     |

## Role privileges

| Action              | Admin | Instructor | Member |
|---------------------|-------|------------|--------|
| Manage accounts     | Yes   | No         | No     |
| Add / edit tickets  | Yes   | Yes        | Yes    |
| Delete tickets      | Yes   | Yes        | No     |
| Move tickets        | Yes   | Yes        | Yes    |
| Move to Done        | Yes   | Yes        | No     |

## Supabase setup

1. Copy `.env.example` to `.env.local` and add your project URL and publishable key.
2. Configure your Supabase project (database schema, auth, and RLS policies) for this app.
3. Restart the dev server — the app uses Supabase when credentials are configured, otherwise local storage demo mode.
