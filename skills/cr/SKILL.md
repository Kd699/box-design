---
name: cr
description: Carmack-style code review workflow with tasks, wireframes, and balloon prevention
---

Actvate when I prsss: CR

**Step 0 -- Context Load (before ANY codebase search):**
Before touching code, load the full picture. ALL steps are mandatory -- no skipping.

1. Read `~/.claude/projects/-Users-mhlengi/memory/MEMORY.md` -- check Recent Session State, any relevant sections
2. Read `~/.claude/CLAUDE.md` -- check wrong_think patterns, anti-patterns, tool usage rules
3. Check latest compaction: `ls -t ~/.claude/compactions/*.md | head -1` -- read it if topic is related
4. **wrong_think2 MODEL DIRECTIVES -- MANDATORY, not optional:**
   - Run: `ls -t ~/.claude/wrong_think2/*.md` to list all files
   - Read the 3 most recent files (skip _DISTILLED_ for now)
   - Extract the `## Model Directive` line from EACH file
   - **Output them explicitly in your summary**, verbatim, labelled by date -- e.g.:
     ```
     MODEL DIRECTIVES LOADED:
     2026-03-17: "Don't assume scope on docs -- confirm canonical vs specific first."
     2026-03-16: "Start dev sessions with /recall2. Use /qc mid-session."
     2026-03-15: "Show wireframe of ALL states before coding new interaction patterns."
     ```
   - Then read `ls -t ~/.claude/wrong_think2/_DISTILLED_*.md | head -1` and extract any patterns matching the current task domain
   - You MUST quote at least one directive that applies to the current task before proceeding
5. If the task relates to a specific subsystem (e.g. notifications, WA agent, egress), grep compactions for related keywords
6. **Run /spidey on the task** -- query past decision arcs for similar work. Surface successful approaches (WEB-SWING) and failed approaches (WALL-SPLAT) with step sequences and ideal approaches. Include the SPIDEY SAYS one-liner in the summary.
   - If /spidey arc DB is unavailable, report: "Arc DB unavailable. Loaded N wrong_think files as fallback. Relevant patterns: ..."

This ensures you never start a /cr with stale context or repeat a mistake from a previous session. If any files contain directly relevant information, mention it in the summary.

7. **Frontend task detection**: If the task involves UI components, screens, layouts, or visual design -- invoke the /frontend-design skill for the implementation phase (not the planning phase). Detect frontend tasks by checking if the task mentions: JSX, components, screens, Tailwind, Figma, wireframe, layout, design, UI, viewer, artboard. When executing frontend tasks, apply /frontend-design principles: distinctive, production-grade UI, high design quality, avoids generic AI aesthetics.

First: Search for the relevant sectiosn of the codebase to grab references and understand the layout.

Second, do a summary to show me you understadn what I am asking of you.

Then once I am happy with that, produce a **state machine diagram** (ASCII) showing states, transitions, and data flow before creating tasks.

Then create tasks to execute this.

then, ask from my permission to execute each one. then ask for my permission to execute the next one, etc.

for each step make sure to ask the user if they want an ascii wireframe ui design not text of the layout of the component. then at the next output read the structure of the component in queestion: show before and after..

make sure at each stage the browser render is updated so I can see what's happening.

for each task and sub task, answer: what'ts the minimal amount of lines you see us changing, and what would each of them be doing?

lets make sure we reduce ballooning, then after see if the changed code has more or less than that amount-- did it baloon or not?

When Executing do it like this: A world champion programmer like John Carmack codes JSX with precision, clarity, and performance—writing minimal, scalable frontends, removing vestigial or complex code to simplify it.

At the end of each task, review the carmack and the baloon stuff, then review this for the end of all the tasks and suggest improvements. Be default skeptical of your ratings of ballooning. Suggest carmakc efficiencies to make. Think smart.

When user presses: NW it means no wireframe
When user presses: W it means wireframe.
When user presses: R it means follow rules.

Dont generate before and after code
