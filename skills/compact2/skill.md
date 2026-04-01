# /compact2 - Save Session Context + Decision Arc Analysis

Everything from /compact, plus decision arc scoring via /wrong_think2.

## Background Execution Model

Steps 1-7 (analysis + file writes) run INLINE -- they need conversation context.
Steps 8-10 (git push, reindex, forward-load) run in BACKGROUND via Agent tool (run_in_background=true).

After writing files + updating MEMORY.md, immediately tell the user "Compacted. Background: pushing + reindexing." and RETURN CONTROL. Don't wait for push/reindex.

## Instructions

When the user runs `/compact2`:

1. **FIRST: Run /wrong_think2**
   - Capture errors, wrong assumptions, and new ideas from the session
   - Score all decision arcs on 3 axes (convergence, corrections, output delta)
   - Save to `~/.claude/wrong_think2/YYYY-MM-DD_<topic-slug>.md`

2. Generate a compaction summary that preserves:
   - Key decisions made
   - Important file paths and code locations discussed
   - Current task status and next steps
   - Any critical context needed to continue work
   - **Decision arc summary** (best/worst arcs, avg scores)

3. Generate a meaningful topic slug:
   - Analyze the session to identify the main topic/task
   - Create a 3-5 word slug in kebab-case

4. Create a markdown file with date and topic:
   - Directory: `~/.claude/compactions/`
   - Filename format: `YYYY-MM-DD_<topic-slug>.md`

5. Use this template for the compaction file:

```markdown
# [Topic Title] - [DATE]

## Project Context
- **Directory**: [working directory or project root]
- **Local**: [local dev URL if used]
- **Staging**: [staging URL if used]
- **Showcase**: [showcase URL if used]

## Session Context
[What we were working on - 1-2 sentences]

## Key Files
- [file paths referenced]

## Decisions Made
- [important choices or conclusions]

## Current Status
[where we left off]

## Next Steps
- [what to do next]

## Decision Arc Scores
| Arc | Msgs | Corrections | Conv | Corr Dens | Out Delta | Total | Efficiency | Compression |
|-----|------|-------------|------|-----------|-----------|-------|------------|-------------|
| [name] | [N] | [N] | [1-3] | [0-2] | [0-3] | [sum] | [0-1.0] | [0-1.0] |

- **Avg arc total**: [X]/8
- **Worst arc**: [name] -- [why]
- **Best arc**: [name] -- [why]

## Path Optimization (Lagrangian)
- **Avg efficiency ratio**: [X] (ideal / actual messages)
- **Total wasted messages**: [N]
- **Most common waste type**: [wrong_assumption | unclear_prompt | scope_creep | premature_execution | missing_context]
- **Top ideal prompt pattern**: [what to say next time to collapse multiple messages into one]

## State Compression
- **Avg compression ratio**: [X] (essential / actual states)
- **Total removable states**: [N]
- **Top bloat source**: [combinatorial toggles | unused role variants | dead filter combos | redundant tabs]
- **Top reduction opportunity**: [feature]: [N] -> [N] states by [how]

## Verdicts
- **Process**: [1 line -- what would most improve the next session's efficiency]
- **Design**: [1 line -- what would most reduce state complexity across features]

## Additional Notes
[any other important context]
```

**IMPORTANT**: Always extract and save URLs mentioned in the chat. These are critical for continuing work.

6. Write the file using the Write tool to `~/.claude/compactions/[date]_[topic-slug].md`

7. **Update MEMORY.md "Recent Session State" section:**
   - Read `~/.claude/projects/-Users-mhlengi/memory/MEMORY.md`
   - Find the `## Recent Session State (update each session)` section
   - Replace its contents with the key facts from this compaction:
     - Last task date and description (1 line)
     - Current work / what's in progress (1 line)
     - Key blockers or deadlines (1 line)
     - Any changed branch names, URLs, or critical state
   - Also update any other MEMORY.md sections that are now stale based on this session's work (e.g. active branch, egress data, architecture changes)
   - Keep it concise -- MEMORY.md has a 200-line limit. Link to the compaction file for details.
   - This is NOT optional. MEMORY.md is the living index that future sessions read first. Stale MEMORY.md = repeated mistakes.

**--- INLINE WORK ENDS HERE. Display summary immediately: ---**

Show the user:
```
Compacted: <topic-slug>
MODEL DIRECTIVE: <25w directive>
Files: compaction + wrong_think2 saved.
Background: git push + reindex running.
```

Then IMMEDIATELY return control to the user. Do not wait for steps 8-10.

8. **BACKGROUND: Dispatch Agent (run_in_background=true) for post-compaction work:**

   The background agent should do ALL of the following:

   a. **Auto-distill wrong_think patterns into CLAUDE.md:**
   Read the new wrong_think2 file just written. Check if any patterns are NOT already in the `## Wrong Think -- Distilled Patterns` section of `~/.claude/CLAUDE.md`. If new patterns exist:
   - Add them to the appropriate subsection (CORE_RULES, PATTERNS, ANTI_PATTERNS, TOOL_USAGE)
   - Keep entries concise (1 line each, ~150 chars max)
   - Update the date in the section header: `## Wrong Think -- Distilled Patterns (auto-distilled YYYY-MM-DD, N files)`
   - Do NOT duplicate existing patterns -- only add genuinely new ones
   - If an existing pattern needs refinement based on new data, update it in place

   b. **Git commit and push:**
   ```bash
   cd ~/.claude && git add -A && git commit -m "compaction2: <topic-slug>" && git push
   ```

   c. **Reindex cc-memory (chunks + arcs):**
   ```bash
   cd ~/.claude/cc-memory && node -e "
   import { indexAll } from './indexer.mjs';
   import { indexArcs } from './arc-indexer.mjs';
   await indexAll();
   await indexArcs();
   process.exit(0);
   " 2>/dev/null
   ```

   d. When done, the background agent returns silently. No need to notify user unless there was an error.
