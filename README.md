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

## Requirements

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI or desktop app
- `gh` CLI (for sync commands)
- Git
