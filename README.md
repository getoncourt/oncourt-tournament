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
- **Schedule** – full match order. Drag ⠿ to reorder, filter by group, ▶ to start on a court (only free courts are offered), reopen finished matches.
- **Courts** – set court count, “Fill free courts”, drag a queued match onto a free court or tap “Start #N” on it, ✓ Finish → pick winner (+ optional score).
  With **Auto next** on, finishing a match immediately starts the next eligible match on that court (skips matches whose player is still on another court). Undo in the toast.
- **Standings** – W/L per group.

State lives in `localStorage`; use “Reset demo” / “Start blank” in the menu.

Stack: Vite, React, TypeScript, Tailwind v4, Zustand (persist), dnd-kit, canvas-confetti.
