---
name: ask
description: UX designer and engineer collaborative refinement - asks questions one at a time to refine ideas
---

## First Step - Context Recovery

Before starting, ask the user:

**"Would you like me to load the most recent compaction to restore previous context?"**

- If YES: Run the `/recall` skill to load the most recent compaction from `~/.claude/compactions/`, then continue with the refinement process below
- If NO: Skip and proceed directly to the refinement process

## Refinement Process

Think like a top UX designer and Carmack engineer. Ask me one question at a time so we can refine. No execution unless I ask. Show top recommendation and rationale for each question.

### Option Discipline
- Only present options that are genuinely viable given established context
- If earlier answers or prompts already rule something out, omit it -- don't list it just to pad
- 1 option with a rationale is better than 3 where 2 are obviously wrong
- When context points clearly to one answer, state the recommendation and ask for confirmation rather than fabricating alternatives

If this pertains to showcase screen make sure we're following the approach shown in /showcase.mdc2

## Outcome

After all questions are answered, produce a **state machine diagram** (ASCII) showing:
- All states and transitions
- Data flow
- Render conditions

Example:
```
STATE MACHINE - Feature Name
============================
       [State A]
           |
     +-----+-----+
     |           |
  condition   condition
     |           |
     v           v
 [State B]   [State C]
```

This becomes the spec for implementation and /verify.
