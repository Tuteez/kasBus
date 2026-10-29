# kasBus 🏀

A minimal attendance page for one amateur basketball team. It replaces "+" messages in Messenger.
The admin creates a practice or game and posts the link in the group chat. Players open the link,
enter a name once (saved in `localStorage`) and respond with **Dalyvausiu / Galbūt / Nedalyvausiu**.
Everyone sees the live counts, the name lists and the event status.

The UI is in Lithuanian. There is no login, no accounts and no roles, by design.

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (PostgreSQL) · Vercel

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Upcoming events |
| `/event/[id]` | Public event page with attendance |
| `/admin` | Event list with copy link, edit and delete |
| `/admin/new` | Create event |
| `/admin/[id]/edit` | Edit event |

## Setup

1. Create a Supabase project.
2. In **SQL Editor** → **New query**, paste the full contents of [`supabase/schema.sql`](supabase/schema.sql)
   and click **Run**. The script is idempotent, so running it again is safe. To rename the team, update
   the `team` row.
3. Copy `.env.example` to `.env.local` and fill in the **Project URL** and a **secret** key: either
   `sb_secret_…` or the legacy `service_role` key (Project Settings → API Keys). Do not use the
   publishable/anon key.
4. Verify the database with `npm run db:check`. It should print `✓` for `team`, `events` and `attendance`.
5. Run locally:

   ```bash
   npm install
   npm run dev
   ```

## Deploy to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as environment variables.
3. Deploy.

## How it works

- **Data access**: only the Next.js server talks to Supabase, using the service role key. RLS is
  enabled with no policies, so the database cannot be reached directly from the browser.
- **Attendance**: one row per `(event, player name)`, matched case-insensitively. A new response
  overwrites the previous one.
- **Live updates**: the event page refreshes every 10 seconds and whenever the tab becomes visible.
  Your own response appears immediately (optimistic update).
- **"Neatsakė" (no response)**: there is no player roster. It lists people who answered any
  event before but have not answered this one.
- **Status**: `YES >= min` → 🟢 Susirenkam. `YES + MAYBE >= min` → 🟡 Trūksta žaidėjų
  ("Trūksta dar X žaidėjų"). Otherwise → 🔴 Nesusirenkam.
- **Home page cards**: each upcoming event shows its status, the missing-player count,
  ✅/❓/❌/⏳ totals, your own answer (for example "✅ Tu dalyvausi" or "⏳ Neatsakei") and one-tap
  ✅/❓/❌ buttons that update instantly. Names appear only on the event page.
- **Time zone**: all dates are entered and shown in `Europe/Vilnius`.

## Known MVP limitations

- `/admin` is **not protected**. Anyone who knows the URL can create, edit or delete events.
  This follows the "no authentication" MVP requirement.
- Players are identified only by the name they type. Anyone can answer under any name.
- If a player changes their name, their earlier responses stay under the old name.
