# /v3artboard-may-08 -- Data-Driven V3 Artboard Scaffolding (HARDENED)

**Fork of /v3artboard-may-07 with 14 enhancements (E1-E14)** targeting robustness, V2 parity, third-surface canon, cross-project theming, authoring ergonomics, and built-in self-test. Use this for NEW labs from 2026-05-08 onward; may-07 stays as the historical baseline.

**Sister skills**:
- `v3artboard-april-14` -- procedural; modify an existing hand-rolled lab.
- `v3artboard-may-07` -- declarative baseline (scaffold from spec).
- `v3artboard-may-08` -- this one: declarative + hardened (replaces may-07 for new work).

## What's new in may-08

```
P1 ROBUSTNESS GATES
  E1  Mount-time spec validation (warn on missing modeId/stateId/platform refs)
  E2  Clamped defaults (invalid platform -> first valid platform of first mode)
  E3  DOM-nesting fixed (outer <button> -> <div role=button>)
  E4  Empty-state guards (mode with 0 states/platforms -> graceful, not crash)

P2 V2 PARITY + DEEP-LINKING
  E5  localStorage persistence keyed by spec.brand.title
  E6  URL hash sync -- #mode/state/platform deep-links
  E7  Imperative ref API -- <V3Artboard ref={r} />, r.current.selectByIds(modeId, stateId, platform)
  E8  Keyboard nav -- ArrowLeft/Right (prev/next), Cmd+1 viewer, Cmd+2 artboard

P3 THREE-SURFACE CANON
  E9  COMPONENT_FOCUS_REGISTRY -- third "Components" tab (atom/molecule/organism isolation,
      auto-derived platforms via derivePlatforms(usedIn))
  E10 Frame chrome enforcement -- runtime auto-wraps bare content in DesktopFrame/PhoneFrame
      based on platform; opt-out via spec.artboard[].steps[].frames[].rawFrame: true

P4 THEMING & CROSS-PROJECT
  E11 CSS-variable theming -- --v3-surface, --v3-text, --v3-accent, --v3-border, --v3-muted.
      Perkbox tokens are the default; override via <V3Artboard theme={{...}}> or CSS.

P5 AUTHORING ERGONOMICS
  E12 defineV3ArtboardSpec helper -- typed factory; identity at runtime, autocomplete + literal
      narrowing at write time. catches modeId/stateId typos via TS.
  E13 Skill brief now enforces the variant_config_pattern when modes share UI shape -- anti-balloon
      guard. If 3+ modes share >=70% of their JSX, the skill MUST refactor into a shared renderer
      with a variant prop, not duplicate.

P6 LOSS=0 SELF-TEST
  E14 <V3Artboard.LossTest spec={...} /> companion -- auto-renders the 14-case suite for any spec.
      Mounts at /v3artboard-loss-test in the project. Result on window.__lossResults.
```

Pick `may-08` when starting a fresh concept lab or when the existing lab can be flattened into a spec. Pick `april-14` when modifying a hand-rolled lab's render code or adding a new mode to one that's already been built.

## When to activate

- User says "new concept lab", "new viewer/artboard", "add a v3 lab for X"
- User says "scaffold v3artboard from this spec"
- Explicitly via `/v3artboard-may-07 <brief>`

## Architecture (read once, then forget)

The scaffold lives at `apps/main/src/components/v3artboard/`. It is **fully self-contained** — no imports reach into any sibling page folder. New labs depend only on this directory.

```
components/v3artboard/
  index.ts          -- barrel export (V3Artboard, frames, types, EXAMPLE_MODE)
  types.ts          -- ScreenMode, V3ArtboardSpec, all interfaces
  frames.tsx        -- PhoneFrame, NativeFrame, DesktopFrame, IOSStatusBar, createPlatformRenderer
  V3Artboard.tsx    -- runtime component (<V3Artboard spec={SPEC} />)
  example-mode.tsx  -- minimum viable ScreenMode authored only from this folder (copy as starting template)
```

A new lab consumes the scaffold like this — single import path, no cross-page reaches:

```tsx
import { V3Artboard, type V3ArtboardSpec } from '../components/v3artboard'
import { MY_MODE_A } from './my-lab/mode-a'
import { MY_MODE_B } from './my-lab/mode-b'

const SPEC: V3ArtboardSpec = { brand: {...}, modes: [MY_MODE_A, MY_MODE_B], sidebar: [...], artboard: [...] }
export default () => <V3Artboard spec={SPEC} />
```

Mode files (`my-lab/mode-*.tsx`) themselves import only from `components/v3artboard/` for frame primitives — never from another page's lab folder.

The runtime component owns:
- Floating dynamic-island nav (Back/Prev/Next/Platform/Viewer⇄Artboard)
- Sidebar (brand header, viewer/artboard toggle, platform toggle, zoom control, sidebar sections, context cards)
- Viewer dispatch -- `activeMode.renderFrame(state, platform)` at scale-to-fit
- Artboard layout -- declarative dispatch of `mode.renderArtboardFrame(...)` per spec
- ctrl-scroll zoom, prev/next flat-index nav, click-frame-to-route

Per-page lab files own:
- The `ScreenMode[]` modules (already self-contained TSX with `id`, `states[]`, `renderFrame`, `renderArtboardFrame`, `floatingNavLabel`, `platforms[]`)
- The `V3ArtboardSpec` literal: brand + sidebar + artboard + context + defaults
- The single line `<V3Artboard spec={SPEC} />`

## V3ArtboardSpec shape

Source of truth: `apps/main/src/components/v3artboard/types.ts`. Summary:

```ts
interface V3ArtboardSpec {
  brand: { title, subtitle?, icon?, conceptColors?: { bg, text }[] }
  modes: ScreenMode[]                       // existing TSX modules
  sidebar: SidebarSection[]                 // sections > items > options{ modeId, stateId, platform, platformLabel }
  artboard: ArtboardSection[]               // sections > steps > frames{ modeId, stateId, platform, label? }
  context?: ContextCard[]                   // tone-tinted info cards: 'info' | 'warn' | 'success' | 'neutral'
  defaults?: { viewMode?, platform?, zoom? }
}

interface ArtboardSection {
  id, divider?: 'thick' | 'dashed' | 'none', flowBadge?: { label, bg? },
  title?, description?, preLabel?, steps: ArtboardStep[]
}

interface ArtboardStep {
  badge?: number | string, badgeColor?: string,
  title?, description?, pill?: { label, bg?, color? }, maxWidth?,
  frames: ArtboardFrameRef[],
  arrowAfter?: boolean | 'vline'            // separator after this step in the row
}

interface ArtboardFrameRef { modeId, stateId, platform, label? }
```

Frame rules (carried from april-14, still apply):
- PhoneFrame 358×780, NativeFrame 358×780 (self-wrapping, do NOT double-frame), DesktopFrame 1440×800
- Modals inside frames: `absolute inset-0`, never `fixed`
- Containing frame must have `relative overflow-hidden`

## Phase 1 -- Inputs to gather

When the user invokes the skill, capture:

1. **Project root** (e.g. `~/Budget_Management`). If unknown, ask once.
2. **Lab name** (PascalCase, e.g. `BudgetCelebrationsLab`). Determines:
   - File path: `apps/main/src/pages/<LabName>.tsx`
   - Route slug: kebab-case (e.g. `/budget-celebrations-lab`)
3. **Mode files** -- list of `apps/main/src/pages/<lab-folder>/mode-*.tsx` files. Each must export a `ScreenMode` constant with `id`, `states[]`, `renderFrame`, `renderArtboardFrame`, `floatingNavLabel`, `platforms[]`. If they don't, the user needs to author them first (out of scope for this skill).
4. **Brand**: title, subtitle, optional icon (ReactNode JSX or path to an SVG asset).
5. **Sidebar groups**: how to group the items (e.g. "Flow 1 — Push", "Flow 2 — In-App"). For each, list items with mode/state IDs and platforms.
6. **Artboard layout**: which sections, which dividers (`thick` for major flows, `dashed` for sub-rows), which steps in each, which frames in each step, which separators.
7. **Context cards** (optional): tone + title + bullet list.
8. **Defaults** (optional): start in 'viewer' or 'artboard' mode; default platform; default zoom.

## Phase 2 -- Audit the mode files (read-only)

For each mode file, grep:
- `id: '<id>'` (the ScreenMode id) -- referenced via `modeId` in the spec
- `states: [...]` -- each `id: '<state-id>'` is referenced via `stateId`
- `platforms: [...]` -- valid platforms

Echo back the audit so the user can confirm before writing the SPEC:
```
MODE AUDIT
==========
push-notifications  states: PUSH_0, PUSH_1, PUSH_2, PUSH_3   platforms: native
in-app-notifications states: INAPP_3A_FLAT, ...               platforms: web, mobile
...
```

If any mode file references a stateId that doesn't exist in its states[], surface the gap immediately. Do NOT silently write a broken spec.

## Phase 2.5 -- Author modes (only if they don't exist yet)

If the project doesn't have ScreenMode-style mode files for the domain, author them now. Copy `components/v3artboard/example-mode.tsx` as a starting template — it shows the minimum shape:
- One file per mode, exporting a single `ScreenMode` constant
- Imports only from `../../components/v3artboard` (frames + types)
- `renderFrame` uses `createPlatformRenderer({ web, mobile, native })` for platform dispatch
- `renderArtboardFrame` may equal `renderFrame` if the static and live representations are identical
- `floatingNavLabel(state)` returns the label shown in the floating nav pill

Anti-patterns:
- DO NOT import frame primitives from a sibling page folder (e.g. `pages/some-lab/shell`). Always import from `components/v3artboard`.
- DO NOT couple modes across labs. Each lab's mode files are independent; reusable cards/primitives belong in `@budget/ui` or `components/v3artboard/cards.tsx` (project-agnostic).

## Phase 3 -- Generate the lab file

Target: `apps/main/src/pages/<LabName>.tsx`. Template (substitute placeholders):

```tsx
import React from 'react'
import { V3Artboard, type V3ArtboardSpec } from '../components/v3artboard'
import { <MODE_A> } from './<lab-folder>/mode-<a>'
import { <MODE_B> } from './<lab-folder>/mode-<b>'
// ... one import per mode

const SPEC: V3ArtboardSpec = {
  brand: { title: '...', subtitle: '...', icon: ... },
  modes: [<MODE_A>, <MODE_B>, ...],
  defaults: { viewMode: 'artboard', platform: 'web', zoom: 0.3 },

  sidebar: [
    { sectionLabel: '...', items: [
      { id: '...', label: '...', description: '...',
        options: [{ modeId: '...', stateId: '...', platform: '...', platformLabel: '...' }] },
    ] },
  ],

  artboard: [
    { id: 'flow-1', steps: [
      { badge: 1, title: '...', frames: [{ modeId: '...', stateId: '...', platform: '...' }], arrowAfter: true },
    ] },
  ],

  context: [
    { tone: 'success', title: '...', items: ['...'] },
  ],
}

export default function <LabName>() {
  return <V3Artboard spec={SPEC} />
}
```

## Phase 4 -- Wire the route into App.tsx

Three edits to `apps/main/src/App.tsx`:
1. Import: `import <LabName> from './pages/<LabName>'`
2. URL handler: `if (path === '/<slug>') { setCurrentPage('<camelLabName>'); return }`
3. Render switch: `if (currentPage === '<camelLabName>') return <<LabName> />`

Match the project's existing path-based router pattern (search `setCurrentPage(` for the canonical site).

## Phase 5 -- Verify

Three gates, each binary:

1. `tsc --noEmit --skipLibCheck` on the new lab file. Must compile clean.
2. `curl http://localhost:5173/<slug>` returns 200.
3. Open in Arc: navigate the sidebar, click Prev/Next, toggle viewer⇄artboard, click each artboard frame, verify all 3 surfaces (viewer / artboard / each platform) render without console errors.

If any gate fails, do NOT mark the task done. Diagnose, fix, re-verify.

## Phase 6 -- Output report

```
V3ARTBOARD LAB SCAFFOLDED
=========================
File:   apps/main/src/pages/<LabName>.tsx (<LOC> LOC)
Route:  http://localhost:5173/<slug>
Modes:  <count> (<list mode IDs>)
States: <total state count>

Sidebar sections: <count>
Artboard sections: <count>

Verify: tsc OK, curl 200, Arc opened.
```

## Edge cases

- **Mode without `renderArtboardFrame`**: the runtime renders an inline error frame "Missing modeId/stateId" — fix the mode file or remove the frame ref from the spec.
- **Mode without a platform that the spec references**: same — error frame; fix or remove.
- **Single-platform mode**: spec is fine; sidebar item shows only that platform's pill, viewer auto-defaults to it.
- **No artboard layout (only viewer)**: pass `artboard: []`. Sidebar still works; the artboard view just shows empty.
- **No context cards**: omit the `context` field entirely.
- **VLine separator instead of arrow**: set `arrowAfter: 'vline'` on the step (renders a thin vertical line, used when the next step is a parallel comparison rather than a sequence step).

## Hard rules

- Do NOT modify `<V3Artboard>` or `types.ts` to accommodate one project's quirk -- if a quirk requires shell changes, surface it as a spec extension proposal first
- Do NOT inline JSX into the lab file -- if the artboard layout needs custom JSX, the right answer is a new mode (renderArtboardFrame) or a new spec field
- Do NOT bypass the V3Artboard runtime -- the whole point is one source of truth for scaffolding
- Match the project's existing import patterns (relative paths, type-only imports)
- Use MUI icons (`@mui/icons-material`) for icon needs; brand icon JSX may be inline SVG only when it's a logo/illustration

## Test by spawning child terminals (optional next step)

After the canonical lab works, regression-test by handing the SPEC + V3Artboard to an unrelated project. Spawn child claude terminals via the mothership pattern:
1. Launcher script `cd <project>; PROMPT=$(cat prompt.md); exec claude --dangerously-skip-permissions "$PROMPT"`
2. Prompt = "Build a V3 artboard lab for <X domain>. The runtime is at apps/main/src/components/v3artboard/V3Artboard.tsx. Reference spec: ManagerNotificationsConceptLabV2.tsx. Produce: spec + caller + route."
3. Verify each child's output renders without re-implementing the shell.

## Output

- `apps/main/src/pages/<LabName>.tsx` -- caller file (~80-200 LOC depending on spec verbosity)
- `apps/main/src/App.tsx` -- 3 edits (import + URL handler + render switch)
- Optional: report.md with LOC + verification log

## Anti-balloon: variant_config_pattern

If 3+ modes share >=70% of their `renderFrame` JSX, refactor into a single shared `<ModeRenderer variant="X" />` component with a variant config record. Do NOT duplicate JSX. Symptom of need: copy-pasting between mode files. Cure: extract config + 1 shared renderer.

```tsx
// ❌ Don't: 3 mode files each with ~200 lines of near-identical JSX
// ✅ Do: 1 shared renderer + variant config

const VARIANT_CONFIG = {
  push:    { tone: 'urgent',   icon: BellIcon,    cta: 'Open' },
  inApp:   { tone: 'standard', icon: InboxIcon,   cta: 'View' },
  digest:  { tone: 'muted',    icon: SummaryIcon, cta: 'Read' },
} as const

const ModeRenderer: React.FC<{ variant: keyof typeof VARIANT_CONFIG }> = ({ variant }) => {
  const c = VARIANT_CONFIG[variant]
  return <NotificationFrame tone={c.tone} icon={c.icon} cta={c.cta} />
}

export const PUSH_MODE: ScreenMode = { id: 'push', /* ... */, renderFrame: () => <ModeRenderer variant="push" /> }
```

If the variant divergence exceeds the config's expressive power (e.g. one mode needs an extra row), add an optional config field rather than forking the renderer. Fork only when 2+ structural fields would need to be optional.
