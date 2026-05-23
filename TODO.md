# RS Certificate Creator — TODO

> Status: Working — feature-rich, n8n email integration configured, needs production security hardening
> Last updated: 2026-04-22

---

## What's Done

- [x] Drag & drop certificate editor with live preview
- [x] Advanced text customization (fonts, colors, sizing)
- [x] Template management system
- [x] High-quality PNG export (2x resolution)
- [x] Dark/Light mode
- [x] Email queue system with PostgreSQL persistence
- [x] n8n webhook integration (`n8n.kenbuilds.tech/webhook/certificate-email-api`)
- [x] 4 email presets (Event, KPI, Internship, UMak)
- [x] Batch certificate generation with placeholders
- [x] Auto-refresh status monitoring (5-second intervals)
- [x] Comprehensive docs (14 files in `docs/`)

## Remaining

### For Ken (security)

- [x] 🔴 Move default credentials to server-side `.env` — login API reads `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- [x] 🔴 Move PostgreSQL connection string to `.env` — app code reads `DATABASE_URL`
- [x] 🔴 Add server-side session cookie checks to sensitive certificate/email API routes
- [ ] 🟡 Ensure n8n webhook is active and tested on production
- [x] 🟢 Add `.env.example` documenting all required environment variables

### For Mark

- [ ] 🟡 Train team on certificate creation workflow
- [ ] 🟢 Create additional certificate templates as needed (current: 4 presets)

---

## Quick Facts

| | |
|---|---|
| **Stack** | Next.js 16 + TypeScript + Tailwind + shadcn/ui |
| **Database** | PostgreSQL (external) + Drizzle ORM |
| **Port** | 3000 |
| **Package Manager** | pnpm |
| **Email** | n8n webhook → Gmail |
| **Auth** | Session-based (bcrypt + cookies) |
