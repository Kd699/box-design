# /verify - Recursive Loss Function Verification

Recursively verify implementation against expected state until loss = 0.

## Mode Selection

When the user invokes `/verify`, immediately present:

```
/verify -- choose mode:

  1  Quick Verify -- dynamically scoped to what changed in this session
  2  Full Test Suite -- comprehensive verification of all states and flows

Press 1 or 2:
```

Wait for user selection before proceeding.

---

## Step 0 -- Wrong Think Review

**Before starting the verification loop, check `~/.claude/wrong_think/` for relevant patterns.**

1. Extract keywords from the current conversation (feature name, component name, flow name)
2. Glob `~/.claude/wrong_think/*{keyword}*` using multiple keyword variations
3. Read matching files and extract:
   - **ERRORS** -- mistakes made before on similar work. Actively check the current implementation for the same mistakes.
   - **WRONG_ASSUMPTIONS** -- things assumed that turned out wrong. Verify these assumptions are not being repeated.
   - **PATTERNS LEARNED / NEW_IDEAS** -- best practices discovered. Confirm these are being followed.
   - **KEY DECISIONS** -- prior decisions that should still hold. Flag if the current implementation contradicts them.
4. Also glob `~/.claude/compactions/*{keyword}*` for prior session context -- these contain architecture, state trees, and specs that define the expected state.
5. Report what you found: "Checking wrong_think for known pitfalls... Found {N} relevant files: ..." and list the key patterns that apply to this verification.

### Recency Bias Rule

**The current conversation ALWAYS wins over wrong_think files when there is a contradiction.**

Wrong think files are from older sessions. Requirements evolve. If a wrong_think file says "admin defaults to teams list" but the current chat says "admin starts on dashboard", the current chat is the source of truth. When surfacing wrong_think patterns:

- Note the date of the wrong_think file
- If it contradicts something explicitly discussed or decided in the current session, **discard it** and note: "Skipping pattern '{X}' from {date} -- superseded by current session."
- Older wrong_think files are less reliable than newer ones. Bias toward recent entries.
- General process patterns (e.g. "always Read before Edit", "use design system components") are usually still valid regardless of age. Feature-specific decisions and assumptions are the ones that go stale.

If wrong_think files surface issues that are still valid, add them as **additional verification checks** on top of the standard loss function.

---

## Step 1 -- Plan

Before running the verification loop, enter plan mode to define the verification scope:

1. **List what will be verified** -- every state, component, and flow that needs checking
2. **Define expected state for each** -- from specs, compactions, state maps, or conversation context
3. **Include wrong_think checks** -- any patterns from Step 0 that need explicit verification
4. **Update tasks** -- create or update tasks for each verification target so progress is tracked

Present the plan to the user and wait for approval before proceeding.

---

## Mode 1 -- Quick Verify

Quick verify dynamically scopes itself to **only what was touched in this session**:

1. **Infer scope from conversation** -- what components, states, or flows were discussed or changed? Do NOT ask the user -- figure it out from the chat.
2. **Check git diff** if in a repo -- `git diff --name-only` to see changed files. These define the verification surface.
3. **Define expected state per changed area** -- pull from conversation context, compactions, specs.
4. **Run a single screenshot pass** -- one Playwright screenshot per changed state.
5. **Quick loss check** -- compare, report, fix if needed. Max 3 iterations.
6. **Skip full design system audit** -- only check design system on components that were actually modified.
7. **Skip plan mode** -- go straight to verification after wrong_think review.

Quick verify output:

```
/verify [QUICK] Results
=======================
Scope: {N} states from current session
Wrong Think: {N} patterns checked, {N} skipped (stale)

  [OK] {state 1} -- loss 0
  [FIX] {state 2} -- {what was wrong} -> fixed
  [OK] {state 3} -- loss 0

Iterations: 1
Final Loss: 0
Status: VERIFIED
```

---

## Mode 2 -- Full Test Suite

Full test suite runs comprehensive verification across **all states and flows**, not just what changed:

1. **Run Step 1 (Plan)** -- enter plan mode, define full verification scope.
2. **Search specs/PRDs/compactions** for the complete state map of the feature.
3. **Verify every state** -- empty, loading, error, partial data, edge cases, all user types.
4. **Full design system audit** -- check every component against @budget/ui.
5. **Run wrong_think checks** -- all relevant patterns, not just the ones for changed code.
6. **Update tasks** throughout -- create tasks per verification target, mark complete as verified.
7. **Max 5 iterations** per state.

Full test suite output:

```
/verify [FULL] Results
======================
Scope: {N} total states across {N} flows
Wrong Think: {N} patterns checked, {N} superseded by current session
Docs Referenced: {list}

  FLOW: {flow name}
  [OK] {state 1} -- loss 0
  [OK] {state 2} -- loss 0
  [FIX] {state 3} -- {delta} -> fixed (iteration 2)

  FLOW: {flow name}
  [OK] {state 4} -- loss 0
  [FAIL] {state 5} -- {remaining issue after 5 iterations}

  DESIGN SYSTEM
  [OK] All buttons from @budget/ui
  [FIX] Heading on line 42 was raw h2 -> replaced with Heading component
  [OK] Color tokens consistent

  WRONG THINK
  [OK] design_system_first -- confirmed
  [SKIP] admin_defaults_teams -- superseded by current session
  [OK] spec_check -- all states in spec accounted for

Total Iterations: 8
Final Loss: 0
Status: VERIFIED
Tasks Updated: 5 completed, 1 failed
```

---

## When to Use

**IMPORTANT: Always ask user permission before starting the verification loop.**

Ask: "Ready to run recursive verification? I'll take Playwright screenshots and iterate until the implementation matches the expected state (loss = 0). Proceed?"

## The Loss Function Concept

```
Loss = |Expected State - Actual State|

Loss > 0 -> Implementation doesn't match spec -> Fix and retry
Loss = 0 -> Implementation matches spec -> Done
```

## Design System Verification

When verifying components, check for design system compliance:

### Expected Design System Usage
```ts
// Buttons - from @budget/ui
<Button variant="primary" fullWidth>Primary Action</Button>
<Button variant="secondary" fullWidth>Secondary Action</Button>

// Typography - from @budget/ui
<Heading level={5}>Title</Heading>
<Text variant="caption" color="secondary">Caption text</Text>
<Label htmlFor="input">Form label</Label>

// Colors - Tailwind tokens
text-primary-1, text-grey-50, bg-secondary-1, border-grey-12
```

### Design System Loss Examples
| Expected | Actual | Loss | Action |
|----------|--------|------|--------|
| Button from @budget/ui | Custom styled button | 1 | Replace with design system Button |
| Heading component | Raw h1 with inline styles | 1 | Use Heading from @budget/ui |
| Design system colors | Hardcoded hex values | 1 | Use Tailwind color tokens |

## Verification Loop

```
START
  |
  v
[Mode selection: 1 or 2]
  |
  v
[Step 0: Check wrong_think (discard stale, keep valid)]
  |
  +---> Mode 1? --YES--> [Infer scope from chat + git diff]
  |                            |
  |                            v
  |                       [Quick screenshot pass, max 3 iterations]
  |                            |
  |                            v
  |                       [DONE]
  |
  +---> Mode 2? --YES--> [Step 1: Plan full scope]
                              |
                              v
                         [Take Playwright Screenshot]
                              |
                              v
                         [Compare to Expected State]
                              |
                              +---> Loss = 0? --YES--> DONE
                              |         |
                              |        NO
                              |         |
                              v         v
                         [Identify Delta]
                              |
                              v
                         [Check wrong_think patterns]
                              |
                              v
                         [Fix Implementation]
                              |
                              v
                         [Update task status]
                              |
                              v
                         [Loop Back to Screenshot]
```

## Implementation

```javascript
// verify-implementation.mjs
import { chromium } from '@playwright/test'

async function verify(url, expectedStates) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto(url, { waitUntil: 'networkidle' })

  for (const state of expectedStates) {
    // Navigate to state
    await page.click(state.selector)
    await page.waitForTimeout(500)

    // Screenshot
    await page.screenshot({
      path: `verify-${state.name}.png`,
      fullPage: true
    })

    // Log for model analysis
    console.log(`State: ${state.name}`)
    console.log(`Expected: ${state.expected}`)
  }

  await browser.close()
}
```

## Loss Calculation Examples

| Expected | Actual | Loss | Action |
|----------|--------|------|--------|
| Dropdown open | Dropdown closed | 1 | Add initialOpen prop |
| 3 pills visible | 2 pills visible | 1 | Add missing state to SIDEBAR_ITEMS |
| Modal inline | Modal with overlay | 1 | Add showcaseMode prop |
| Button blue | Button grey | 1 | Fix active state styling |
| Design system Button | Custom button | 1 | Import Button from @budget/ui |
| Mobile 390px width | Desktop width | 1 | Add platform check |

## Workflow

### Mode 1 (Quick)
1. **Check wrong_think** -- discard stale, keep valid patterns
2. **Infer scope** from conversation + git diff
3. **Screenshot** changed states only
4. **Quick loss check** -- max 3 iterations
5. **Report**

### Mode 2 (Full)
1. **Check wrong_think** -- discard stale, keep valid patterns
2. **Check compactions** for full architecture and state definitions
3. **Plan verification scope** -- enter plan mode
4. **Update tasks** with verification targets
5. **Ask Permission** to run verification loop
6. **Define Expected State** (state map, wireframe, or description)
7. **Take Screenshot** with Playwright
8. **Analyze Screenshot** -- does it match expected?
9. **Check Design System** -- are components from @budget/ui?
10. **Check wrong_think patterns** -- are known mistakes being repeated?
11. **If Loss > 0**: Identify delta, fix, update task, go to step 7
12. **If Loss = 0**: Mark task complete, report success

## Permission Gate

```
Before running /verify, ALWAYS present mode selection first, then ask:

Mode 1 (Quick):
"Quick verify on {N} changed states. Proceed? (y/n)"

Mode 2 (Full):
"I've reviewed wrong_think and found these relevant patterns:
 - {pattern 1} (valid)
 - {pattern 2} (superseded -- skipping)

Verification plan:
 - {state 1}: {expected}
 - {state 2}: {expected}

I'll run full Playwright verification:
 - Screenshot every state
 - Compare to expected
 - Full design system audit
 - Check against valid wrong_think patterns
 - Fix any deltas
 - Repeat until loss = 0

This may take several iterations. Proceed? (y/n)"
```

## Integration with /cr Workflow

After implementing a task in /cr:

1. Show state map (expected)
2. Ask: "Run /verify to validate?"
3. If yes, present mode selection (1 or 2)
4. Execute chosen verification mode
5. Report iterations needed and final state

## Termination Conditions

- **Success**: Loss = 0 for all states
- **Max Iterations**: Mode 1 = 3, Mode 2 = 5. Stop and report remaining issues.
- **User Abort**: User can type "stop" to halt verification
- **Blocking Error**: Build/runtime error prevents verification

## Quick Reference

```
/verify = mode select + wrong_think check + verify loop

  1  Quick Verify
     - Scope from chat + git diff
     - Changed states only
     - Skip plan mode
     - Max 3 iterations
     - Design system check on modified components only

  2  Full Test Suite
     - Full scope from specs/compactions
     - All states and flows
     - Enter plan mode
     - Track tasks
     - Max 5 iterations
     - Full design system audit

Both modes:
  - wrong_think reviewed first
  - Current chat wins over stale wrong_think
  - General process patterns (Read before Edit) always valid
  - Feature-specific decisions can go stale
```

## Design System Quick Reference

```ts
// Location: packages/ui/src/design-system/
// Import: import { Button, Heading, Text, Label } from '@budget/ui'

// Button variants: primary, secondary, soft, ghost, plain
// Button props: variant, size, fullWidth, icon, loading

// Typography: Heading (level 1-6), Text, Label, Anchor
// Text variants: body, body-small, body-large, caption
// Text colors: primary, secondary, accent, muted, white
```
