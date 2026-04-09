# box-design

Shared Claude Code skills for the team. Clone once, use everywhere.

## Setup (one time)

```bash
git clone https://github.com/Kd699/box-design.git ~/box-design
cd ~/box-design && ./install.sh
```

That's it. All skills are now available in Claude Code.

## Using skills

In any Claude Code session, type the skill name as a slash command:

```
/cr          -- Carmack-style code review with task breakdown
/ask         -- Refine ideas one question at a time
/rethink     -- Pause and list simpler alternatives before coding
/deslop      -- Remove AI slop from your current branch diff
/spidey      -- Find relevant context before starting a task
```

## Getting updates

When someone pushes new skills or updates, pull them:

```
/box-sync-pull
```

This fetches the latest from main, shows what changed, and installs to your local skills.

## Contributing a skill

### Option A: Use the sync command

```
/box-sync-push
```

This detects changes, creates a branch, and opens a PR for review.

### Option B: Manual

1. Add your skill to `skills/<skill-name>/skill.md`
2. Update `manifest.json` with a JTBD entry
3. Open a PR to main

### Skill file format

Each skill lives in `skills/<name>/skill.md` (or `SKILL.md`). The file is a markdown document that tells Claude Code what to do when the user runs `/<name>`. Example:

```markdown
# /my-skill - Short Description

What this skill does in one sentence.

## Instructions

Step-by-step instructions for Claude Code to follow.
```

## All skills

| Skill | What it does |
|-------|-------------|
| `/agentation` | Annotate a UI element in the browser and copy DOM context into a prompt |
| `/artboardv2` | Deterministic viewer/artboard changes -- auto-audits architecture first |
| `/ask` | Refine ideas one question at a time (UX + eng collaborative flow) |
| `/box-sync-pull` | Pull latest skills from this repo |
| `/box-sync-push` | Push skill updates via PR |
| `/compact2` | Save session context + decision arc analysis |
| `/cr` | Carmack-style code review -- tasks, wireframes, balloon prevention |
| `/deslop` | Remove AI-generated code slop from branch diff |
| `/frontend-design` | Production-grade frontend with distinctive design (no AI slop aesthetics) |
| `/loss-function` | Figma-to-code pipeline with 5-phase evaluation |
| `/mothership_terminal` | Orchestrate parallel Claude Code sessions -- spawn, monitor, verify |
| `/prd` | Canonical UX documentation in pure user language |
| `/pseudocode` | 50-line pseudocode for components with file paths |
| `/recall2` | Load saved session context + decision arc history |
| `/rethink` | Pause before coding -- list simpler alternatives |
| `/spec` | UX spec from state tree (JTBD framework + QA checklist) |
| `/spidey` | Spidey-sense -- domain-aware context search before starting work |
| `/spidey1` | RAG your current session for relevant context |
| `/trans-spec` | Meeting transcript (VTT) to structured Notion spec |
| `/verify` | Visual browser verification against design |

## Workflow demos

### Mothership + parallel execution

[![Watch the demo](https://cdn.loom.com/sessions/thumbnails/fb4d60f74e2f4d3fb7570b1f6536ebe1-with-play.gif)](https://www.loom.com/share/fb4d60f74e2f4d3fb7570b1f6536ebe1)

For larger tasks -- a full feature, a multi-file refactor, a design implementation -- you can split the work across several Claude Code sessions running at the same time. `/mothership_terminal` turns your current session into a dispatch window: it writes task prompts to files, opens new Terminal windows with Claude running in each, and polls for completion. You stay in the mothership and watch the status table update. When a terminal finishes, you verify its output from the same window and retry any failures without losing context on the other tasks.

This works well for anything with clear seams: "fix the API layer while I fix the UI layer" or "build component A while component B is being spec'd". The key discipline is narrow scope per terminal -- one task, one output, one definition of done.

### Super Whisper for fast input

Long task prompts are tedious to type. Super Whisper (a third-party speech-to-text tool) lets you dictate the prompt instead. Speak the context, the files, the constraints -- Claude Code receives it as text. Combined with mothership dispatch, the loop is: speak the task, mothership writes the prompt file, terminal spawns and runs. For people who think faster than they type, this changes the pace significantly.

### Agentation for UI work

When you're staring at a visual bug, the hardest part is translating what you see into enough context for Claude to locate and fix it. Agentation solves this by letting you click the element directly in the browser. The plugin captures the component path, props, and DOM structure and formats it into a prompt-ready block. You paste that into Claude Code with a one-line description of the problem. No more hunting for component names or copying class strings.

### Spidey for avoiding repeated mistakes

`/spidey` runs before you start a task. It searches memory files and past task summaries for patterns relevant to what you're about to do -- previous decisions, known gotchas, patterns that worked. It surfaces these before the model has a chance to repeat an old mistake. Run it when starting anything non-trivial.

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI or desktop app
- `gh` CLI (for sync commands)
- Git
- [Super Whisper](https://superwhisper.com) (optional, external tool -- recommended for speech-to-text input with Claude Code)

## Coming soon

- **Hooks**: programmatic prompt injections triggered by events in Claude Code (file save, task complete, etc.) -- an alternative to relying on the model to self-trigger behaviours. Lets you wire up consistent pre/post actions without putting them in the skill file.
