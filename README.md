# SyncSlot Scheduler

A modern, timezone-aware scheduling and booking platform that lets professionals share a personal booking link, define availability, and let invitees book meetings without back-and-forth emails.

**Live demo:** https://syncslot-scheduler.lovable.app

![SyncSlot landing page]<img width="929" height="437" alt="image" src="https://github.com/user-attachments/assets/6267ccd9-b2b4-4e80-a7b6-5ed008334211" />


---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Security](#security)
- [License](#license)

---

## Overview

SyncSlot is an all-in-one scheduling app for individuals and teams. Hosts create custom event types (15-min intro, 30-min discovery, 60-min consulting, etc.), set weekly availability with per-day rules and date overrides, and share a public booking page. Invitees pick a slot in their own timezone, answer any custom questions, and receive a confirmation link they can also use to reschedule or cancel.

The app is built on TanStack Start (React 19 + Vite 7) with a Supabase-backed Lovable Cloud backend, Tailwind CSS v4, and a warm ivory / dusty teal design system.

## Features

### Scheduling core
- Personal booking page at `/{username}/{event-slug}` with timezone-aware slot generation
- Multiple event types per user (duration, description, custom questions, buffer)
- Weekly availability rules with per-day time ranges
- Date overrides for holidays, one-off blocks, or expanded hours
- Custom booking questions (short text, multi-choice, yes/no)
- Confirmation page with a secure `reschedule_token` for self-serve reschedule and cancel

### Integrations
- Google Calendar sync via the App User Connector — the host's busy events are merged into slot generation so double-bookings are impossible
- Webhooks and video-conferencing settings surfaced on the Integrations page

### Dashboard
- Home overview with weekly bar chart, upcoming meetings, and quick actions
- Event Types manager with search and unified card layout
- Availability editor with weekly grid + date overrides
- Bookings list with status tabs (upcoming, past, cancelled), search, and CSV export
- Analytics: booking volume, conversion rate, and source tracking
- Team invites via email with pending / accepted state tracking
- Settings tabs for Profile (inline edit), Account, Billing, and Team

### Marketing site
- Landing, Features, Pricing, About, and Contact pages
- Animated hero with a sliding clock and drifting app-relevant icons
- Light-mode marketing surface; light/dark toggle exposed only inside the authenticated app

### Auth
- Email + password sign in / sign up
- Google OAuth (redirects back into the dashboard on success)
- Password reset flow

## Screenshots

[Home] <img width="914" height="473" alt="image" src="https://github.com/user-attachments/assets/d3275e44-ef84-498d-a699-01684775355e" /><img width="866" height="298" alt="image" src="https://github.com/user-attachments/assets/941039db-cd5b-463e-91f6-5b02e93db375" /><img width="866" height="308" alt="image" src="https://github.com/user-attachments/assets/c534fa2b-1b5b-4320-8379-0d448ea3030b" /><img width="860" height="410" alt="image" src="https://github.com/user-attachments/assets/1438e77a-7a6c-4999-9e72-6af4b88293ac" /> 

[Features] <img width="934" height="470" alt="image" src="https://github.com/user-attachments/assets/b7327e1d-2731-4923-b7cd-a5502d02ce8f" /><img width="893" height="464" alt="image" src="https://github.com/user-attachments/assets/0c0c0451-c8c9-4d4f-b600-aaf4f2d7f49a" /><img width="923" height="464" alt="image" src="https://github.com/user-attachments/assets/61c2e30c-ae04-499f-97c2-33c68486a2bc" /> |

[Pricing](screenshots/pricing.png) <img width="911" height="475" alt="image" src="https://github.com/user-attachments/assets/e0ccd83f-950a-4e3b-8c22-c6e8c3207e4b" />

[Auth](screenshots/auth.png) <img width="875" height="464" alt="image" src="https://github.com/user-attachments/assets/21f8c4b4-06ab-41f4-a3c9-34947634da96" />

[About](screenshots/about.png) <img width="915" height="470" alt="image" src="https://github.com/user-attachments/assets/6ceabe4d-fad7-474e-9b6a-6cff9db16a69" />

[Contact](screenshots/contact.png) <img width="899" height="470" alt="image" src="https://github.com/user-attachments/assets/9a76eed5-0ab9-4e0c-9ea7-e4bea12a4981" />


## Tech Stack

- **Framework:** TanStack Start v1 (React 19, TanStack Router)
- **Build tool:** Vite 7
- **Styling:** Tailwind CSS v4 with semantic design tokens
- **UI primitives:** shadcn/ui + Radix
- **Data / state:** TanStack Query
- **Backend:** Supabase (Postgres, Auth, RLS, Storage) via Lovable Cloud
- **Runtime:** Cloudflare Workers (edge) for SSR and server functions
- **Package manager:** Bun

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) 1.1+ (or Node 20+ with npm)

### Install

```bash
git clone <your-repo-url> syncslot
cd syncslot
bun install
```

### Run in development

```bash
bun run dev
```

The app is served at http://localhost:8080.

### Build for production

```bash
bun run build
```

## Environment Variables

The project uses the following environment variables (auto-provisioned when using Lovable Cloud):

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

## Project Structure

```
src/
├── components/          Shared UI components
│   ├── brand/           Logo
│   ├── marketing/       Nav, footer, layout for public pages
│   └── ui/              shadcn primitives
├── integrations/
│   ├── lovable/         App User Connector (Google Calendar)
│   └── supabase/        Generated client + auth middleware
├── lib/                 Server functions, availability engine, utils
├── routes/
│   ├── __root.tsx       Root layout
│   ├── index.tsx        Landing
│   ├── features.tsx     Features
│   ├── pricing.tsx      Pricing
│   ├── auth.tsx         Sign in / sign up
│   ├── $username/       Public booking pages
│   └── _authenticated/  Gated dashboard subtree
├── router.tsx
├── start.ts
├── server.ts
└── styles.css           Tailwind + design tokens + animations
```

## Available Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server on port 8080 |
| `bun run build` | Production build |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |

## Deployment

The app is deployed on Lovable's edge runtime (Cloudflare Workers). Any host that supports TanStack Start on Workers or Node will work; make sure the environment variables above are set in the target environment.

## Security

- Row-Level Security is enabled on every public-schema table
- Public booking pages read through security-definer RPCs so invitee data is never exposed to `anon`
- Reschedule / cancel actions are gated by a per-booking `reschedule_token`
- Sensitive host details use `get_host_busy_times` rather than raw table reads
- No service-role key ships to the client; privileged work runs inside authenticated server functions

## License

MIT — see `LICENSE` for details.
