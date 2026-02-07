# Cursor Dashboard

A comprehensive analytics dashboard for tracking team and personal Cursor AI usage, built with Next.js 15 and deployed on Cloudflare.

## Features

### 📊 Analytics & Insights
- **Team Overview**: Real-time statistics of AI usage across your team
- **Detailed Charts**: Visualize AI usage patterns with Recharts
- **Leaderboard**: Track and compare team member activity with sortable tables
- **Date Range Filtering**: Analyze data across different time periods

### 🏆 Achievements System
- **Team Achievements**: Track collective milestones (public access)
- **Personal Achievements**: Individual progress tracking (requires authentication)
- **Real-time Sync**: Hourly automated data synchronization via Cloudflare Cron

### 💬 AI Chat Interface
- **Interactive Chat**: AI-powered assistant with access to your dashboard data
- **Custom Tools**: Query stats, compare users, view leaderboards directly in chat
- **Streaming Responses**: Real-time AI responses using Vercel AI SDK

### 🔐 Authentication
- **Google OAuth**: Secure authentication powered by Better Auth
- **Domain-Restricted**: Access limited to `@shiwaforce.com` email addresses
- **Session Management**: Secure session handling with encrypted cookies

## Tech Stack

### Frontend
- **Framework**: [Next.js 15.5.9](https://nextjs.org) with React 19
- **Styling**: [TailwindCSS v4](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) + Radix UI primitives
- **Animations**: Motion (Framer Motion)
- **Charts**: [Recharts](https://recharts.org)
- **Icons**: [Lucide React](https://lucide.dev)

### Backend & Infrastructure
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com) via [OpenNext.js](https://opennext.js.org/cloudflare)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1) (SQLite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv)
- **Cron Jobs**: Cloudflare Cron Triggers (hourly sync)
- **Authentication**: [Better Auth](https://www.better-auth.com)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai) with OpenAI

### Development
- **Language**: TypeScript
- **Package Manager**: npm
- **Build Tool**: [Turbopack](https://turbo.build/pack) (Next.js dev mode)
- **Linting**: ESLint
- **Database Tools**: Drizzle Kit

## Getting Started

### Prerequisites
- Node.js 18 or later
- npm (comes with Node.js)
- Cloudflare account (for deployment)
- Google OAuth credentials
- Cursor API access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cursor-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.dev.vars` file in the project root:
```bash
GOOGLE_CLIENT_SECRET=your_google_client_secret
BETTER_AUTH_SECRET=your_random_secret_for_dev
BETTER_AUTH_URL=http://localhost:3000
CRON_SECRET=your_random_cron_secret
CURSOR_ADMIN_API_KEY=your_cursor_api_key
```

4. Set up the database:
```bash
# Generate migration files
npm run db:generate

# Apply migrations to Cloudflare D1
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Build for Cloudflare (includes cron patch)
npm run build:cf

# Start production server locally
npm start

# Run ESLint
npm run lint

# Open Drizzle Studio (database GUI)
npm run db:studio

# Generate Drizzle migrations
npm run db:generate

# Apply migrations to remote D1 database
npm run db:migrate

# Generate Cloudflare types
npm run cf-typegen
```

### Database Management

The project uses Drizzle ORM with Cloudflare D1:

- **Schema**: `src/db/schema.ts` and `src/db/auth-schema.ts`
- **Migrations**: `src/db/migrations/`
- **Database Client**: `src/db/index.ts`

To modify the database:
1. Update the schema files
2. Run `npm run db:generate` to create migrations
3. Run `npm run db:migrate` to apply them

## Deployment

### Cloudflare Setup

1. Update `wrangler.jsonc` with your Cloudflare account ID
2. Create required secrets:

```bash
# Google OAuth Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET

# Better Auth Session Secret (generate with: openssl rand -base64 32)
wrangler secret put BETTER_AUTH_SECRET

# Production URL
wrangler secret put BETTER_AUTH_URL

# Cron Secret for scheduled tasks (generate with: openssl rand -base64 32)
wrangler secret put CRON_SECRET

# Cursor API Key for data sync
wrangler secret put CURSOR_ADMIN_API_KEY
```

3. Create D1 database:
```bash
wrangler d1 create cursor-achievements
```

4. Create KV namespace:
```bash
wrangler kv:namespace create "SYNC_KV"
```

5. Update the bindings in `wrangler.jsonc` with the created resource IDs

### Deploy to Cloudflare

```bash
# Preview locally on Cloudflare runtime
npm run preview

# Deploy to production
npm run deploy
```

The `deploy` command builds and deploys your app to Cloudflare Workers.

## Project Structure

```
cursor-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── achievements/       # Achievement tracking pages
│   │   ├── api/               # API routes
│   │   │   ├── achievements/  # Achievement sync endpoints
│   │   │   ├── auth/          # Better Auth API handler
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   └── cron/          # Scheduled sync job
│   │   ├── chat/              # AI chat interface
│   │   ├── leaderboard/       # Team leaderboard
│   │   └── page.tsx           # Dashboard homepage
│   ├── components/            # React components
│   │   ├── achievements/      # Achievement badge components
│   │   ├── chat/              # Chat-specific components
│   │   └── ui/                # shadcn/ui components
│   ├── db/                    # Database layer
│   │   ├── migrations/        # Drizzle migrations
│   │   ├── schema.ts          # Main database schema
│   │   └── auth-schema.ts     # Better Auth schema
│   ├── lib/                   # Utility functions
│   │   ├── achievements.ts    # Achievement definitions
│   │   ├── auth.ts            # Auth utilities
│   │   ├── chat-tools.ts      # AI chat tools
│   │   └── cursor-api.ts      # Cursor API client
│   └── types/                 # TypeScript types
├── public/                    # Static assets
├── wrangler.jsonc            # Cloudflare Worker config
├── drizzle.config.ts         # Drizzle ORM config
└── next.config.ts            # Next.js config
```

## Configuration

### Cloudflare Bindings

The app uses several Cloudflare bindings (configured in `wrangler.jsonc`):

- **D1 Database** (`DB`): SQLite database for achievements and user data
- **KV Namespace** (`SYNC_KV`): Cache for sync metadata
- **Assets Binding** (`ASSETS`): Static asset serving
- **Images Binding** (`IMAGES`): Image optimization
- **Service Binding** (`WORKER_SELF_REFERENCE`): ISR/caching support

### Cron Triggers

The app runs hourly synchronization via Cloudflare Cron:
- **Schedule**: `0 * * * *` (every hour at minute 0)
- **Endpoint**: `/api/cron/sync`
- **Purpose**: Fetches latest data from Cursor API and updates achievements
- **Authentication**: Uses `CRON_SECRET` for secure cron trigger authentication

For detailed cron setup instructions, see [CRON_SETUP.md](./CRON_SETUP.md)

## Authentication

The app uses Better Auth with Google OAuth, restricted to `@shiwaforce.com` domain:

1. Users sign in with their Google account
2. Email domain is validated during account creation
3. Sessions are stored in D1 database
4. Personal achievements require authentication

## Learn More

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenNext.js Cloudflare Guide](https://opennext.js.org/cloudflare)
- [Cloudflare Workers](https://developers.cloudflare.com/workers)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Better Auth](https://www.better-auth.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

### Key Resources
- [Cursor API Documentation](https://cursor.sh)
- [TailwindCSS v4](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

This project is private and intended for internal use at Shiwaforce.
