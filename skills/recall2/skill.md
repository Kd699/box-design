# /recall2 - Load Saved Context + Decision Arc History

Everything from /recall, plus loads wrong_think2 arc scores, path optimization, and state compression data.

## Background Execution Model

Dispatch ALL file reads as a BACKGROUND Agent (run_in_background=true). The agent reads compaction, wrong_think2, wrong_think distilled, and builds the readiness summary. User can start typing immediately.

When the background agent completes, display the CONTEXT LOADED summary. If the user has already given a task, apply the loaded context to it.

## Instructions

When the user runs `/recall2`:

1. **Immediately dispatch a background Agent** (run_in_background=true) with this prompt:

   "Load session context for recall2. Do the following steps and return a structured summary:

   a. List compactions: `ls -t ~/.claude/compactions/*.md 2>/dev/null | head -5`
   b. Read the most recent compaction file.
   c. Check for matching wrong_think2 file (same date/topic): `ls -t ~/.claude/wrong_think2/*.md 2>/dev/null | head -5`
   d. Read the matching wrong_think2 file if found.
   e. Check for distilled wrong_think2: `ls -t ~/.claude/wrong_think2/_DISTILLED_*.md 2>/dev/null | head -1`
   f. Check for distilled wrong_think: `ls -t ~/.claude/wrong_think/_DISTILLED_*.md 2>/dev/null | head -1`
   g. Read whichever distilled files exist. If no distilled wrong_think, read individual wrong_think files.

   Return a structured summary with:
   - Project Context (directory, URLs)
   - Session Context (what we were working on)
   - Key files and decisions
   - Current status and next steps
   - Decision arc scores (if wrong_think2 found)
   - Model directive (if available)
   - Better practice refs (if available)
   - Historical patterns (CORE_RULES, PATTERNS, ANTI_PATTERNS from wrong_think)
   - Filenames loaded"

2. **Immediately tell the user:**
   ```
   Loading context in background. You can start working -- I'll have full context shortly.
   ```

3. **When the background agent completes**, display the readiness summary:

   ```
   CONTEXT LOADED
   ==============
   Compaction:    [filename]
   Wrong_think2:  [filename or "none"]
   Wrong_think:   [distilled filename or N individual files]

   LAST SESSION SCORES
   -------------------
   Avg arc total: [X]/8
   Avg efficiency: [X] (path optimization)
   Avg compression: [X] (state compression)
   Worst arc: [name] -- [what to avoid]

   HISTORICAL PATTERNS LOADED
   --------------------------
   [Top 3-5 CORE_RULES from wrong_think distilled]
   [Top 3-5 PATTERNS from wrong_think distilled]
   [Top 3 ANTI_PATTERNS from wrong_think distilled]

   MODEL DIRECTIVE (from last session)
   -----------------------------------
   [25w directive if available]

   BETTER PRACTICE (from last session)
   ------------------------------------
   - [Person/Institution]: [principle]
   - [Person/Institution]: [principle]

   Ready to continue. What's next?
   ```

4. If user runs `/recall2 [topic]`:
   - Same background dispatch, but search filenames for matching topic in compactions + wrong_think2
   - Load matching files directly

## Why /recall2 is a superset of /recall

/recall2 loads everything /recall loads, plus arc-level scoring:
- **wrong_think (historical)**: CORE_RULES, PATTERNS, ANTI_PATTERNS accumulated across all sessions. Same as /recall step 6 -- load distilled if present, otherwise all individual files. Prevents repeating old mistakes.
- **wrong_think2 (arc scores)**: Decision arc scores from recent sessions -- convergence, corrections, output delta, efficiency ratios. Shows which arc types are fast/slow and why.
- **Model Directive**: 25-word corrective directive from last session. Primes the model before work begins.
- **Better Practice refs**: External wisdom (Carmack, Knuth, etc.) carried forward from arc analysis.
- **Historical Patterns in summary**: Top rules/patterns from wrong_think distilled surfaced in the readiness summary -- not buried in a file read.
