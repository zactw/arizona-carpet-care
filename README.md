# Arizona Carpet Care — Field Management Scheduler

A React + Supabase web app for scheduling carpet cleaning crews. Managers schedule jobs by crew member and print daily schedules for each crew.

## Features

- 📅 **Daily Calendar** — Grid view with time slots (7 AM – 6 PM) × crew members (8 hardcoded)
- 🏢 **Properties** — CRUD for property records with contact info and standing directions
- 🖨 **Print View** — Clean printable daily schedule per crew member
- 🔒 **Dummy Auth** — Any email/password works (MVP bypass)

## Crew Members

Aaron F, Miguel R, Carlos M, Jose L, David T, Marco S, Luis G, Chris P

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase_schema.sql` in your Supabase SQL editor
3. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Without Supabase env vars:** The app still runs — it just shows an empty calendar and uses local state for testing.

### 3. Start the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Login** — Any email + password works
2. **Calendar** — Navigate days with arrows, click a cell to add/edit a job
3. **Properties** — Add property records (name, address, contacts, standing directions)
4. **Print** — Use "Print Today" dropdown in navbar, pick a crew member, print/save PDF

## Tech Stack

- React (Create React App)
- Tailwind CSS
- Supabase (PostgreSQL + JS client)
- React Router v6

## Database Schema

See `supabase_schema.sql` for the full schema including:
- `crew_members` table (for future use — app uses hardcoded list)
- `properties` table
- `jobs` table with date/time/crew/status fields
