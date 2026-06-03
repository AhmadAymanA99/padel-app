# Padel Tournament Manager 🎾

A full-featured web application for managing padel tournaments. Supports League→Cup, Cup-only, and Free-for-All (Americano) formats with fair scheduling, public score sharing, and a billboard leaderboard.

## Features

- **3 Tournament Modes**: League→Cup (round-robin + top 4 playoffs), Cup (single elimination), Free-for-All (Americano with rotating partners)
- **Fair Scheduling**: Longest Waiting First (LWF) algorithm minimizes rest time variance
- **Public Score Sharing**: No authentication — share match links for anyone to view/update scores
- **Real-time Scoring**: Classic Advantage deuce, tiebreaks, set/game tracking
- **Standings & Billboard**: League table with tiebreakers, top players/teams rankings
- **Cup Bracket**: Automatic bracket generation with winner propagation
- **Score Edit History**: Full audit log of all score changes
- **Multi-language**: English & Arabic (RTL) support
- **Dark/Light Theme**: System-aware with manual toggle
- **Responsive**: Mobile-friendly layout
- **No Auth Required**: Creator codes stored in browser sessionStorage

## Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **Language**: TypeScript
- **Database**: SQLite via Prisma 6
- **UI**: shadcn/ui v4 (Base UI), Tailwind CSS v4
- **Animations**: Framer Motion
- **Notifications**: Sonner
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone <repo-url>
cd padel-app
npm install
```

### Setup Database

```bash
cp .env.example .env
npx prisma generate
npx prisma db push
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. **Create a Tournament**: Enter a name, pick a mode, add players (multi-field with add/remove)
2. **Generate Schedule**: Click "Generate Schedule & Start" to auto-create matches with fair scheduling
3. **Share Match Links**: Click the copy icon on any match to share the score link
4. **Enter Scores**: Anyone with the match link can enter and save set scores
5. **View Standings**: See the league table with full stats and tiebreakers
6. **Track Billboard**: Top players and teams ranked by wins, win rate, streaks
7. **Start Cup**: When league completes, start the knockout phase (top 4 teams)

## Design System

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for the complete token architecture.

## Project Structure

```
src/
  app/           # Next.js App Router pages
    t/[id]/      # Tournament dashboard, standings, cup, settings
    m/[shareCode]/ # Match score, history
  lib/           # Server actions, scheduling, scoring, i18n, theme
  components/ui/ # shadcn/ui components
prisma/          # Database schema & migrations
```

## License

MIT
