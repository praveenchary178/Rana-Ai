# RANA AI

RANA AI is a B2B voice-calling platform for building AI employees, running calling campaigns, and following up on leads. This repository contains the Next.js application, its API routes, and the public-facing website.

## What’s inside

- **AI employees and Script Studio:** configure call scripts, voices, knowledge, and conversation settings.
- **Calling workflows:** manage inbound calls, outbound campaigns, phone numbers, and browser-based call testing.
- **Sales and operations:** review calls, leads, follow-ups, analytics, reports, orders, and billing.
- **Integrations:** connect supported voice, AI, payment, messaging, and other services as needed.
- **Administration:** manage accounts, workspace settings, and HQ operations.

The application uses Next.js 14 with the App Router, React 18, TypeScript, and Tailwind CSS. Server-side code talks to Supabase through its REST API and integrates with external providers for individual features.

## Getting started

### Prerequisites

- Node.js 22 and npm
- A Supabase project with the database tables expected by the application
- Credentials for any voice, AI, payment, or other services you want to use

The repository does not currently contain database migrations or a schema. A configured database is needed for authenticated workspace features; the source code in `lib/` and `app/api/` shows the tables and fields those features use.

### Run locally

```bash
git clone https://github.com/praveenchary178/Rana-Ai.git
cd Rana-Ai
npm ci
```

Create a `.env.local` file in the project root and add the configuration needed for your environment. At a minimum, database-backed authentication and workspace features use:

```dotenv
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SESSION_SECRET=your_long_random_session_secret
```

Use a dedicated, strong `SESSION_SECRET`; it is used for session signing and encryption of stored integration secrets. Keep the Supabase service key and all other credentials server-side. `.env.local` is ignored by Git.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Logged-out visitors see the public landing page; workspace pages require a valid account and a configured database. Features backed by external services require their respective credentials and configuration.

## Configuration

Set only the integrations your deployment uses. The following are common starting points; consult the corresponding files in `lib/` and `app/api/` for additional settings and provider-specific requirements.

| Purpose | Environment variables |
| --- | --- |
| Database and sessions | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET` |
| Application URLs | `APP_URL`, `NEXT_PUBLIC_APP_URL` |
| Voice and calling | `SARVAM_API_KEY`, `RANA_SARVAM_AGENTS_API_KEY`, `CARTESIA_API_KEY`, `ELEVENLABS_API_KEY`, `VOBIZ_AUTH_ID`, `VOBIZ_AUTH_TOKEN` |
| AI-assisted editing and analysis | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `SARVAM_CHAT_API_KEY` |
| Payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Email | `RESEND_API_KEY`, `RANA_MAIL_FROM` |
| Google sign-in and calendar | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| Scheduled jobs | `CRON_SECRET` |

The shared AI helper selects Anthropic first, then OpenAI, then Sarvam when their keys are available. Provider credentials alone may not be sufficient: some workflows also need configured accounts, phone numbers, webhook endpoints, or database records.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server after a build |
| `npm run lint` | Run the configured Next.js lint command |

`next.config.js` currently configures production builds to ignore TypeScript and ESLint errors, so a successful build does not guarantee those checks pass.

## Project structure

```text
app/          Pages, layouts, API routes, webhooks, and scheduled endpoints
components/   Reusable UI and feature components
lib/          Business logic, database helpers, and provider integrations
public/       Static assets
docs/         Supporting product documentation
middleware.ts Session checks and routing for public and protected paths
vercel.json   Vercel region and scheduled job configuration
```

## Deployment

The repository includes Vercel configuration for the `bom1` region and scheduled call-sync, billing, and CRM digest endpoints. Configure the required environment variables and provider webhooks in the deployment environment. The scheduled endpoints require `CRON_SECRET`; see `vercel.json` and `app/api/cron/` for their schedules and implementation.
