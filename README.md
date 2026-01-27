# Founder Note

AI-powered voice note capture and organization for founders. Record your thoughts, and let AI transcribe, structure, and organize them — so you can focus on building.

## Features

- **Voice Capture** — One-tap recording with real-time waveform visualization
- **AI Transcription** — Automatic speech-to-text via Deepgram
- **Smart Notes** — Raw transcriptions are structured into scannable, organized text by OpenAI
- **AI Extraction** — Titles, summaries, key points, action items, and tags are auto-generated
- **Remy (AI Assistant)** — Context-aware chat assistant that remembers your intents across sessions
- **Brain Dump** — Synthesizes your mental state across notes: open thoughts, decisions, blockers, ideas, and themes
- **Organization** — Folders, colored tags (15 palettes), starring, and full-text search
- **Todos** — Action items auto-extracted from notes with completion tracking
- **Subscriptions** — Integrated payment flow via Lemon Squeezy

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18, Tailwind CSS 3.4, shadcn/ui, Radix UI, Lucide Icons |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| AI | OpenAI GPT-4o (extraction, structuring, chat) |
| Voice | Deepgram (audio transcription) |
| Payments | Lemon Squeezy |

## Project Structure

```
├── app/
│   ├── page.js                  # Main dashboard
│   ├── layout.js                # Root layout
│   ├── globals.css              # Tailwind + custom animations
│   ├── auth/                    # Login, signup, OAuth callback, password reset
│   ├── onboarding/              # 3-step preference wizard
│   ├── subscribe/               # Paywall / checkout
│   └── api/[[...path]]/         # Unified API router
├── components/ui/               # 48 shadcn/ui components
├── hooks/                       # useIsMobile, useToast
├── lib/                         # Supabase client, OpenAI client, utils
├── database/
│   ├── schema.sql               # Core Supabase schema
│   └── migrations/              # Numbered migration files
│       ├── 001_user_profiles.sql
│       ├── 002_subscriptions.sql
│       ├── 003_intents.sql
│       └── 004_brain_dump_cache.sql
├── middleware.js                 # Auth session validation + route protection
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn
- Supabase project
- API keys: OpenAI, Deepgram, Lemon Squeezy

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/milliondollarclub2026-create/Founder-Note.git
   cd Founder-Note
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Create a `.env` file in the root directory with the required environment variables (see `.env.example` or ask the team).

4. Run the database schema and migrations in your Supabase SQL Editor:
   - `database/schema.sql` (run first)
   - `database/migrations/001_user_profiles.sql`
   - `database/migrations/002_subscriptions.sql`
   - `database/migrations/003_intents.sql`
   - `database/migrations/004_brain_dump_cache.sql`

5. Start the development server:
   ```bash
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `DEEPGRAM_API_KEY` | Deepgram transcription API key |
| `LEMON_SQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMON_SQUEEZY_STORE_ID` | Lemon Squeezy store ID |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Webhook signature verification secret |
| `NEXT_PUBLIC_BASE_URL` | App base URL for redirects |
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | MongoDB database name |

## License

Private — All rights reserved.
