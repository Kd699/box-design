# /artboardv2 - Deterministic Viewer/Artboard Changes

Activate when working on any viewer/artboard page. Eliminates rendering drift by auto-auditing the page architecture and enumerating all touchpoints before writing code.

**Always applies /frontend-design** -- all screen components created or modified through this skill must meet production-grade design quality. No generic AI aesthetics.

## When to Activate

- User says "add screen", "add version", "add flow", "build mobile/native variant"
- User says "add to artboard", "add sidebar control", "add display mode"
- Any edit to a file matching the Shell + Sidebar + Preview + Artboard pattern
- Explicitly via `/artboardv2 <request>`

## Phase 1: Auto-Audit (silent, no output)

Before ANY edit, read the target page file and extract its architecture. Store in context.

### What to Extract

```
ARCHITECTURE AUDIT
==================
File: <path>
Lines: <count>

SHELL PATTERN:
  Sidebar: <component name, line range>
  Preview: <component name, line range>
  Artboard: <yes/no, line range>
  Dynamic Island: <component name or none>

SCREEN IDS: <list all from type union>

FLOWS: <list all flow configs, e.g. FLOWS_V10>

FRAME WRAPPERS:
  Web: <component, line range, key props>
  Mobile-web: <component, line range, key props>
  Native: <component or none, line range, key props>

SCREEN RENDERER: <line range of switch/case>

VERSION GUARDS: <list all version === N and version >= N with line numbers>

ARTBOARD LAYOUT:
  Row grouping: <helper function, line>
  Per-screen frames: <which frames shown per screen>
  Modal states: <which screens have artboard modal variants>

SIDEBAR CONTROLS:
  Version selector: <line range>
  Flow/screen radios: <line range>
  Display mode pills: <line range, condition for each pill>
  Config toggles: <list with line numbers>

DYNAMIC ISLAND:
  Severity mapping: <screen -> color, line range>
  Label source: <how label/title determined>
  Device pills: <line range>
```

## Phase 2: Match Request Type

Parse the user's request into one of these types:

| Type | Trigger | Example |
|------|---------|---------|
| ADD_SCREEN | "add screen", "new screen" | "add Low (Blocked) to Flow 2" |
| ADD_VERSION | "add V11", "new version" | "add V11 with updated landing" |
| ADD_PLATFORM | "add native", "mobile version" | "add native for medium result" |
| ADD_FLOW | "add flow", "new journey" | "add Flow 3 for self-referral" |
| ADD_MODAL_STATE | "modal variant", "show modal open" | "add artboard state for critical modal" |
| ADD_SIDEBAR_CONTROL | "add toggle", "add control" | "add intercom toggle to sidebar" |
| MODIFY_SCREEN | "change", "update", "fix" | "update medium to show phone modal" |
| ADD_ARTBOARD_ROW | "add to artboard", "artboard row" | "add Flow 2 results to artboard" |

## Phase 3: Dry-Run Touchpoint Enumeration (MANDATORY - show to user)

**This is the critical phase. NEVER skip this. NEVER start coding before completing this.**

For the matched request type, enumerate EVERY location in the file that needs changing. Use the audit from Phase 1 to find exact line numbers.

### Touchpoint Checklist by Request Type

#### ADD_SCREEN
```
[ ] 1. ScreenId type union -- add new ID
[ ] 2. FLOWS config -- add entry to correct flow
[ ] 3. ScreenRenderer switch -- add case with correct props
[ ] 4. isResult() helper -- add IF this is a result screen
[ ] 5. hasNative condition -- add IF this screen needs native pill
[ ] 6. showMobileWeb condition -- add IF artboard should show mobile-web frame
[ ] 7. Severity dot mapping -- add IF this is a result screen with severity
[ ] 8. Screen component -- create or reuse with correct props
```

#### ADD_PLATFORM
```
[ ] 1. hasNative condition -- add screen ID to native pill condition
[ ] 2. showMobileWeb condition -- add screen ID to artboard mobile-web condition
[ ] 3. Viewer frame branch -- ensure native/mobile-web path handles this screen
[ ] 4. Frame modal pattern -- if screen has modal, wire overlay prop correctly
[ ] 5. Artboard per-screen frames -- add frame column for new platform
[ ] 6. Severity dot mapping -- add screen to FloatingViewerNav severity map
[ ] 7. Cross-reference grep -- grep screen ID string across entire file for missed refs
```

#### ADD_VERSION
```
[ ] 1. Version type union -- add new number
[ ] 2. Version selector UI -- add radio/tab
[ ] 3. getFlows() router -- add version branch (use >= not ===)
[ ] 4. FLOWS_V[N] config -- create new flows array
[ ] 5. Screen version branches -- add >= N branches in each screen component
[ ] 6. Grep ALL version guards -- MANDATORY: run `grep -n 'version ===' <file>` and list ALL results.
         For each guard, determine: should this become >= for the new version?
[ ] 7. Cross-reference grep -- grep screen ID string across entire file for missed refs
```

#### ADD_FLOW
```
[ ] 1. FLOWS config -- add new flow object with screens array
[ ] 2. Sidebar -- flow appears as new fieldset
[ ] 3. Artboard -- new row group with title
[ ] 4. isResult() helper -- check if new screens are result screens
```

#### ADD_MODAL_STATE
```
[ ] 1. ScreenId type union -- add modal variant ID (e.g. 'screen-modal')
[ ] 2. FLOWS config -- add modal screen entry
[ ] 3. ScreenRenderer case -- render base component + defaultModalOpen={true}
[ ] 4. isResult() helper -- add modal variant IF base is result screen
[ ] 5. Artboard -- modal state appears as extra column in results row
[ ] 6. Severity dot mapping -- add modal variant to FloatingViewerNav severity map
[ ] 7. Cross-reference grep -- grep modal variant ID across entire file for missed refs
```

#### MODIFY_SCREEN
```
[ ] 1. Screen component -- the actual change
[ ] 2. Viewer rendering -- verify change works in web frame
[ ] 3. Viewer rendering -- verify change works in mobile-web frame
[ ] 4. Viewer rendering -- verify change works in native frame (if applicable)
[ ] 5. Artboard rendering -- verify change works in artboard mode
[ ] 6. Props -- if prop signature changed, update ScreenRenderer case
```

### Output Format

```
TOUCHPOINT ENUMERATION
======================
Request: "<user's request>"
Type: <REQUEST_TYPE>
Target: <screen/version/flow being changed>

Changes needed (N touchpoints):

  [ ] 1. <what> (L<line>)
         <exact change description>
  [ ] 2. <what> (L<line>)
         <exact change description>
  ...

Frame rules that apply:
  - <rule from vulnerability map>
  - <rule from vulnerability map>

Proceed? (y/n)
```

**WAIT for user approval before Phase 4.**

## Phase 4: Execute

**MANDATORY: Apply /frontend-design principles to ALL code written in this phase.**
When creating or modifying screen components, follow the /frontend-design skill:
- Distinctive, production-grade UI -- no generic AI slop aesthetics
- Typography: characterful font choices (use project's font-perk-sans, not generic)
- Color: cohesive palette from project tokens (primary-1, grey-50, brand-black, etc.)
- Motion: meaningful micro-interactions where appropriate (transitions, hover states)
- Spatial: intentional layout with proper negative space, not cramped defaults
- Match the existing design language of the viewer page being modified

Apply all touchpoints in order. After ALL changes are applied:

1. Run `tsc --noEmit` to verify clean compile
2. If any touchpoint involved frame wrappers or modals, state which frame rules were applied:
   - Modal inside PhoneFrame/NativeFrame: `absolute inset-0` (NOT `fixed`)
   - Modal max-height: `max-h-[85%]` (mobile-web) or `max-h-[600px]` (native)
   - PhoneFrame overlay prop for modals (NOT ScreenRenderer passthrough)
   - V10TabBar sizing: `h-48 text-16` (web/mobile) vs `h-40 text-13` (native custom)

## Phase 5: Verify

Screenshot both viewer AND artboard to confirm rendering:

1. **Viewer**: Navigate to the changed screen, screenshot each display mode that was touched
2. **Artboard**: Screenshot the artboard showing the changed screen's row

Report:
```
VERIFY
======
Touchpoints: N/N applied
tsc: clean

Viewer:
  [OK] Web -- <description>
  [OK] Mobile-web -- <description>
  [OK] Native -- <description>

Artboard:
  [OK] Row N -- <description>

Status: VERIFIED
```

---

## Frame Rules (non-negotiable, from arc corrections)

These rules were learned from past corrections. They are ALWAYS applied. No exceptions.

### Rule 1: Modal Positioning Inside Frames
- PhoneFrame/NativeFrame modals: `absolute inset-0` (NEVER `fixed inset-0`)
- `fixed` escapes the frame and renders at viewport level
- The containing frame must have `relative overflow-hidden` (PhoneFrame has this built-in)

### Rule 2: Modal Max-Height
- Web: no constraint (full viewport)
- Mobile-web: `max-h-[85%]` or `max-h-[700px]`
- Native: `max-h-[600px]` (bottom-sheet style)
- NEVER use `85vh` (viewport-relative, escapes frame)

### Rule 3: PhoneFrame Overlay Prop
- For modals inside phone frames, use PhoneFrame's `overlay` prop
- Do NOT pass modal screen IDs through ScreenRenderer
- Pattern: `<PhoneFrame overlay={isModal ? <ModalJSX> : undefined}>`
- ScreenRenderer receives the BASE screen ID (not the modal variant)

### Rule 4: V10TabBar Sizing
- Web/Mobile-web: `<V10TabBar />` component (h-48, text-16)
- Native: custom `<div>` with hardcoded tabs (h-40, text-13, smaller)
- Native tab bar has `bg-[#f4f4f7]` background, `border-b border-[#c7c7cc]`

### Rule 5: Version Guards
- New versions: ALWAYS use `>=` (inherited), NEVER `===` (exact)
- After ANY `=== N` to `>= N` fix, grep the ENTIRE file for other `=== N` guards
- `getFlows()` router: use `>=` for latest, `===` for specific older versions

### Rule 6: Viewer + Artboard Parity
- Viewer and artboard have INDEPENDENT render paths
- Every visual change must be verified in BOTH modes
- Artboard frames use `pointer-events-none` (non-interactive preview)
- Viewer frames are interactive

### Rule 7: CSS Height Chain
- Before changing ANY height/position CSS, trace the parent chain
- `h-screen` vs `h-full` vs `100vh` behave differently in nested flex layouts
- Test in both viewer AND artboard after height changes

---

## Vulnerability Checklist (run mentally before every edit)

From arc history (40+ sessions, 96 arcs scored):

| Vulnerability | Check | Source |
|---|---|---|
| Missed touchpoints | Did I enumerate ALL locations? | "Artboard parity" arc, 5 corrections |
| Wrong frame pattern | Am I using absolute not fixed? | "Modal Backdrop Fix" arc, 2 corrections |
| Premature execution | Did I show dry-run to user? | "Permission language" arc, 7 corrections |
| CSS height blindness | Did I trace the parent chain? | "h-screen -> h-full -> 100vh" arc |
| Viewer-artboard drift | Did I check BOTH modes? | Multiple arcs |
| Vocabulary mismatch | Am I using user language in UI? | "Permission language" arc, eff=0.33 |

---

## Quick Reference: Page Architecture Patterns

The skill works on ANY page following these patterns:

| Pattern | Pages | Shape |
|---|---|---|
| Shell + Sidebar + Preview + Artboard | EAPTriage, BudgetRole, CelebrationFeedCard | Full viewer system |
| Shell + Sidebar + Preview | Approvals, ComposerLab | Viewer without artboard |
| Shell + StickyBar + Cards | RecipientDisplay, CreateAdvancedBudgets | Design explorer |
| Shell + SideBySide | RecipientFinal | Web + Native parity |

The auto-audit (Phase 1) detects which pattern the page uses and adapts the touchpoint checklists accordingly.
