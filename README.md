# Founder Note

AI-powered voice note capture and organization for founders. Record your thoughts, and let AI transcribe, structure, and organize them — so you can focus on building.

## Features

- **Voice Capture** — One-tap recording with real-time waveform visualization
- **AI Transcription** — Automatic speech-to-text via Deepgram Nova-2
- **Smart Notes** — Raw transcriptions are structured into scannable, organized text by OpenAI
- **AI Extraction** — Titles, summaries, key points, action items, and tags are auto-generated
- **Remy (AI Assistant)** — Context-aware chat assistant that captures intents and remembers across sessions
- **Brain Dump** — Synthesizes your mental state across notes: open thoughts, decisions, blockers, ideas, and themes
- **Organization** — Folders, colored tags (15 palettes), starring, and full-text search
- **Next Steps** — Action items and intents auto-extracted from notes with completion tracking
- **Subscriptions** — Integrated payment flow via Lemon Squeezy with usage limits

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React 18, Tailwind CSS 3.4, shadcn/ui, Radix UI, Lucide Icons |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| AI | OpenAI GPT-4o (extraction, structuring, chat), GPT-4o-mini (intent normalization) |
| Voice | Deepgram Nova-2 (audio transcription) |
| Payments | Lemon Squeezy |

## Project Structure

```
app/
  page.js                          # Landing page
  layout.js                        # Root layout
  globals.css                      # Tailwind + custom animations
  auth/
    page.js                        # Login / signup
    callback/route.js              # OAuth callback handler
    confirm/route.js               # Email confirmation handler
    reset-password/page.js         # Password reset flow
  dashboard/page.js                # Main authenticated dashboard
  onboarding/page.js               # 3-step preference wizard
  subscribe/page.js                # Paywall / checkout
  pricing/page.js                  # Pricing page
  privacy/page.js                  # Privacy policy
  terms/page.js                    # Terms of service
  api/
    notes/route.js                 # GET all notes, POST new note
    notes/[id]/route.js            # GET / PUT / DELETE single note
    todos/route.js                 # GET all todos, POST new todo
    todos/[id]/route.js            # PUT / DELETE single todo
    intents/route.js               # GET / POST intents
    intents/[id]/route.js          # GET / PUT / DELETE single intent
    chat/route.js                  # Remy AI assistant
    transcribe/route.js            # Deepgram audio transcription
    extract/route.js               # AI extraction (title, summary, key points)
    smartify/route.js              # Transform raw transcript into structured note
    regenerate-ai/route.js         # Regenerate AI content for a note
    brain-dump/route.js            # Synthesize mental state across notes
    checkout/route.js              # Create Lemon Squeezy checkout session
    webhook/payments/route.js      # Lemon Squeezy payment webhook
    usage/route.js                 # Token and note usage stats
    tags/route.js                  # Fetch all user tags
    auth/check-email/route.js      # Check if email is registered
    user/delete-account/route.js   # Delete user account and all data
    user/clear-all-data/route.js   # Clear all user data (keep account)
    health/route.js                # Health check
components/
  dashboard/                       # Dashboard-specific components
    BrainDumpView.jsx              # Synthesized mental state view
    ChatPanel.jsx                  # Global AI assistant chat
    CompletedView.jsx              # Completed items view
    CreateFolderModal.jsx          # Folder creation modal
    CreateTagModal.jsx             # Tag creation modal
    NavItem.jsx                    # Sidebar navigation item
    NoteCard.jsx                   # Note card (grid + list views)
    NoteDetailView.jsx             # Full note detail view
    SearchResults.jsx              # Search results dropdown
    SettingsModal.jsx              # User settings modal
    TagBadge.jsx                   # Colored tag badge
    ViewModeToggle.jsx             # Notes / Brain Dump toggle
    Waveform.jsx                   # Audio recording waveform
  landing/                         # Landing page components
    LandingPage.jsx
    Navigation.jsx
    Hero.jsx
    FeaturesSection.jsx
    HowItWorksSection.jsx
    StatsSection.jsx
    FAQSection.jsx
    CTASection.jsx
    Footer.jsx
  ui/                              # shadcn/ui base components
lib/
  supabase.js                      # Browser + admin Supabase clients
  supabase-server.js               # Server-side auth helper
  track-tokens.js                  # OpenAI token usage tracking
  tag-colors.js                    # 15 tag color palettes
  utils.js                         # General utilities
database/
  schema.sql                       # Core Supabase schema
  migrations/                      # Numbered migration files (001–011)
middleware.js                      # Auth session refresh + route protection
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
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
   npm install
   ```

3. Create a `.env` file in the root directory with the required environment variables (see below).

4. Run the database schema and migrations in your Supabase SQL Editor:
   - `database/schema.sql` (run first)
   - Then each file in `database/migrations/` in order (001 through 011)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `DEEPGRAM_API_KEY` | Deepgram transcription API key |
| `LEMON_SQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMON_SQUEEZY_STORE_ID` | Lemon Squeezy store ID |
| `LEMON_SQUEEZY_VARIANT_ID` | Lemon Squeezy product variant ID |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Webhook signature verification secret |
| `NEXT_PUBLIC_BASE_URL` | App base URL (e.g. `https://foundernotes.co`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for auth redirects |

## License

Private — All rights reserved.
