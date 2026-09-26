# oncourt-tournament

Standalone UX prototype (no backend, not wired to oncourt-api). See README.md.

- State: `src/store.ts` (Zustand + localStorage). `matches` array order == schedule order.
- Pure logic with tests: `src/logic/roundRobin.ts`, `src/logic/courts.ts` (`pnpm test`).
- Action sheets (play / finish) are rendered once in `App.tsx`, opened via `src/ui.ts`.
- Screens in `src/screens/`, shared UI in `src/components/`.
- Verify with `pnpm build && pnpm test`.
- Design: OnCourt Design System (claude.ai/design project "OnCourt Design System"). Tokens mirrored in `src/index.css` `@theme`; base classes `.btn-*`, `.card`, `.card-sm`, `.tag`. Rules: Lato, Tabler icons only (no emoji/unicode glyphs besides • and ·), sentence-case copy, 1–3 word buttons.
- Motion (user asked for richer micro-animations; follows Emil Kowalski rules): custom curves `--ease-out`/`--ease-drawer` in `src/index.css`, UI motion ≤300ms, only transform/opacity (+ small blur on state swaps), entry classes `.enter` (stagger via `--i`), `.swap-in`, `.tick` (`<Num>`), press feedback on `.btn`/`.press`, `motion` for sheets/toasts/list layout/sliding pills. Entry animations use `backwards` fill so they don't pin `transform` (breaks press). Respect `prefers-reduced-motion`.
- No decorative gradients, glows, glass tiles or oversized background icons (user feedback: reads as AI slop). Flat fills; color must carry meaning (status, group).
- Color: DS palettes via tokens (`blue`, `indigo`, `yellow`, `globin`, `mojo` + `-soft`); group color tints with `tint()` from `MatchCard.tsx`.
