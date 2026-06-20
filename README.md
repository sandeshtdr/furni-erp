# FurniERP — Modular Furniture Manufacturing Production System

A full end-to-end production ERP for a modular furniture manufacturing unit:
**Manufacturing Order → Project ID → Job Cards → BoM → Procurement → Stores Clearance
→ Production Floor (5 stations) → QC → Dispatch.**

Built with **Next.js 14** (App Router) + **Supabase** (Postgres) + **Tailwind CSS**.
Deploys to **Vercel** in one click.

---

## 1. What's inside

| Module | Route | What it does |
|---|---|---|
| Dashboard | `/dashboard` | Live KPIs, alerts, activity feed, floor status |
| Manufacturing Orders | `/mo` | Create MO → auto-generates Project ID |
| Job Cards | `/jc` | One JC per product, auto-prefixed with Project ID, full stage flow visual |
| Bill of Materials | `/bom` | Material list per JC with inward status |
| Procurement | `/procurement` | Raise POs, track ETA, flag at-risk materials |
| Stores | `/stores` | GRN creation, material clearance gate (the hard block before floor release) |
| Floor Tracker | `/floor` | Live 5-station view, station QC checklist, rework logging |
| Quality Control | `/qc` | NCR register, QC sign-off queue |
| Dispatch | `/dispatch` | Delivery challan creation, dispatch history |
| Roles & RACI | `/roles` | Accountability matrix across all 7 roles |
| Documents | `/documents` | Reference list of all 16 document types in the process |

The 5 machine stations (Hot Press → Beam Saw → Edge Bander → CNC Drill → Assembly) and the
escalation levels (Station Owner → Floor Supervisor → Production Manager → QC Head) are
built into the data model and the rework/NCR workflow.

---

## 2. Prerequisites

- [Node.js 18+](https://nodejs.org) installed on your computer
- A free [Supabase](https://supabase.com) account (you said you're setting this up)
- A free [Vercel](https://vercel.com) account
- A free [GitHub](https://github.com) account (Vercel deploys from a Git repo)

---

## 3. Set up the database (Supabase)

1. In your Supabase project, go to the **SQL Editor** (left sidebar).
2. Open `supabase/schema.sql` from this project, copy the **entire contents**, paste into
   the SQL editor, and click **Run**.
   This creates all 13 tables (manufacturing_orders, job_cards, bom_items, purchase_orders,
   goods_receipt_notes, stations, ncr_reports, rework_log, delivery_challans, activity_log,
   etc.) plus the 5 stations and 4 demo vendors.
3. **Optional but recommended for your first look:** open `supabase/seed.sql`, copy the
   contents, paste into a new SQL editor query, and click **Run**. This loads realistic
   demo data (3 MOs, 6 Job Cards at different stages, POs, an NCR, rework history) so the
   app isn't empty when you open it.
4. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

---

## 4. Run it locally first (recommended)

```bash
# unzip the project, then:
cd furni-erp

# install dependencies
npm install

# set up environment variables
cp .env.local.example .env.local
```

Open `.env.local` and paste in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Then:

```bash
npm run dev
```

Open **http://localhost:3000** — you should land on the Dashboard with your Supabase data
flowing in.

---

## 5. Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts (accept defaults). When it asks about environment variables, or once
the project is created, go to your project on **vercel.com → Settings → Environment
Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-public-key-here
```

Then redeploy:

```bash
vercel --prod
```

### Option B — GitHub + Vercel dashboard (no CLI needed)

1. Create a new repo on GitHub, push this project to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — FurniERP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/furni-erp.git
   git push -u origin main
   ```
2. Go to **vercel.com → Add New → Project**, import the GitHub repo.
3. In the **Environment Variables** step, add the same two Supabase variables as above.
4. Click **Deploy**. Done — Vercel gives you a live URL.

---

## 6. Project structure

```
furni-erp/
├── app/
│   ├── api/                  ← backend API routes (talk to Supabase)
│   │   ├── mo/                   Manufacturing Orders
│   │   ├── jc/                   Job Cards (+ /[id]/advance to move stages)
│   │   ├── bom/                  Bill of Materials
│   │   ├── po/                   Purchase Orders
│   │   ├── vendors/
│   │   ├── grn/                  Goods Receipt Notes
│   │   ├── stations/
│   │   ├── qc-checks/            Station QC checklist submissions
│   │   ├── rework/               Rework log
│   │   ├── ncr/                  Non-Conformance Reports
│   │   ├── dispatch/             Delivery Challans
│   │   └── activity/             Dashboard activity feed
│   ├── dashboard/, mo/, jc/, bom/, procurement/, stores/,
│   │   floor/, qc/, dispatch/, roles/, documents/   ← pages (one per module)
│   └── layout.js
├── components/                ← shared UI (AppShell, Card, Badge, Modal, Button, FormFields)
├── lib/
│   ├── supabaseClient.js      ← Supabase connection
│   └── constants.js           ← stage definitions, RACI data, document list, QC checklists
├── supabase/
│   ├── schema.sql             ← run this first
│   └── seed.sql               ← optional demo data
└── .env.local.example
```

---

## 7. How the core business rules are enforced

- **Project ID generation** — happens server-side in `app/api/mo/route.js` when an MO is
  created; every Job Card created afterward is forced to use that Project ID as a prefix
  (`app/api/jc/route.js`).
- **Material clearance gate** — `/stores` shows live % clearance per JC based on BoM inward
  status; this is a visual/process gate matching your factory rule that floor release
  requires 100% clearance. (You can wire a hard `material_clearance` boolean check into the
  `/floor` page's QC-pass handler if you want it to be a literal blocking gate in code.)
- **Stage flow** — `lib/constants.js` defines the fixed `JC_STAGES` order; the "Advance"
  action only ever moves a JC to the *next* stage in that sequence, so a JC can't skip
  steps.
- **Station QC + rework** — `/floor` requires the checklist (from `STATION_QC_CHECKLIST`
  in `lib/constants.js`) to be filled before a pallet can advance; a "Fail" automatically
  opens the rework logging form.
- **Escalation levels** — rework entries carry `L1`–`L4` (Station Owner → Floor Supervisor
  → Production Manager → QC Head), matching the escalation path from your process design.

---

## 8. Extending this

Some natural next steps once you're comfortable with the basics:

- **Authentication** — currently all API routes use the public `anon` key with open RLS
  policies, so anyone with the URL can read/write. Add Supabase Auth + tighten the RLS
  policies in `schema.sql` before giving this to real users outside your team.
- **Role-based permissions** — the role switcher in the topbar is currently cosmetic; wire
  it to Supabase Auth roles to actually restrict what each role can see/do.
- **Real-time updates** — Supabase supports realtime subscriptions; you can replace the
  `fetch()` polling in each page with `supabase.channel(...)` listeners so the floor
  tracker updates live across multiple devices without refreshing.
- **Mobile** — the UI is responsive (built with Tailwind) and works on phones today; if you
  want a true installable mobile app, this is also a good candidate for a PWA manifest.
- **PDF generation** — Delivery Challans and GRNs are natural candidates for a "Download
  PDF" button using a library like `@react-pdf/renderer`.

---

## 9. Troubleshooting

- **Blank dashboard / no data** — check that `.env.local` (locally) or the Vercel
  environment variables (in production) have the correct Supabase URL and anon key, and
  that you ran `schema.sql` (and ideally `seed.sql`) in the Supabase SQL editor.
- **"Supabase env vars are missing" in console** — same as above; the app falls back to
  empty strings so it won't crash, but no data will load until the keys are set.
- **Changes to `.env.local` not taking effect** — restart `npm run dev` after editing env
  files; Next.js only reads them at server start.
