# oncourt-tournament

Standalone UX prototype (no backend, not wired to oncourt-api). See README.md.

- State: `src/store.ts` (Zustand + localStorage). `matches` array order == schedule order.
- Pure logic with tests: `src/logic/roundRobin.ts`, `src/logic/courts.ts` (`pnpm test`).
- Action sheets (play / finish) are rendered once in `App.tsx`, opened via `src/ui.ts`.
- Screens in `src/screens/`, shared UI in `src/components/`.
- Verify with `pnpm build && pnpm test`.
