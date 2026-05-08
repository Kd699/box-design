# V3Artboard v8 — Install (Path C: degit)

This installs the V3Artboard runtime into a host project's `src/`. Files are copied into the consumer's source tree (not a node_modules dep) so the consumer can edit, fork, customize.

## Prerequisites in the host project

- Vite + React 18 + TypeScript
- Tailwind CSS configured
- (Optional) `@mui/icons-material` if you plan to use MUI icons in your modes

## Install (one command)

```bash
# pin to a tag for determinism
npx degit Kd699/box-design/skills/v3artboard-may-09/runtime#v3artboard-may-09-rc2 src/components/v3artboard
```

Latest (no pin, may drift):
```bash
npx degit Kd699/box-design/skills/v3artboard-may-09/runtime src/components/v3artboard
```

After install, files land at:

```
src/components/v3artboard/
  index.ts
  types.ts
  V3Artboard.tsx
  frames.tsx
  example-mode.tsx
  LossTest.tsx
  internal/
    runtime.ts
    component-focus.tsx
    loss-helpers.ts
```

## Tailwind tokens (required for visible UI)

The runtime references these Tailwind classes. If the host project doesn't have them, the UI will render but look unstyled. Add this preset to your `tailwind.config.{js,cjs,ts}`:

```js
// tailwind.preset.cjs
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-black': '#03072d',
        'primary-1':   '#402aff',
        'p1-50':       '#eef0ff',
        'grey-03':     '#f8f8fb',
        'grey-06':     '#eeedf0',
        'grey-12':     '#d7d6da',
        'grey-20':     '#c7c7cc',
        'grey-50':     '#73727c',
      },
      fontFamily: {
        'perk-sans': ['system-ui', 'sans-serif'],  // override with your brand font if you have one
      },
    },
  },
}
```

Then in your `tailwind.config`:
```js
module.exports = {
  presets: [require('./tailwind.preset.cjs')],
  // ... rest of your config
}
```

Or merge into your existing `theme.extend` directly.

## Theme override (for non-Perkbox brands)

The runtime exposes 5 CSS-variable overrides via prop:

```tsx
<V3Artboard
  spec={SPEC}
  theme={{
    surface:    '#fafafa',
    text:       '#111',
    textMuted:  '#666',
    border:     '#e5e5e5',
    accent:     '#3b82f6',
  }}
/>
```

Defaults are Perkbox values. Most of the runtime still uses Tailwind classes from the preset above; the theme prop covers the *highest-leverage* tokens.

## Optional dependency

If your modes use MUI icons (recommended over custom SVGs):

```bash
pnpm add @mui/icons-material @mui/material @emotion/react @emotion/styled
```

If you skip MUI, copy the inline-SVG approach from `example-mode.tsx`.

## Minimum lab page

```tsx
// src/pages/MyLab.tsx
import { V3Artboard, defineV3ArtboardSpec, EXAMPLE_MODE } from '../components/v3artboard'

const SPEC = defineV3ArtboardSpec({
  brand: { title: 'My Lab' },
  modes: [EXAMPLE_MODE],
  sidebar: [{ sectionLabel: 'Demo', items: [
    { id: 'i1', label: 'Idle', options: [
      { modeId: 'example', stateId: 'idle', platform: 'web', platformLabel: 'Desktop' },
    ] },
  ] }],
  artboard: [{ id: 'a1', steps: [{
    badge: 1, title: 'Demo',
    frames: [{ modeId: 'example', stateId: 'idle', platform: 'web' }],
  }] }],
})

export default function MyLab() {
  return <V3Artboard spec={SPEC} />
}
```

Register it in your router. With Vite + React Router:
```tsx
<Route path="/my-lab" element={<MyLab />} />
```

With a switch-based router:
```tsx
if (currentPage === 'myLab') return <MyLab />
```

## Verify the install

In the running dev server:
1. Navigate to your lab route → page mounts.
2. Drop in the built-in self-test:
   ```tsx
   import { V3ArtboardLossTest } from '../components/v3artboard'
   // somewhere in your app:
   <V3ArtboardLossTest spec={SPEC} />
   ```
3. Check `window.__lossResults` in the browser console — should be `≥12/14 pass`.

If T8 (LossTest) shows ≥12 pass, the install is healthy. <12 pass → see "Known limits" below.

## Known limits (cross-project)

These pre-empt the most common breakage when installing into a non-Perkbox project:

| Issue | Symptom | Fix |
|---|---|---|
| Tailwind tokens missing | UI renders unstyled / colorless | Add the preset above to tailwind.config |
| `font-perk-sans` falls back to system | Different font in floating pill | Either provide your own font under that family name or accept the system fallback (functionally identical) |
| `@mui/icons-material` not installed | Modes that use MUI icons crash | `pnpm add @mui/icons-material` or rewrite mode icons as inline SVG |
| Routing pattern mismatch | Lab not reachable | Use the routing pattern your project uses (see "Minimum lab page" above for two examples) |

## Updating

Re-run degit with a newer tag:
```bash
npx degit --force Kd699/box-design/skills/v3artboard-may-09/runtime#v3artboard-may-09 src/components/v3artboard
```

The `--force` overwrites local files. **Save any project-specific edits first** — degit doesn't merge.
