# `src/hooks/` — shared React hooks

Custom hooks used by more than one component (e.g. `useSession`, `useMediaQuery`).

Conventions:

- One hook per file: `useThing.ts` exporting `useThing`.
- Hooks NEVER call `fetch` directly — data hooks go through `@/lib/api`.
- No secrets, no tokens in hook state (sessions live in httpOnly cookies).
- First hooks land in Stage 05 (auth session) — this folder intentionally starts empty.
