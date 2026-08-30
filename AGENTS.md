<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Use pnpm for this repo, not npm or yarn.
- Product language should read as furniture retail and living-at-home, not "clearance" branding or a developer-tool UI.
- Treat `docs/design.md` as the visual source of truth and implement IKEA/Skapa tokens faithfully rather than inventing a palette.
- Give the 3D/floor-plan viewport the most space; do not build a dense properties-panel dashboard around it.
- Drive room labels and dimensions from live planner state, not hardcoded demo copy.

## Learned Workspace Facts

- Lares is an agent-native interior layout and furniture planner built for the WebMCP Challenge; keep the public GitHub README aligned with Devpost requirements.
- Stack is Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 (`@theme` in CSS, no `tailwind.config`), zustand, and Three.js / React Three Fiber for the studio viewport.
- Package manager is pnpm (`packageManager` in `package.json`).
- WebMCP tools and planner state must stay client-side in the page; do not add Next.js API routes for tool logic; the app should work with no backend.
- Domain geometry uses millimetre integers; clearance validation lives in `lib/clearance`, catalog/cost/store/WebMCP under `lib/`.
- `docs/design.md` is the extracted IKEA/Skapa design spec; `README.md` is the product and tool-surface source of truth.
- The hero surface is the studio 3D viewport (`app/_components/studio`); the 2D floor plan is in `app/_components/plan`; UI primitives are in `app/_components/ui`.
- Target clients are ChatGPT's in-app browser and Chrome 149+ with WebMCP testing enabled; rearranging is free, checkout is a gated sensitive action.
