# /mothership_terminal

Orchestrate parallel Claude Code sessions from the current terminal. This session is the mothership -- it spawns, monitors, and verifies work done by child terminals.

## When to Use
- User wants to parallelise tasks across multiple Claude Code sessions
- User says /mothership_terminal or asks to "spawn terminals", "run in parallel", "orchestrate"
- User wants to dispatch a task plan (/at, /mdplan) to another terminal

## How It Works

### 1. Plan Tasks
Create a task list with clear, narrow scope per task. One task per terminal.
If the user provides an /at tree or /mdplan, convert each phase into a task prompt.

### 2. Write Prompts
Write each task prompt to `/tmp/mothership/taskN-prompt.md`. Be specific -- include:
- Working directory
- Exact files to create/modify
- What "done" looks like (loss function targets if applicable)
- Constraints (line count, patterns to follow, etc.)
- Which skills to use (/spidey, /verify, /ralph-loop, /call-me, etc.)
- Regression checks against existing behavior

### 3. Spawn Terminals
Launch interactive Claude Code sessions:

**Primary method (interactive, all skills):**
```bash
osascript -e '
tell application "Terminal"
    activate
    do script "cd \"<WORKDIR>\" && claude"
end tell'
```

**With auto-permissions (unattended tasks):**
```bash
osascript -e '
tell application "Terminal"
    activate
    do script "cd \"<WORKDIR>\" && claude --dangerously-skip-permissions \"$(cat /tmp/mothership/taskN-prompt.md)\""
end tell'
```

**For skill-heavy tasks (requires interactive session):**
```bash
osascript -e '
tell application "Terminal"
    activate
    do script "cd \"<WORKDIR>\" && claude --dangerously-skip-permissions \"/mdplan /tmp/mothership/taskN-prompt.md\""
end tell'
```

**Using tmux (headless, for background work):**
```bash
tmux new-session -d -s task1 "cd <WORKDIR> && claude --dangerously-skip-permissions \"$(cat /tmp/mothership/task1-prompt.md)\""
# Attach later: tmux attach -t task1
```

### 4. Monitor
Poll for completion:
```bash
# Check if claude processes still running
ps aux | grep "claude" | grep -v grep | grep -v "claude-code"

# Check if expected output files exist/changed
ls -la <expected_files>

# Check tmux sessions
tmux list-sessions 2>/dev/null

# Check git status for new files
git status --short
```

### 5. Verify
Once terminals finish:
- Read each created/modified file
- Validate against the task prompt requirements
- Run loss function checks if specified
- Screenshot via Playwright if visual verification needed
- Update task list (mark completed or note failures)
- Report summary to user with status table

### 6. Retry Failed Tasks
If a terminal failed:
- Check what went wrong (permissions, missing context, bad prompt)
- Rewrite prompt with fixes
- Relaunch in a new terminal

## Dispatching with Skills

When the child terminal needs to use skills (/spidey, /verify, /ralph-loop, /call-me, etc.), it MUST be launched as an interactive session. `claude -p` cannot run skills.

### Required skill instructions in prompts:
- **/spidey**: "Use /spidey FIRST for anything you're unsure about -- search before guessing"
- **/verify**: "After each phase, use Playwright to screenshot and check loss function"
- **/ralph-loop**: "On the final gate, use /ralph-loop -- do NOT stop until loss = 0"
- **/call-me**: "If stuck >10 min on any single issue, use /call-me"

### Loss function integration:
When dispatching with loss functions, include the scale in the prompt:
```
Loss scale per phase:
  5: completely broken
  4: partially renders, major issues
  3: wrong layout/dimensions
  2: looks correct but interactions broken
  1: minor visual diff
  0: perfect -- ship it

Target: loss = 0 at every phase before proceeding.
```

## Rules
- ALWAYS use visible Terminal windows (osascript), NOT background `claude -p` for tasks needing skills
- `claude -p` is ONLY for single-shot non-interactive tasks (file writes, simple code gen)
- Keep prompts narrow -- one task per terminal
- Write prompts to files first, don't inline long strings in osascript
- Use `--dangerously-skip-permissions` so child terminals don't stall on approvals
- Verify output from mothership -- don't trust "it finished" without checking files
- Report back to user with a clear status table after each batch
- For /mdplan tasks, write the full plan to a .md file and pass via /mdplan

## Prompt Template
Save to `/tmp/mothership/taskN-prompt.md`:

```markdown
# Task: <NAME>

Working directory: <WORKDIR>

## Context
<Background info, source files, design decisions>

## What to Do
<Step by step>

## Expected Output
- <file1> -- <what it should contain>
- <file2> -- <what it should contain>

## Loss Function
<Scale + target per phase>

## Skills to Use
- /spidey for uncertainty
- /verify after each phase
- /ralph-loop on final gate
- /call-me if stuck >10 min

## Constraints
- <line limits, patterns, no-touch files, etc.>
```

## Directory
All mothership state lives in `/tmp/mothership/`:
- `taskN-prompt.md` -- prompts
- `status.md` -- running status table
