# OnCourt Tournament (prototype)

Click-through UX prototype for running a round-robin tennis tournament day:
players → groups → schedule → courts → standings.

```bash
pnpm install
pnpm dev        # http://localhost:5173 (also exposed on LAN for phone testing)
pnpm test       # round-robin + court assignment logic
pnpm build
```

## What you can do

- **Players** – add players (Enter, or paste a list), drag / tap players into groups, auto-split into N groups (snake seeding), generate a round-robin.
- **Schedule** – full match order. Drag ⠿ to reorder, filter by group, **Call** sends a match to a court (only free courts are offered), reopen finished matches.
- **Courts** – match lifecycle: `queued → calling (on court, players being called) → live → done`.
  - Put a match on a court: drag it, tap **Call #N** on a free court, **Call** in the queue, or **⚡ Fill free courts**. The court shows a “calling” timer.
  - **▶ Players ready · Play** starts the match; **✓ Finish** → pick winner (+ optional score).
  - **⋯** on a court: move to another court, “not started yet” (live → calling), or take it off court back to the queue. You can also drag a court’s match onto a free court to move it.
  - Every court action shows a toast with **Undo**.
  - **Auto next**: finishing a match calls the next eligible match to that court (skips matches with a player already on court).
- **Standings** – per group: progress, avg call→start wait, avg match length, table (P/W/L/left), head-to-head grid, and match history (court, times, wait, duration, score) plus upcoming matches.

State lives in `localStorage`; use “Reset demo” / “Start blank” in the menu.

Stack: Vite, React, TypeScript, Tailwind v4, Zustand (persist), dnd-kit, Tabler icons.

Styling follows the **OnCourt Design System** (claude.ai/design): tokens live in `src/index.css` (`@theme`), Lato type, deep-teal primary, lime accent, pill buttons and "lifted ledge" cards, Tabler icons, no emoji.
