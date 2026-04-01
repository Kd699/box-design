# /trans-spec - Transcript to Notion Spec Pipeline

Convert a meeting transcript (VTT) into a structured Notion page with summary, takeaways, ASCII flow tree with task leaves, action items, and raw transcript. Searches Notion for related pages and appends to existing structure when found.

## Instructions

When the user runs `/trans-spec`:

### Phase 1: Source Selection

Ask the user which pathway to use:

1. **Downloads** -- scan `~/Downloads/` for the most recent `.vtt` files (list top 5 by modification date)
2. **SuperWhisper** -- scan `~/Documents/superwhisper/` for the most recent recording transcripts (list top 5)

Present the list and let the user pick one. If the user provides a filename or partial match directly, use that.

### Phase 2: Read and Parse Transcript

1. Read the selected VTT file.
2. Strip VTT metadata (timestamps, speaker tags like `<v Name>`, segment IDs).
3. Merge consecutive lines from the same speaker into coherent paragraphs.
4. Identify all unique speakers from the `<v>` tags.

### Phase 3: Generate Structured Content

From the cleaned transcript, generate:

#### 3a. Summary
- 2-3 sentence overview: who met, when, what was covered.

#### 3b. Key Takeaways
- Numbered list of 5-15 distilled decisions, feedback points, and directional agreements.
- Each takeaway should be bold-titled with a dash explanation.
- Focus on: decisions made, things parked/deferred, action owners, design direction changes.

#### 3c. Flow Tree (ASCII)
- Build an ASCII tree representing the topics and sub-topics discussed.
- Use the `+--` branch notation.
- Attach `TASK:` leaves to branches where actionable work was identified.
- If a related spec exists in `~/Budget_Management/docs/`, pull its existing ASCII tree and extend it with new tasks from this transcript.

#### 3d. Action Items
- Checkbox list (`- [ ]`) of concrete next steps extracted from the transcript.
- Include owner name where identifiable (e.g., "Hardeep: check with data team").

#### 3e. Raw Transcript
- Cleaned conversational format: `**Speaker:** What they said.`
- Remove filler (um, uh) but keep natural phrasing.
- Group into logical exchanges, not line-by-line.

### Phase 4: Notion Search and Match

1. Search Notion for pages matching the transcript topic (use keywords from the meeting title and content).
2. If a matching page or database is found:
   - Show the user the match and ask: **append to existing page** or **create new page**?
   - If appending, fetch the existing page structure and insert the new content respecting that structure.
3. If no match is found:
   - Identify the Meetings database (data source `collection://7a14d116-98b6-4cd1-ac4c-ab14c6db7c57`) as the default parent.
   - Create a new page there.

### Phase 5: Plan Summary (MANDATORY)

Before executing any Notion writes, present a plan to the user:

```
TRANS-SPEC PLAN
===============
Source:        [filename] ([pathway])
Speakers:      [list]
Takeaways:     [count] items
Action items:  [count] items
Flow tree:     [count] branches, [count] TASK leaves
Notion target: [create new / append to existing] -> [page name + URL if existing]

Proceed? (y/n)
```

Wait for user confirmation before writing to Notion.

### Phase 6: Execute

1. Create or update the Notion page with all sections.
2. Set the page title to the meeting name + date (e.g., "R&R Design Sync -- 2026-03-05").
3. Open the page in the browser after creation.
4. Report completion with the Notion URL.

## Key Paths

- Downloads: `~/Downloads/`
- SuperWhisper: `~/Documents/superwhisper/`
- Specs: `~/Budget_Management/docs/`
- Meetings DB data source: `collection://7a14d116-98b6-4cd1-ac4c-ab14c6db7c57`

## Notes

- Always prefer extending an existing ASCII tree from a spec over building one from scratch.
- When searching for related specs, match on keywords from the transcript (e.g., "celebration", "R&R", "budget", "EAP").
- The flow tree should capture the STRUCTURE of what was discussed, not just a flat list of topics.
- TASK leaves should be concrete and actionable, not vague.
