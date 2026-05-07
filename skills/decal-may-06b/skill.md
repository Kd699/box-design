# /decal-may-06b -- Live Page → Idiomatic React (FAST variant)

**Same skill as /decal-may-06, three speed patches** (~30-40% faster per cycle):
1. **L5 narrow tsc**: drop workspace-wide `pnpm tsc`. Run `npx tsc --noEmit --skipLibCheck --jsx react-jsx <file>` on just the new file. Falls back to vite curl if tsc errors are import-graph-only.
2. **L4 reference pages**: only `head -200` per page (style cues don't need 1500 lines).
3. **L1+L2+L3 parallelizable**: extract.py spawns assets.py + layout_tree.py concurrently once dump.json lands.

Same idiomatic output, faster round trip.

---

## How to use (quick start)

**1. Page mode (default) — mirror a full live URL into a route:**
```
/decal-may-06b https://app.example.com/some/page
```
Skill walks the live DOM via Arc CDP, downloads assets, re-authors as idiomatic React using the project's design system (`@budget/ui` etc.), registers a route in `App.tsx`, and opens it in Arc. Output lands at `apps/main/src/pages/<Name>.tsx`.

**2. Snippet mode — paste live HTML directly as args:**
```
/decal-may-06b <paste outerHTML of the element here>
```
No CDP scrape. Snippet IS the spec. Skill jumps straight to L4 idiomatic decomposition. Use this when the page is auth-walled, behind a flag, or you already have the exact node copied from devtools.

**3. Component mode — emit a single component, not a page:**
```
DECAL_SCOPE='.some-class' DECAL_OUT_NAME=MyComponent /decal-may-06b https://app.example.com/page
```
Output lands at `apps/main/src/components/decal/MyComponent.tsx` plus a thin preview page wrapper.

**Env vars:**
- `DECAL_SCOPE` — CSS selector to scope extraction (defaults to `document.body`)
- `DECAL_OUT_NAME` — output component name (default `DecalComponent`)
- `DECAL_OUT_PATH` — override output file path
- `DECAL_PROJECT` — target project root (default `~/Budget_Management`)
- `DECAL_WORKDIR` — temp work dir for intermediate artefacts

**What you get back:**
- Idiomatic React file using project primitives (`<Heading>`, `<Text>`, `<Button>`, ...)
- Route registered in `App.tsx` (page mode) or preview page (component mode)
- Verified: tsc clean, route returns 200, opens in Arc
- `report.md` with cycle log + idiomatic-quality score (>= 7 to pass)

**When to pick this over /decal-may-06:** identical output, ~30-40% faster per cycle. Use this by default; fall back to /decal-may-06 only if the parallelized L1-L3 fights a flaky CDP socket.

---

**Pivot vs. /decal v1**: v1 was a tracer — emits absolute-positioned divs with inline Tailwind, ignores the project's design system. The output looked pixel-correct but was unmaintainable React. v2 inverts the priority: **semantic correctness using the project's component vocabulary first; pixel fidelity is a soft check**.

The output should be code a human dev would write — `<Heading level={4}>Recipients</Heading>`, not `<div className="text-[16px] font-bold...">Recipients</div>`. If the project has `<Button variant="primary">`, the live page's primary button becomes that, not a hand-crafted div.

## Activate When
- User says `/decal-may-06 <url>`, "mirror this page using our design system", "produce idiomatic React from `<url>`"
- /decal v1 output is rejected because it's a flat-divs tracer, not React

## Levels (L1 - L5)

| Level | Adds | Notes |
|---|---|---|
| L1 | Extract live DOM via Arc CDP -> `decal-dump.json` (1500-node walk, computed styles, IMG src, SVG inner, ::before/::after) | reuse v1 |
| L2 | Layout tree of card-like containers | reuse v1 |
| L3 | Asset pipeline: download IMG/SVG, decode data: URIs, emit asset map | reuse v1 |
| **L4** | **NEW: Semantic decomposition.** Read project's design-system manifest. Use a sub-`claude -p` call to RE-AUTHOR the dump as idiomatic React using project primitives. NOT a mechanical bbox-to-JSX translator. | REPLACES v1 generate_jsx.py |
| L5 | TypeScript compile check + Vite/Next dev-server route smoke + idiomatic-quality score | gates the output |

## L0 -- Target scope (NEW: page-mode vs. component-mode)

`DECAL_SCOPE` env var (CSS selector) toggles between full-page and single-component mirroring:

- **Page mode** (default, `DECAL_SCOPE` unset): dump.js walks `document.body`. L4 emits a `Page` component with all regions. Output → `apps/main/src/pages/<Mirror>.tsx`.
- **Component mode** (`DECAL_SCOPE='.some-class'`): dump.js walks `document.querySelector(DECAL_SCOPE)` subtree. L4 emits a single named export (no Page, no app shell, no chrome). Output → `apps/main/src/components/decal/<Name>.tsx`.

`DECAL_OUT_NAME` sets the component name (default `DecalComponent`). `DECAL_OUT_PATH` overrides the verify target.

In **component mode**, the L4 prompt changes:
- "Re-author the input as a SINGLE idiomatic React component using the project's design system."
- "No `Page` wrapper, no app shell, no surrounding chrome — just the component."
- "Export as named + default. Take props for any obvious variables (callbacks, item arrays, current selection)."
- "Coverage check: every visible direct child of the scoped element must be in the output."

Patch dump.js to honor `DECAL_SCOPE` (one-line change in extract.py):
```python
SCOPE_JS = os.environ.get('DECAL_SCOPE', '')
if SCOPE_JS:
    # Inject the selector into dump.js, replacing the document.body fallback.
    DUMP_JS = DUMP_JS.replace(
        "const root=document.body;",
        f"const root=document.querySelector({json.dumps(SCOPE_JS)})||document.body;"
    )
```

## L1-L3 (reuse from /decal v1)

L1+L2: same dump.js + layout_tree.py from `~/.claude/skills/decal/skill.md`. Honor cumulative v1 fixes (walks from `document.body`, objectFit/objectPosition, prefer tab already on URL, suppress WS origin).

**L3 inline asset pipeline** (`<workdir>/assets.py`):
```python
#!/usr/bin/env python3
"""Walk decal-dump.json, download IMG src, decode data:image/svg+xml URIs,
emit assets-map.ts. Falls back to live-screenshot crops when CDN returns 403."""
import json, os, re, urllib.request, urllib.parse, sys
WD = os.environ.get('DECAL_WORKDIR', '.')
os.makedirs(f'{WD}/assets', exist_ok=True)
dump = json.load(open(f'{WD}/decal-dump.json'))
mapping = {}
for n in dump['nodes']:
    src = n.get('src')
    if not src: continue
    if src.startswith('data:image/svg+xml'):
        decoded = urllib.parse.unquote(src.split(',', 1)[1]).replace("'", '"')
        slug = f'img_{n["i"]}.svg'
        with open(f'{WD}/assets/{slug}', 'w') as f: f.write(decoded)
        mapping[str(n['i'])] = f'assets/{slug}'
    elif src.startswith('http'):
        ext = src.split('?')[0].rsplit('.', 1)[-1][:4] or 'png'
        slug = f'img_{n["i"]}.{ext}'
        try:
            urllib.request.urlretrieve(src, f'{WD}/assets/{slug}')
            mapping[str(n['i'])] = f'assets/{slug}'
        except Exception as e:
            sys.stderr.write(f'CDN fail {n["i"]}: {e} (consider live-crop fallback)\n')
with open(f'{WD}/assets-map.ts', 'w') as f:
    f.write('export const ASSETS: Record<string, string> = ')
    f.write(json.dumps(mapping, indent=2))
    f.write(';\n')
print(f'wrote assets-map.ts with {len(mapping)} entries')
```

## L4 -- Semantic decomposition (the heart of the pivot)

### Step A: Build DESIGN_SYSTEM.md from the project

`<workdir>/build_ds.py`:
```python
#!/usr/bin/env python3
"""Auto-generate DESIGN_SYSTEM.md by scanning project's ui exports + sampled pages."""
import os, re, glob
WD = os.environ.get('DECAL_WORKDIR', '.')
PROJECT = os.environ.get('DECAL_PROJECT', '/Users/mhlengi.mntungwa/Budget_Management')
# Find the design-system index
ds_idx = next((p for p in [f'{PROJECT}/packages/ui/src/index.ts', f'{PROJECT}/apps/main/src/index.ts'] if os.path.exists(p)), None)
exports = []
if ds_idx:
    txt = open(ds_idx).read()
    for m in re.finditer(r'export\s*\{\s*([^}]+)\s*\}', txt):
        exports += [x.strip() for x in m.group(1).split(',') if x.strip() and not x.startswith('type ')]
# Sample 2-3 existing pages for usage patterns
samples = sorted(glob.glob(f'{PROJECT}/apps/main/src/pages/*.tsx'))[:3]
ds_md = ['## Primitives available', '']
for e in sorted(set(exports))[:30]:
    ds_md.append(f'- `{e}`')
ds_md += ['', '## Sampled usage (from real project files)', '']
for s in samples:
    head = open(s).read()[:1500]
    ds_md += [f'### {os.path.basename(s)}', '```tsx', head, '```', '']
ds_md += [
    '## Anti-patterns (DO NOT use)',
    '- `<div className="text-[16px] font-bold">` -- use `<Heading level={4|5|6}>` instead',
    '- `<div style={{ left:"Xpx", top:"Ypx" }}>` -- use flex/grid container',
    '- inline color hex when a token exists (`#402aff` -> `text-primary-1`)',
]
with open(f'{WD}/DESIGN_SYSTEM.md', 'w') as f: f.write('\n'.join(ds_md))
print(f'wrote DESIGN_SYSTEM.md ({len(exports)} exports, {len(samples)} samples)')
```

Run: `DECAL_WORKDIR=<workdir> python3 <workdir>/build_ds.py`

Read the manifests + a few existing pages and write `<workdir>/DESIGN_SYSTEM.md`:
```markdown
## Primitives available (from @budget/ui or equivalent)

| Component | Props | Variants | Example use |
|---|---|---|---|
| Heading | level: 1-6 | -- | `<Heading level={4}>Recipients</Heading>` |
| Text | variant: body|body-small|caption | color: primary|secondary | `<Text variant="caption">...</Text>` |
| Button | variant: primary|secondary | size: small|medium | disabled | `<Button variant="primary" size="medium">Continue</Button>` |
| Label | uppercase? | -- | `<Label uppercase>Mode</Label>` |
| (others discovered) | ... | ... | ... |

## Tokens

- color: primary-1, brand-black, grey-03, grey-12, grey-50, p1-50, p1-200
- font: PerkSans, PerkSansBold, PerkSansMedium (custom font files)
- radius: rounded-sm | rounded | rounded-lg | rounded-xl
- spacing: 1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px (Tailwind default scale)

## Anti-patterns (do NOT use)

- `<div className="text-[16px] font-bold">` -- use `<Heading level={4|5|6}>` instead
- `<div style={{ left:'Xpx', top:'Ypx' }}>` -- use flex/grid container
- inline color hex when a token exists (e.g. `#402aff` is `primary-1`)
```

### Step B: Read 2-3 existing pages for style

Pick 2-3 files in `apps/main/src/pages/`. Prioritize ones with similar shape (wizards if mirroring a wizard; viewers if mirroring a viewer page). Read them fully. Note:
- File header (imports, type aliases, `// ===` section dividers)
- Component decomposition style: one named function per logical region vs. inline
- Props vs. state vs. config (e.g. v3artboard's `ALL_SCREEN_MODES` pattern)
- Tailwind class ordering, arbitrary-value vs. token usage

### Step C: Re-author via sub-`claude -p`

Write `<workdir>/reauthor-prompt.md`:
```
You are re-authoring a live web page as IDIOMATIC React using a specific
project's design system. Output a single .tsx file.

CONSTRAINTS:
1. Use the project's design-system primitives WHEREVER POSSIBLE.
   Do NOT emit `<div className="text-[16px] font-bold...">` when
   `<Heading level={4}>` would do.
2. Decompose semantically: one named component per logical region
   (recipient picker, template picker, summary panel, step indicator).
   Each component takes props for its variable parts.
3. Match the project's existing file conventions: imports, type aliases,
   `// ===` section dividers, useState patterns, Tailwind class ordering.
4. Pixel fidelity is secondary. If a token-based <Heading level={4}>
   produces 18px and the dump says 16px, prefer the token unless the
   delta is visually jarring.
5. State: surface obvious interactive state (selected template,
   active mode tab, points input value) as useState in the top component.
6. NO absolute positioning unless the original used it for overlays
   (modal, popover, tooltip). Lists, grids, stacks all use flex/grid.
7. NO inline `style={{ left: 'Xpx', top: 'Ypx' }}` ever.

INPUTS PROVIDED:
- decal-dump.json -- live DOM walk + computed styles
- layout_tree.txt -- card hierarchy
- assets-map.ts -- downloaded asset paths
- DESIGN_SYSTEM.md -- list of available primitives + usage patterns + anti-patterns
- REFERENCE_PAGES/ -- 2-3 existing project pages for style reference

OUTPUT:
- index.tsx -- the re-authored React component (single file, default export)
- index.test.txt -- one-paragraph rationale: which primitives you used where,
  what state you surfaced, what you DIDN'T mirror and why
```

**CRITICAL: send the FULL dump, not a truncated slice.** The previous version truncated at 200 nodes; on production wizards that loses the lower half (template pickers, summary panels, footers). Sub-claude can handle 150K+ tokens easily; the dump is typically <250K chars formatted.

Two strategies:

**(A) Single-pass for dumps with <=600 leaf-bearing nodes:**
```bash
{
  cat <workdir>/reauthor-prompt.md
  echo; echo "=== DESIGN_SYSTEM.md ==="; cat <workdir>/DESIGN_SYSTEM.md
  echo; echo "=== layout_tree.txt ==="; cat <workdir>/layout_tree.txt
  echo; echo "=== REFERENCE PAGES (head -150 only -- style cues) ==="
  for f in <workdir>/REFERENCE_PAGES/*.tsx; do echo "--- $f ---"; head -150 "$f"; done
  echo; echo "=== decal-dump.json (full -- DO NOT truncate) ==="
  cat <workdir>/decal-dump.json
} | claude -p "Re-author the input as idiomatic React. Cover EVERY major region visible in layout_tree.txt -- header, picker(s), content body, sidebar(s), footer. Not just the top of the page. Emit ONLY the .tsx file content; no markdown fence, no commentary." > <workdir>/index.tsx
```

**(B) Chunked stitch for dumps >600 leaf-bearing nodes:**
1. Sort layout_tree.txt cards by area descending; group into 2-3 chunks (top / mid / bottom).
2. For each chunk, sub-claude authors components for cards in that chunk only. Output to `<workdir>/section-{1,2,3}.tsx`.
3. Final pass: sub-claude stitches the sections into one `Page.tsx` that imports each section and renders them in DOM order. Uses layout_tree's coordinate hints to decide column vs. stack composition.

After authoring, ALWAYS run a coverage check:
```bash
# Every major region in layout_tree.txt should appear in index.tsx
for region in $(grep -oE '"[A-Z][a-z ]+"' <workdir>/layout_tree.txt | sort -u | tr -d '"'); do
  grep -q "$region" <workdir>/index.tsx || echo "MISSING: $region"
done
```
If anything's missing, re-prompt sub-claude with: "Your output omitted the `<X>` region. Add a `<X>` component using design-system primitives. Keep everything else as-is. Output the full .tsx again."

The sub-claude reads the inputs and emits idiomatic React. **This step replaces the mechanical bbox-to-JSX translator.**

### Step D: Lint pass (`<workdir>/lint.sh`)

```bash
#!/bin/bash
F="${DECAL_WORKDIR:-.}/index.tsx"
abs=$(grep -cE 'absolute (left|top)-\[|style=\{\{ ?(left|top):' "$F")
divs=$(grep -cE '<div className=' "$F")
prims=$(grep -cE '<(Heading|Text|Button|Label|Toggle|Avatar|Modal|Pill|Form|Recipient|Event|IOS)' "$F")
ds_import=$(grep -cE "from '@budget/ui'|from '\\.\\./components/ui/design-system|from '\\.\\./design-system" "$F")
echo "absolute_positioned: $abs (target 0)"
echo "raw_divs: $divs"
echo "primitives: $prims"
echo "design_system_imports: $ds_import"
score=10
[ "$abs" -gt 0 ] && score=$((score - abs * 3))
[ "$ds_import" -lt 1 ] && score=$((score - 4))
[ "$prims" -lt $((divs / 2)) ] && score=$((score - 2))
[ "$score" -lt 1 ] && score=1
echo "score: $score / 10 (target >= 7)"
[ "$score" -lt 7 ] && exit 1 || exit 0
```

Reject and re-prompt if exit 1. Specific feedback:
- abs > 0: "your output used absolute positioning at line(s) X. Rewrite using flex/grid; the live page parent containers' display field shows flex|grid in dump."
- ds_import == 0: "you produced no `from '@budget/ui'` imports -- the project has primitives Heading/Text/Button/Label. Use them instead of styled divs."
- prims < divs/2: "raw divs outnumber primitives 2:1. Replace `<div className='text-[16px] font-bold'>` with `<Heading level={4-6}>`, etc."

Re-prompt with specific feedback:
```
Your output used absolute positioning at line(s) X. The recipient picker
in the live page uses a 2-column grid (see layout_tree.txt: parent display:grid).
Rewrite the recipient picker as `<div className="grid grid-cols-2 gap-3">` with
two semantic <RecipientTile> children. Keep the rest of the file as-is.
```

## L5 -- Verify

Three gates, each binary unless noted:

1. **TypeScript compiles** (gate, narrow): `npx tsc --noEmit --skipLibCheck --jsx react-jsx --moduleResolution bundler --module esnext --target esnext --strict false <file>` on JUST the new file. Skips full-workspace compile -- saves ~15s. If tsc reports unresolved imports (because cross-file checking is off), fall back to L6's `curl localhost:5173/<route>` which verifies imports load via Vite. Vite's import graph IS authoritative for "does this render."

2. **Renders at route** (gate): copy `index.tsx` to `apps/main/src/pages/DecalV2Mirror.tsx`, register a route, hit `localhost:5173/decal-v2-mirror` via CDP. If dev server returns HTML containing the component name string and no console errors, gate passes.

3. **Idiomatic-quality score** (gate >= 7): score 1-10 based on:
   - 1-3: pure tracer (raw divs, absolute positioning, no design-system primitives) — REJECT
   - 4-6: hybrid (some primitives, some divs, semi-decomposed) — re-prompt
   - 7-9: idiomatic (uses primitives throughout, semantic decomposition, state surfaced) — PASS
   - 10: indistinguishable from human-written

   Compute via grep heuristic:
   ```
   primitive_count = grep -cE '<(Heading|Text|Button|Label|Toggle|Avatar|Modal|Pill\w*|Form\w*)' index.tsx
   raw_div_count = grep -cE '<div className=' index.tsx
   absolute_count = grep -cE '(absolute (left|top)-\[|style=\{\{ (left|top):)' index.tsx
   score = (10 if absolute_count == 0 else max(1, 6 - absolute_count)) - max(0, raw_div_count - 2*primitive_count) // 5
   clamp 1..10
   ```

## L6 -- Register + serve + open (NEW: closes the loop end-to-end)

After L5 verify passes, the skill MUST do these three things so the user can see the result without manual wiring. This is the final task in the run.

### Step 1: Wrapper page (component mode only)

If `DECAL_OUT_PATH` points at `apps/main/src/components/...` (component mode), the file is a pure component and needs a preview page. Create `apps/main/src/pages/<Name>Preview.tsx`:

```tsx
import { <ComponentName> } from '../components/decal/<ComponentName>';

export default function <ComponentName>Preview() {
  return (
    <div className="min-h-screen bg-grey-03 flex items-center justify-center p-12">
      <div className="bg-white rounded-lg p-8 w-[600px]">
        <<ComponentName> />  {/* default props if any */}
      </div>
    </div>
  );
}
```

If page mode (`DECAL_OUT_PATH` already in `apps/main/src/pages/`), skip this step — the file IS the page.

### Step 2: Register in App.tsx (3 edits)

```bash
# Locate the App.tsx
APP_TSX=$(find $DECAL_PROJECT/apps -name App.tsx -type f | head -1)

# Slug = kebab-case of <Name>
NAME=$DECAL_OUT_NAME              # e.g. "CsvStepGuide"
SLUG=$(echo "$NAME" | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' | tr '[:upper:]' '[:lower:]')   # csv-step-guide
PAGE_KEY=$(echo "$NAME" | sed 's/^\(.\)/\L\1/')                                              # csvStepGuide

# Edit 1: import line (insert after the last import from './pages/')
# Edit 2: URL path mapping inside the URL parsing useEffect
# Edit 3: render switch case before the rewardWallet / fallback case
```

The skill MUST emit a unified diff (or use Edit tool with exact existing strings) so the three edits are auditable. Reject if `App.tsx` doesn't follow the project's path-based router pattern (search for `setCurrentPage(` to verify).

### Step 3: Verify route + open in Arc

```bash
sleep 2  # let Vite HMR pick up the changes
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/$SLUG
# expect 200; if not, surface defect
open -a Arc "http://localhost:5173/$SLUG"
```

### Task tracking (REQUIRED)

The skill uses Claude Code's task system to make progress visible. Declare a task per level at the START of the run:

```
TaskCreate L0  "Target scope (page or component)"
TaskCreate L1  "Extract live DOM via Arc CDP"
TaskCreate L2  "Build layout tree"
TaskCreate L3  "Download assets + build asset map"
TaskCreate L4  "Semantic decomposition (sub-claude reauthor)"
TaskCreate L5  "Verify (tsc + lint + idiomatic score)"
TaskCreate L6  "Register in App.tsx + serve + open in Arc"
```

Mark each `in_progress` when you begin it, `completed` when done. The user can see live progress without reading the workdir.

If a level fails, the task stays `in_progress` and the next level isn't attempted. Defects are documented; user can decide to re-prompt.

## Success / Termination

LOSS=0 means:
- L1-L3 complete (dump + layout tree + assets)
- L4 emits a .tsx where `primitive_count >= raw_div_count / 2` (i.e. at least one primitive per 2 raw divs)
- L5 gate 1 (tsc) passes (or is skipped with reason)
- L5 gate 2 (renders, no console errors) passes
- L5 gate 3 (idiomatic score) >= 7

Hard cap: 4 cycles per cold-test run. Beyond = document remaining as known-limit, ship as-is.

## Hard Rules (carry-over from v1 + new)
- **Prefer tab already on URL** (skip Page.navigate to avoid re-bouncing on auth-walled pages).
- **No absolute positioning** in the output unless original used it for layered overlays.
- **No inline `style={{ left/top: 'Xpx' }}`** ever.
- **Use design-system tokens before arbitrary values** (`bg-grey-03` before `bg-[#f8f8fb]`).
- **Match neighbour file conventions** (imports, section dividers, type aliases).
- **AE pixel-diff is informational, not a gate.** v2 doesn't optimize for AE.

## Output
- `<workdir>/decal-dump.json`
- `<workdir>/layout_tree.txt`
- `<workdir>/assets/` + `assets-map.ts`
- `<workdir>/DESIGN_SYSTEM.md` (extracted manifest)
- `<workdir>/REFERENCE_PAGES/` (2-3 .tsx for style ref)
- `<workdir>/reauthor-prompt.md`
- `<workdir>/index.tsx` (THE DELIVERABLE -- idiomatic React)
- `<workdir>/index.test.txt` (sub-claude rationale)
- `<workdir>/report.md` (cycle log + scores)
