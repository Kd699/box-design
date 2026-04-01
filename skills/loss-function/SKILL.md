---
name: loss-function
description: Figma-to-Code pipeline with 5-phase loss function evaluation (setup, semantics, components, wireframe, high-fidelity)
---

# /loss-function -- Figma-to-Code Pipeline

Activate when user types: /loss-function

## What This Does

Runs a 5-phase Figma-to-Code pipeline with self-evaluating loss function at each phase. Each phase produces outputs, self-critiques using 6 categories (1-10 scale), and only proceeds when Total Loss <= 2.

---

# Figma-to-Cursor Pipeline Overview

Fractal refinement pipeline: 5 phases (0-4), each self-contained Markdown file.

Core mechanism: Loss Function (defined in `template.md`).

## Pipeline Structure

```
1. Figma-to-Cursor Pipeline
   |-- 2. Loss Function
   |     (template.md)
   |-- 3. Phase 0: Setup
   |     (collect project info, URLs, screens)
   |-- 4. Phase 1: Semantic Understanding
   |     (3 representations, screen semantics)
   |-- 5. Phase 2: Component Definition
   |     (components, props, skeletons)
   |-- 6. Phase 3: Wireframe & Assets
   |     (layout, placeholders, wireframe code)
   +-- 7. Phase 4: High-Fidelity Execution
         (styling, final code, pixel-check)
```

## Execution Requirements

**Critical**: Different execution approaches by phase:

### Phases 0-3: Clarifying Questions Approach
1. **Ask questions**: ONE AT A TIME, wait for user response
2. **Build understanding**: Incrementally through dialogue
3. **Execute phase**: Only when all information is gathered
4. **Loss function**: AI evaluates output
5. **Hotkeys**: Present P/R/E/R# options

### Phase 4: Plan Mode Approach
1. **Plan creation**: AI creates detailed plan using Plan Mode
2. **User approval**: User reviews and approves plan
3. **Phase execution**: AI executes approved plan
4. **Loss function**: AI evaluates output
5. **Hotkeys**: Present P/R/E/R# options

This ensures accurate information gathering (Phases 0-3) and controlled high-fidelity execution (Phase 4).

## Execution Flow

```
Phase 0 [Clarify 1:1] -> [Execute] -> Loss Fn -> User OK -> Hotkeys
   |
Phase 1 [Clarify 1:1] -> [Execute] -> Loss Fn -> User OK -> Hotkeys
   |
Phase 2 [Clarify 1:1] -> [Execute] -> Loss Fn -> User OK -> Hotkeys
   |
Phase 3 [Clarify 1:1] -> [Execute] -> Loss Fn -> User OK -> Hotkeys
   |
Phase 4 [Plan] -> [Approve] -> [Execute] -> Loss Fn -> User OK -> Hotkeys
```

## Phase Files

| Phase | File | Purpose |
|-------|------|---------|
| 0 | Phase0-Setup | Collect project info, URLs, define screens |
| 1 | Phase1-Semantic-Understanding | Understand what each screen does |
| 2 | Phase2-Component-Definition | Extract components, generate skeletons |
| 3 | Phase3-Wireframe-Assets | Layout structure, asset catalog, visual wireframe review |
| 4 | Phase4-High-Fidelity-Execution | Final styling, production code |

## Loss Function Reference

**Categories** (rate 1-10 each):
1. Semantic mismatch
2. Structural mismatch
3. Visual mismatch
4. Completeness
5. Hallucination
6. Consistency

**Threshold**: Total Loss <= 2 to proceed

## Figma Data Source

- **MCP Tool**: `get_code_for_selection` as source of truth
- **Screenshots**: Model generates for visual reference
- **Screen Definitions**: All screens defined upfront in Phase 0

## Report Generation

**Filename format**: `[DD-Month-YY]-[project-name]-figma-report.md`

**Example**: `12-June-25-dashboard-redesign-figma-report.md`

**Location**: Working directory (where user initiates pipeline)

**Structure**:
- Phase 0: Setup info
- Phase 1: Semantic understanding
- Phase 2: Component catalog
- Phase 3: Wireframe specs
- Phase 4: Final styling + code

## Code Generation

| Phase | Output |
|-------|--------|
| Phase 2 | Component skeletons (`.tsx`) |
| Phase 3 | Wireframe structure (`.tsx`, `.css`) |
| Phase 4 | Production-ready styled code |

All code files: flat in working directory, referenced in report.

## Hotkey System

**Common hotkeys** (must be used verbatimly after each message/phase):

| Key | Action |
|-----|--------|
| `P` | Proceed to next phase |
| `R` | Refine current phase |
| `E` | Edit report manually |
| `R0` | Refine Phase 0: Setup |
| `R1` | Refine Phase 1: Semantic Understanding |
| `R2` | Refine Phase 2: Component Definition |
| `R3` | Refine Phase 3: Wireframe & Assets |
| `R4` | Refine Phase 4: High-Fidelity Execution |

## Refinement Behaviour

- **Report sections**: Replace old section when refining (not append)
- **Downstream phases**: Preserved when refining earlier phase
- **User control**: User manually decides which downstream phases to re-run
- **Code files**: Overwritten when phase is re-run

## Error Handling

| Situation | Action |
|-----------|--------|
| Total Loss > 2 | Enter refinement loop |
| Local minimum | Flag to user, present hotkeys |
| Phase contradiction | Flag, present relevant R# hotkey |
| Incomplete Figma | Document ambiguity in report |

## Quick Start

1. Run Phase 0 to set up project
2. Model executes each phase sequentially
3. After each phase:
   - Review loss function scores
   - Choose hotkey action
4. Pipeline complete when Phase 4 passes

## Success Criteria

- All phases pass with Total Loss <= 2
- All code files generated
- Report complete with all phases documented
- User approves each phase

---

# Phase 0: Setup

**Purpose**: Initialise project and collect inputs before beginning the pipeline.

## Execution Approach

**MANDATORY**: During this phase, the AI must:
1. Ask clarifying questions ONE AT A TIME
2. Wait for user response before proceeding
3. Build understanding incrementally through dialogue
4. Only execute when all required information is gathered

This ensures accurate information collection without assumptions.

## Tasks

```
1. Phase 0: Setup
   |-- 2. Request project name from user
   |-- 3. Request all Figma URLs (paste all upfront)
   |-- 4. User defines all screens
   |     (select/identify all screens in Figma)
   |-- 5. Capture screen data via MCP
   |     (use get_code_for_selection)
   |-- 6. Generate report filename
   |     ([DD-Month-YY]-[project-name]-figma-report.md)
   |-- 7. Store URLs and screen definitions
   |     (in report header for all phases)
   +-- 8. Create initial report structure
```

## Execution Instructions

### Step 1: Collect project information

Ask the user:
> "What is the project name for this Figma-to-Code conversion?"

### Step 2: Collect Figma URLs

Ask the user:
> "Please paste all Figma URLs needed for this project (one per line):"

### Step 3: Define screens

Ask the user to select screens in Figma, then use MCP:
> "Please select all screens in Figma that should be included. I will use MCP `get_code_for_selection` to capture each screen."

For each screen:
1. User selects in Figma
2. Call MCP `get_code_for_selection`
3. Store screen name and data

### Step 4: Generate report

Create report file with format: `[DD-Month-YY]-[project-name]-figma-report.md`

Example: `12-June-25-dashboard-redesign-figma-report.md`

## Report Template

```markdown
# Figma-to-Code Report: [Project Name]

**Date**: [DD Month YYYY]
**Generated by**: Figma-to-Cursor Pipeline

---

## Figma URLs

- [URL 1]
- [URL 2]
- ...

---

## Screens Defined

| Screen Name | Figma Selection | Status |
|-------------|-----------------|--------|
| [name]      | [captured]      | Ready  |
| [name]      | [captured]      | Ready  |

---

## Phase 0: Setup

- **Project name**: [name]
- **URLs collected**: [count]
- **Screens defined**: [count]
- **Report created**: [timestamp]

**Status**: Complete

---

[Subsequent phases will be appended here]
```

## Output

- Report file created in working directory
- Figma URLs documented
- All screens defined and captured via MCP
- Ready to proceed to Phase 1

## Hotkeys

After Phase 0 completes, present:

- `P [Proceed to Phase 1: Semantic Understanding]`
- `E [Edit report]` - Manually edit report

---

# Phase 1: Semantic Understanding

**Input**: All Figma URLs and screen definitions from Phase 0.

**Purpose**: Understand what each screen does before analysing how it looks.

## Execution Approach

**MANDATORY**: During this phase, the AI must:
1. Ask clarifying questions ONE AT A TIME
2. Wait for user response before proceeding
3. Build understanding incrementally through dialogue
4. Only execute when all required information is gathered

This ensures accurate semantic understanding without assumptions.

## Tasks

```
1. Phase 1: Semantic Understanding
   |-- 2. Generate three high-level representations
   |     (10 words max per line)
   |  |-- 3. User-facing representation
   |  |     (what users see/do)
   |  |-- 4. Functional representation
   |  |     (what system accomplishes)
   |  +-- 5. Structural representation
   |        (how it's organised)
   |-- 6. List every screen name
   |-- 7. Describe primary goal per screen
   |-- 8. Describe user actions per screen
   |-- 9. Map navigation flows
   |-- 10. Self-evaluate using loss function
   +-- 11. Ask user for first pass approval
```

## Execution Instructions

### Step 1: Reference Figma data

For each screen defined in Phase 0:
1. Reference the MCP `get_code_for_selection` data
2. Generate screenshots for visual reference
3. Analyse purpose and user intent

### Step 2: Generate three representations

Create three distinct views of the system (10 words max per line):

**Representation 1: User-Facing**
> What users see and do

```
- [10 words max describing user view]
- [10 words max describing user action]
- ...
```

**Representation 2: Functional**
> What the system accomplishes

```
- [10 words max describing capability]
- [10 words max describing feature]
- ...
```

**Representation 3: Structural**
> How the system is organised

```
- [10 words max describing structure]
- [10 words max describing hierarchy]
- ...
```

### Step 3: Document screens

For each screen:
- **Name**: [screen name]
- **Primary goal**: [what the screen achieves]
- **User actions**: [what users can do here]

### Step 4: Map navigation flows

Document how screens connect:
```
Screen A -> Screen B (via [action])
Screen B -> Screen C (via [action])
```

### Step 5: Self-evaluate with loss function

Rate each category (1-10):
- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]

**Total Loss**: [average]

### Step 6: User approval

Present results to user for first pass validation before calculating final loss score.

## Loss Function Application

- Check semantic accuracy against Figma
- Verify completeness (all screens accounted)
- Flag hallucinations (no invented screens)
- Ensure three representations align with each other

**If Total Loss > 2**: Identify specific errors and refine
**If Total Loss <= 2**: Present results to user with hotkeys
**If local minimum**: Flag explicitly to user for steering

## Report Section

Append to report:

```markdown
---

## Phase 1: Semantic Understanding

### Three System Representations

**1. User-Facing**
- [bullet points, 10 words max each]

**2. Functional**
- [bullet points, 10 words max each]

**3. Structural**
- [bullet points, 10 words max each]

### Screens Identified

| Screen | Primary Goal | User Actions |
|--------|--------------|--------------|
| [name] | [goal]       | [actions]    |

### Navigation Flow

[flow diagram or list]

### Loss Function Scores

- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]
- **Total Loss**: [average]

**Status**: Proceed / Refine / Local Minimum Detected
```

## Output

- Three system representations (10 words max per line)
- Screen semantics catalog
- Navigation flow map
- Loss function scores appended to report

## Hotkeys

After Phase 1 completes, present:

- `P [Proceed to Phase 2: Component Definition]`
- `R [Refine Phase 1: Semantic Understanding]`
- `E [Edit report]`
- `R0 [Refine Phase 0: Setup]`

---

# Phase 2: Component Definition

**Input**: Phase 1 semantics + Figma URLs and MCP data.

**Purpose**: Extract reusable components, define their properties, and generate skeleton code.

## Execution Approach

**MANDATORY**: During this phase, the AI must:
1. Ask clarifying questions ONE AT A TIME
2. Wait for user response before proceeding
3. Build understanding incrementally through dialogue
4. Only execute when all required information is gathered

This ensures accurate component identification without assumptions.

## Tasks

```
1. Phase 2: Component Definition
   |-- 2. Identify reusable components
   |     (across all screens)
   |-- 3. Define component properties
   |  |-- 4. Props (data inputs)
   |  |-- 5. States (default, hover, active, disabled)
   |  +-- 6. Variants (primary, secondary, sizes)
   |-- 7. Build component hierarchy tree
   |-- 8. Describe interactions/behaviours
   |-- 9. Generate component skeletons
   |     (code files)
   |-- 10. Self-evaluate using loss function
   |-- 11. Check consistency with Phase 1
   |      (flag contradictions)
   +-- 12. Ask user for first pass approval
```

## Execution Instructions

### Step 1: Analyse screens for patterns

Reference Phase 1 output and Figma MCP data:
1. Identify UI elements that appear multiple times
2. Group similar elements into component types
3. Note unique, single-use components

### Step 2: Define each component

For each identified component:

```
Component: [Name]
|-- Props
|  |-- [propName]: [type] - [description]
|  +-- ...
|-- States
|  |-- default
|  |-- hover
|  |-- active
|  +-- disabled (if applicable)
|-- Variants
|  |-- [variant1]: [description]
|  +-- [variant2]: [description]
+-- Usage
   +-- [list of screens where used]
```

### Step 3: Build hierarchy tree

Document parent-child relationships:

```
App
|-- Layout
|  |-- Header
|  |  |-- Logo
|  |  +-- Navigation
|  |-- Main
|  |  +-- [Page Components]
|  +-- Footer
+-- Shared
   |-- Button
   |-- Card
   +-- Input
```

### Step 4: Describe interactions

For each interactive component:
- Trigger (click, hover, focus, etc.)
- Action (navigate, submit, toggle, etc.)
- Feedback (visual change, animation, etc.)

### Step 5: Generate component skeletons

Create TypeScript/React skeleton files:

**Example: `Button.tsx`**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}: ButtonProps) => {
  // Skeleton - styling added in Phase 4
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
```

Files generated flat in working directory.

### Step 6: Self-evaluate with loss function

Rate each category (1-10):
- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]

**Total Loss**: [average]

### Step 7: Consistency check with Phase 1

Compare component definitions against Phase 1 semantic understanding:
- Do components support all identified user actions?
- Does hierarchy match structural representation?
- Are all screens' needs covered?

**If contradiction found**: Flag to user with specific phase hotkey options.

### Step 8: User approval

Present results to user for first pass validation.

## Loss Function Application

- Check component extraction accuracy
- Verify props match design requirements
- Ensure hierarchy matches Figma layers
- **Flag if contradicts Phase 1 semantics**

**If Total Loss > 2**: Identify specific errors and refine
**If Total Loss <= 2**: Present results to user with hotkeys
**If local minimum**: Flag explicitly to user for steering
**If Phase 1 contradiction**: Present R1 hotkey option

## Report Section

Append to report:

```markdown
---

## Phase 2: Component Definition

### Components Identified

| Component | Props | States | Variants | Used In |
|-----------|-------|--------|----------|---------|
| [name]    | [list]| [list] | [list]   | [screens]|

### Component Hierarchy

[tree structure]

### Interactions

| Component | Trigger | Action | Feedback |
|-----------|---------|--------|----------|
| [name]    | [event] | [action]| [visual] |

### Code Files Generated

- `[Component].tsx` - Component skeleton
- `[Component].types.ts` - Props interface (if separate)

### Loss Function Scores

- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]
- **Total Loss**: [average]

**Consistency Check**: Aligns with Phase 1 / Contradiction flagged

**Status**: Proceed / Refine
```

## Output

- Component catalog with props, states, variants
- Component hierarchy tree
- Interaction descriptions
- Component skeleton files (flat in working directory)
- Loss function scores appended to report

## Hotkeys

After Phase 2 completes, present:

- `P [Proceed to Phase 3: Wireframe & Assets]`
- `R [Refine Phase 2: Component Definition]`
- `E [Edit report]`
- `R0 [Refine Phase 0: Setup]`
- `R1 [Refine Phase 1: Semantic Understanding]`

---

# Phase 3: Wireframe & Assets

**Input**: Phase 1+2 outputs + Figma URLs and MCP data.

**Purpose**: Extract layout structure and catalog all assets (wireframe style, no colours).

## Execution Approach

**MANDATORY**: During this phase, the AI must:
1. Ask clarifying questions ONE AT A TIME
2. Wait for user response before proceeding
3. Build understanding incrementally through dialogue
4. Only execute when all required information is gathered

This ensures accurate layout and asset extraction without assumptions.

## Tasks

```
1. Phase 3: Wireframe & Assets
   |-- 2. Extract layout structure
   |  |-- 3. Grid systems (columns, rows, gutters)
   |  |-- 4. Flexbox patterns (direction, alignment)
   |  +-- 5. Spacing patterns (margins, padding)
   |-- 6. Generate ASCII wireframe mockup
   |     (visual text-based layout representation)
   |-- 7. User approval checkpoint 1
   |     (approve mockup before coding)
   |-- 8. List all placeholder shapes
   |     (rectangles, circles, dimensions)
   |-- 9. Catalog unique assets
   |  |-- 10. Icons (name, dimensions, usage)
   |  +-- 11. Images (name, dimensions, usage)
   |-- 12. Verify placement accuracy
   |      (spacing measurements against Figma)
   |-- 13. Generate wireframe code
   |      (HTML/CSS structure)
   |-- 14. Browser render and snapshot
   |      (use MCP to render and capture)
   |-- 15. User approval checkpoint 2
   |      (approve rendered wireframe)
   |-- 16. Self-evaluate using loss function
   +-- 17. Ask user for final approval
```

## Execution Instructions

### Step 1: Extract layout structure

Reference Figma MCP data for each screen:

**Grid Systems**
```
Screen: [name]
|-- Grid
|  |-- Columns: [number]
|  |-- Gutter: [px]
|  +-- Margin: [px]
```

**Flexbox Patterns**
```
Container: [name]
|-- Direction: row | column
|-- Justify: [value]
|-- Align: [value]
+-- Gap: [px]
```

**Spacing Patterns**
Document consistent spacing values used:
- Small: [px]
- Medium: [px]
- Large: [px]

### Step 1.5: Generate ASCII wireframe mockup

Before writing code, create a visual text-based mockup using Unicode box-drawing characters:

**ASCII Wireframe Generation Rules:**
- Use `+--+` for corners and top borders
- Use `+--+` for corners and bottom borders
- Use `|` for vertical lines
- Include measurements: `(h: 64px)`, `(w: 280px)`, `(gap: 24px)`
- Show hierarchy with nesting and indentation
- Label major sections clearly

**Example ASCII Wireframe:**
```
+----------------------------------------------------------+
| HEADER (h: 64px)                                          |
| +--------+                           +------+------+     |
| | Logo   |  Nav Item 1  Nav Item 2   | Icon | User |     |
| +--------+                           +------+------+     |
+----------------------------------------------------------+
+----------------------------------------------------------+
| MAIN CONTENT AREA (flex, gap: 24px)                       |
| +--------------+ +----------------------------------+    |
| | SIDEBAR      | | CONTENT                           |    |
| | (w: 280px)   | | (flex: 1)                         |    |
| |              | |                                   |    |
| | [Nav Items]  | | +------------------------------+ |    |
| |              | | | Card (h: 120px)              | |    |
| |              | | | [Title]                      | |    |
| |              | | | [Content]                    | |    |
| |              | | +------------------------------+ |    |
| +--------------+ +----------------------------------+    |
+----------------------------------------------------------+
+----------------------------------------------------------+
| FOOTER (h: 48px)                                          |
| (c) 2025 Company Name          [Links]        [Social]    |
+----------------------------------------------------------+
```

**User Approval Checkpoint 1:**
Present ASCII mockup and ask:
> "Does this wireframe layout match the Figma structure? Press Y to approve and proceed to code generation, or N to revise."

Wait for explicit user approval before proceeding to code generation.

### Step 2: Document placeholder shapes

List all placeholder elements:

| Shape | Dimensions | Purpose | Location |
|-------|------------|---------|----------|
| Rectangle | [w x h px] | Image placeholder | [screen/component] |
| Circle | [diameter px] | Avatar placeholder | [screen/component] |

### Step 3: Catalog assets

**Icons**
| Icon Name | Dimensions | Used In |
|-----------|------------|---------|
| [name] | [w x h px] | [components/screens] |

**Images**
| Image Name | Dimensions | Used In |
|------------|------------|---------|
| [name] | [w x h px] | [components/screens] |

### Step 4: Verify placement accuracy

For each component:
1. Measure spacing from Figma (via MCP)
2. Document exact pixel values
3. Flag any inconsistencies

Tolerance: <=5px deviation acceptable

### Step 5: Generate wireframe code

Create structural HTML/CSS without styling:

**Example: `wireframe.tsx`**
```tsx
export const PageLayout = () => {
  return (
    <div className="page-layout">
      <header className="header">
        {/* Header structure */}
      </header>
      <main className="main">
        <aside className="sidebar">
          {/* Sidebar structure */}
        </aside>
        <section className="content">
          {/* Content structure */}
        </section>
      </main>
      <footer className="footer">
        {/* Footer structure */}
      </footer>
    </div>
  );
};
```

**Example: `wireframe.css`**
```css
/* Layout structure only - no colours */
.page-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.main {
  display: flex;
  gap: 24px; /* From Figma measurements */
}

.sidebar {
  width: 280px; /* From Figma measurements */
}

.content {
  flex: 1;
}
```

Files generated flat in working directory.

### Step 5.5: Browser render and visual review

Use cursor-ide-browser MCP to render and review the wireframe code:

**Browser MCP Workflow:**

1. **Navigate to wireframe**: Use MCP tool `browser_navigate` to load the wireframe HTML file
   - Generate a standalone HTML file that imports the wireframe component
   - Use `file://` protocol with absolute path to the HTML file

2. **Capture snapshot**: Use MCP tool `browser_snapshot` to capture accessibility tree
   - This captures the rendered DOM structure
   - Provides a text-based representation of what's rendered

3. **Add to report**: Include snapshot in Phase 3 report section
   - Document the rendered structure
   - Compare against the ASCII mockup

4. **Visual verification**: Document observations
   - What renders correctly vs what was expected
   - Any layout issues or deviations
   - Browser rendering notes

**Example MCP Usage:**
```
1. CallMcpTool: browser_navigate with url: "file:///absolute/path/to/wireframe.html"
2. CallMcpTool: browser_snapshot (no parameters needed)
3. Parse and document the accessibility snapshot
```

**User Approval Checkpoint 2:**
Present rendered snapshot and ask:
> "Does the rendered wireframe match the mockup? Press Y to proceed to loss function, or N to revise the code."

Wait for explicit user approval before proceeding to loss function evaluation.

### Step 6: Self-evaluate with loss function

Rate each category (1-10):
- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]

**Total Loss**: [average]

### Step 7: User approval

Present results to user for first pass validation.

## Loss Function Application

- Check structural accuracy (layout matches Figma)
- Verify completeness (all placeholders accounted)
- Ensure asset catalog complete
- Check spacing measurements accuracy (<=5px tolerance)

**If Total Loss > 2**: Identify specific errors and refine
**If Total Loss <= 2**: Present results to user with hotkeys
**If local minimum**: Flag explicitly to user for steering

## Report Section

Append to report:

```markdown
---

## Phase 3: Wireframe & Assets

### Layout Structure

**Grid System**
- Columns: [number]
- Gutter: [px]
- Margin: [px]

**Flex Patterns**
| Container | Direction | Justify | Align | Gap |
|-----------|-----------|---------|-------|-----|
| [name]    | [dir]     | [val]   | [val] | [px]|

**Spacing Scale**
- Small: [px]
- Medium: [px]
- Large: [px]

### ASCII Wireframe Mockup

[ASCII wireframe using box-drawing characters]

**Mockup Approval**: Approved / Revised

**Notes**: [Any revisions or feedback from user]

### Placeholder Inventory

| Shape | Dimensions | Purpose | Location |
|-------|------------|---------|----------|
| [shape] | [size] | [purpose] | [location] |

### Asset Registry

**Icons**
| Icon | Dimensions | Used In |
|------|------------|---------|
| [name] | [size] | [locations] |

**Images**
| Image | Dimensions | Used In |
|-------|------------|---------|
| [name] | [size] | [locations] |

### Code Files Generated

- `wireframe.tsx` - Layout structure
- `wireframe.css` - Base layout styles (no colours)
- `wireframe.html` - Standalone HTML for browser testing

### Browser Render Snapshot

[Accessibility snapshot from browser_snapshot MCP tool]

**Render Approval**: Approved / Revised

**Visual Verification Notes**: [Observations about rendered output]

### Placement Verification

Spacing measurements within 5px tolerance: Y/N

### Loss Function Scores

- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]
- **Total Loss**: [average]

**Status**: Proceed / Refine
```

## Output

- Layout structure documentation
- ASCII wireframe mockup (with user approval)
- Placeholder inventory
- Asset registry (icons, images)
- Wireframe code files (flat in working directory)
- Browser render snapshot (with user approval)
- Loss function scores appended to report

## Hotkeys

After Phase 3 completes, present:

- `P [Proceed to Phase 4: High-Fidelity Execution]`
- `R [Refine Phase 3: Wireframe & Assets]`
- `E [Edit report]`
- `R0 [Refine Phase 0: Setup]`
- `R1 [Refine Phase 1: Semantic Understanding]`
- `R2 [Refine Phase 2: Component Definition]`

---

# Phase 4: High-Fidelity Execution

**Input**: All prior phases + Figma URLs and MCP data.

**Purpose**: Apply final styling and generate production-ready code.

## Plan Mode Requirement

**MANDATORY**: Before executing this phase, the AI must:
1. Switch to Plan Mode (if not already in it)
2. Create a detailed plan using the CreatePlan tool
3. Wait for user approval before proceeding with execution

This ensures deliberate, reviewed progression through each phase.

## Tasks

```
1. Phase 4: High-Fidelity Execution
   |-- 2. Extract styling specifications
   |  |-- 3. Colours (hex, RGB, opacity)
   |  |-- 4. Typography (font, size, weight, line-height)
   |  |-- 5. Shadows (offset, blur, spread, colour)
   |  |-- 6. Borders (width, style, radius)
   |  +-- 7. Gradients (if applicable)
   |-- 8. Replace placeholders with real assets
   |-- 9. Generate production-ready code
   |-- 10. Pixel-check against Figma
   |-- 11. Two-stage self-evaluation
   |  |-- 12. Evaluate styling (visual accuracy)
   |  +-- 13. Evaluate code (structure, quality)
   +-- 14. Ask user for first pass approval
```

## Execution Instructions

### Step 1: Extract styling specifications

From Figma MCP data, extract exact values:

**Colours**
```
Primary: #[hex] / rgb([r], [g], [b])
Secondary: #[hex]
Background: #[hex]
Text Primary: #[hex]
Text Secondary: #[hex]
Border: #[hex]
...
```

**Typography**
```
Heading 1:
|-- Font: [family]
|-- Size: [px]
|-- Weight: [number]
|-- Line Height: [px or multiplier]
+-- Letter Spacing: [px or em]

Body:
|-- Font: [family]
|-- Size: [px]
|-- Weight: [number]
+-- Line Height: [px or multiplier]
```

**Shadows**
```
Card Shadow:
|-- Offset X: [px]
|-- Offset Y: [px]
|-- Blur: [px]
|-- Spread: [px]
+-- Colour: rgba([r], [g], [b], [a])
```

**Borders**
```
Default Border:
|-- Width: [px]
|-- Style: solid | dashed | etc.
|-- Colour: #[hex]
+-- Radius: [px]
```

### Step 2: Replace placeholders

For each placeholder in Phase 3:
1. Identify the real asset from Figma
2. Export or reference the asset
3. Update code to use real asset

### Step 3: Generate production code

Update wireframe code with full styling:

**Example: `Button.tsx` (final)**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded-lg transition-colors';

  const variantStyles = {
    primary: 'bg-[#HEX] text-white hover:bg-[#HEX]',
    secondary: 'bg-transparent border border-[#HEX] text-[#HEX]'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

Files generated/updated flat in working directory.

### Step 4: Pixel-check against Figma

Verify implementation against Figma:

| Check | Status | Notes |
|-------|--------|-------|
| Spacing matches | Y/N | [details] |
| Colours match exactly | Y/N | [details] |
| Typography matches | Y/N | [details] |
| Shadows/effects match | Y/N | [details] |
| Border radius matches | Y/N | [details] |
| Assets render correctly | Y/N | [details] |

### Step 5: Two-stage self-evaluation

**Stage 1: Styling Evaluation**

Rate each category (1-10):
- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]

**Styling Total Loss**: [average]

**Stage 2: Code Quality Evaluation**

Rate each category (1-10):
- Semantic mismatch: [score] (does code match intended behaviour?)
- Structural mismatch: [score] (does structure match Phase 2 components?)
- Visual mismatch: [score] (is code readable and well-organised?)
- Completeness: [score] (all components implemented?)
- Hallucination: [score] (no extra/unnecessary code?)
- Consistency: [score] (follows project conventions?)

**Code Total Loss**: [average]

**Combined Total Loss**: [average of both stages]

### Step 6: User approval

Present results to user for first pass validation.

## Loss Function Application

**Styling evaluation**:
- Visual accuracy (colours, typography, effects)
- Spacing matches Figma
- All assets correctly applied
- Completeness (no missing styles)

**Code evaluation**:
- Structural accuracy (matches Phase 2 components)
- Semantic correctness (matches Phase 1)
- Code quality (follows conventions)
- Responsiveness

**If Total Loss > 2**: Identify specific errors and refine
**If Total Loss <= 2**: Present results to user with hotkeys
**If local minimum**: Flag explicitly to user for steering

## Report Section

Append to report:

```markdown
---

## Phase 4: High-Fidelity Execution

### Styling Specifications

**Colours**
| Token | Value |
|-------|-------|
| Primary | #[hex] |
| Secondary | #[hex] |
| ... | ... |

**Typography**
| Style | Font | Size | Weight | Line Height |
|-------|------|------|--------|-------------|
| H1 | [font] | [px] | [weight] | [lh] |
| Body | [font] | [px] | [weight] | [lh] |

**Shadows**
| Name | X | Y | Blur | Spread | Colour |
|------|---|---|------|--------|--------|
| Card | [px] | [px] | [px] | [px] | [rgba] |

### Code Files Generated

- `Button.tsx` - Final styled component
- `Card.tsx` - Final styled component
- `[Component].tsx` - Final styled component
- `styles.css` - Global styles (if applicable)

### Pixel-Check Results

| Check | Status |
|-------|--------|
| Spacing matches Figma | Y/N |
| Colours match exactly | Y/N |
| Typography matches | Y/N |
| Shadows/effects match | Y/N |
| Border radius matches | Y/N |
| Assets render correctly | Y/N |

### Loss Function Scores (Styling)

- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]
- **Styling Total Loss**: [average]

### Loss Function Scores (Code Quality)

- Semantic mismatch: [score]
- Structural mismatch: [score]
- Visual mismatch: [score]
- Completeness: [score]
- Hallucination: [score]
- Consistency: [score]
- **Code Total Loss**: [average]

**Combined Total Loss**: [average of both]

**Status**: Complete / Refine

---

## User Comments

[Space for user to add comments per phase]
```

## Output

- Final production code files (flat in working directory)
- Pixel-check results
- Complete report with all phase outputs
- Two-stage loss function evaluation

## Hotkeys

After Phase 4 completes, present:

- `E [Edit report]`
- `R [Refine Phase 4: High-Fidelity Execution]`
- `R0 [Refine Phase 0: Setup]`
- `R1 [Refine Phase 1: Semantic Understanding]`
- `R2 [Refine Phase 2: Component Definition]`
- `R3 [Refine Phase 3: Wireframe & Assets]`

## Pipeline Complete

When Phase 4 passes (Total Loss <= 2):

> "Pipeline complete. All phases passed with Total Loss <= 2."
>
> "Final code files are in your working directory."
>
> "Report saved as: `[DD-Month-YY]-[project-name]-figma-report.md`"

---

# Loss Function Template

```
1. Loss Function
   |-- 2. Goal: Quantify deviation from ground truth
   |     (Figma frames/MCP/screenshots)
   |-- 3. Categories of Loss (rate each 1-10)
   |     (1=perfect match, 10=complete failure)
   |  |-- 4. Semantic mismatch
   |  |     (wrong purpose/behaviour)
   |  |-- 5. Structural mismatch
   |  |     (wrong hierarchy/placement)
   |  |-- 6. Visual mismatch
   |  |     (wrong size/position/spacing >5px)
   |  |-- 7. Completeness
   |  |     (missing elements)
   |  |-- 8. Hallucination
   |  |     (invented elements)
   |  +-- 9. Consistency
   |        (differs from prior phases)
   |-- 10. Total Loss Score
   |      (Average of category scores)
   |-- 11. Threshold
   |      (Proceed only if <= 2)
   +-- 12. Refinement Loop
      |-- 13. Generate output
      |-- 14. Self-critique: list errors -> assign scores
      |-- 15. If >2: re-prompt with fixes
      +-- 16. Repeat until <=2
```

## Special Cases

- **Local minimum detected**: Flag to user with explicit message, present hotkeys for user to steer
- **Reference**: Always reference previous phase outputs + original Figma at every step

## Usage

Apply this template at the end of each phase:
1. Generate output for the phase
2. Self-critique using the 6 categories above
3. Assign scores (1-10) for each category
4. Calculate Total Loss Score (average)
5. If Total Loss > 2: identify specific errors and refine
6. If Total Loss <= 2: present results to user for approval
