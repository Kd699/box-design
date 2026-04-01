# /spidey1 -- RAG the Current Session

Search the current Claude Code session transcript for context that may have been compacted away.

## Usage

- `/spidey1 <query>` -- search for specific topic/decision/code in this session
- `/spidey1` (no args) -- infer query from current conversation context

## When to Use

- After compaction, when earlier context is lost
- When you need to recall a specific decision, code snippet, or user instruction from earlier
- When the user asks "didn't we already..." or "what did we decide about..."
- When /cr Step 0 needs session history beyond what compaction preserved

## Execution

### Step 1: Identify Session Transcript

Find the active session JSONL:

```bash
ls -t ~/.claude/projects/-Users-mhlengi-mntungwa/*.jsonl | head -1
```

This is the current session file. It contains the full uncompacted transcript.

### Step 2: Extract + Search (single Agent, model: haiku)

Fire ONE haiku agent with this prompt:

```
Search the current session transcript for context matching: "<QUERY>"

Run this Node script:

node -e "
const fs = require('fs');
const path = process.argv[1];
const query = process.argv[2].toLowerCase();
const terms = query.split(/\s+/).filter(t => t.length > 2);

const lines = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean);
const hits = [];

for (let i = 0; i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.type !== 'user' && obj.type !== 'assistant') continue;

    const msg = obj.message;
    if (!msg || !msg.content) continue;

    let text = '';
    if (typeof msg.content === 'string') {
      text = msg.content;
    } else if (Array.isArray(msg.content)) {
      text = msg.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join(' ');
    }

    if (!text || text.length < 10) continue;

    const lower = text.toLowerCase();
    const matchCount = terms.filter(t => lower.includes(t)).length;

    if (matchCount >= Math.max(1, Math.ceil(terms.length * 0.4))) {
      const ts = obj.timestamp ? new Date(obj.timestamp).toISOString().slice(0,16) : '??';
      hits.push({
        idx: i,
        role: msg.role,
        time: ts,
        matchCount,
        preview: text.slice(0, 500)
      });
    }
  } catch(e) {}
}

// Sort by match density, take top 10
hits.sort((a,b) => b.matchCount - a.matchCount);
const top = hits.slice(0, 10);

console.log(JSON.stringify({ total: hits.length, results: top }, null, 2));
" "<JSONL_PATH>" "<QUERY>"

Return the JSON output. Then summarize the top 5 hits in plain English:
- What was discussed
- Who said it (user vs assistant)
- When in the session (early/mid/late)
- Key decisions or code referenced
```

### Step 3: Format Output (MAX 20 LINES)

```
SPIDEY1: "<query>"
Session: <filename> | <N> messages | <N> hits

TOP MATCHES:
  [1] <role> @ <time>: <one-line summary>
  [2] <role> @ <time>: <one-line summary>
  [3] <role> @ <time>: <one-line summary>
  [4] <role> @ <time>: <one-line summary>
  [5] <role> @ <time>: <one-line summary>

CONTEXT RECOVERED:
<2-3 sentence synthesis of what was found -- key decisions, code, or instructions>

SPIDEY1 SAYS: <one-liner actionable takeaway>
```

### Step 4: If Deep Dive Needed

If the user wants full context from a specific hit, read the JSONL directly around that line number:

```bash
sed -n '<LINE-5>,<LINE+5>p' <JSONL_PATH> | node -e "..."
```

## Rules

- ONE haiku agent for search. No embeddings needed -- keyword match is fast enough for single-session search.
- If JSONL is >50MB, only search the last 20,000 lines (recent context matters most)
- Skip tool_use and tool_result content blocks -- only search human text and assistant text
- Do NOT output raw JSONL to the user -- always summarize
- This is READ-ONLY. Never modify the transcript.
- Max output: **20 lines**
