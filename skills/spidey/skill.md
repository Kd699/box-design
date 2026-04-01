# /spidey -- Spidey-Sense for Task Approach (v2: Domain-Aware Query Expansion)

Your pattern-sense is tingling. Check what worked and what face-planted last time.

## Usage

- `/spidey <task description>` -- approach suggestions for a specific task
- `/spidey` (no args) -- infer from conversation context

## Execution

### Step 1: Task + Domain + Questions (ONE step, no tools)

If args provided, use them. If no args, infer from conversation.

Detect domain: **UX** | **Backend** | **Deploy** | **State** | **Testing** | **Data** | **Integration**

Generate 4 latent questions mentally (don't output):
1. Pattern Q: proven pattern for [core mechanic]
2. Trap Q: what went wrong with [similar work]
3. Integration Q: what breaks when [task] touches [adjacent system]
4. Docs Q: what docs/refs were mentioned for [domain]

### Step 2: Fire 2 parallel agents

Only TWO agents. Both haiku. Fire simultaneously.

---

**AGENT 1: Web Search** (model: haiku)

```
Search the web for best practices.
Task: <TASK>
Domain: <DOMAIN>
Search: "<domain> best practices <key terms> 2025 2026"
Return 3 bullet takeaways with sources. No fluff.
```

---

**AGENT 2: Full RAG (arcs + docs + backfill)** (model: haiku)

This agent does everything in one script: searches arcs AND doc chunks AND backfills the top sparse arc.

```
Write the 5 queries as a JSON array to /tmp/spidey-queries.json, then run the cached search script. Return the JSON output only.

Step 1: Write queries file
echo '["<TASK>","<PATTERN_Q>","<TRAP_Q>","<INTEGRATION_Q>","<DOCS_Q>"]' > /tmp/spidey-queries.json

Step 2: Run cached search (uses pre-computed binary embeddings, ~0.4s)
cd ~/.claude/cc-memory && node spidey-search.mjs

Return the JSON output verbatim. Nothing else.
```

The queries JSON must be valid. Shell-escape single quotes in query text.

---

### Step 3: Merge and format (MAX 25 LINES)

```
SPIDEY-SENSE: "<task>"
DOMAIN: <domain>  |  Arcs: N  |  Docs: M chunks

BEST PRACTICE (web): <3 bullets>

PLAYBOOK:
  Approach: <ideal from top arc + web>
  Steps: <from highest-eff arc>

DOCS: <top 4 refs, one line each>

DO THIS: <top 2 arcs: [date] "name" eff/sim>
AVOID:   <top 2 arcs: [date] "name" eff/sim + trap>

SPIDEY SAYS: <one-liner>
```

### Step 4: Synthesize SPIDEY SAYS

One sentence. Weave: best arc approach + web best practice + key doc ref + top trap. Specific. Actionable.

## Rules

- ONE LLM step for domain + questions (no tools)
- Only TWO agents, both **haiku**, fired IN PARALLEL
- Agent 2 does arcs + docs + backfill in ONE Node script (no grep agents)
- Output max **25 lines**
- Advisory, not a gate. Keep it fast.

## Prerequisites

Requires pre-computed binary cache files in `~/.claude/cc-memory/`:
- `spidey-arcs.bin` -- arc embeddings (Float32Array)
- `spidey-chunks.bin` -- doc chunk embeddings (Float32Array)
- `spidey-meta.json` -- arc/chunk metadata

### First-time setup (new machine)

```bash
cd ~/claude-config-sync && git pull
cp -r cc-memory/ ~/.claude/cc-memory/
cp -r skills/ ~/.claude/skills/
cd ~/.claude/cc-memory && bash setup.sh
```

If `NODE_MODULE_VERSION` error: run `npm rebuild better-sqlite3` first.

### Rebuilding cache manually

```bash
cd ~/.claude/cc-memory && node build-spidey-cache.mjs
```

Run after reindex, setup.sh, or /compact2. setup.sh includes this step automatically.

### Troubleshooting

- **"Cannot find spidey-arcs.bin"**: Run `node build-spidey-cache.mjs`
- **"Embed proxy failed"**: Check network -- uses Cloudflare Workers AI at cc-memory-embed.mdmntungwa.workers.dev
- **No results / low similarity**: Reindex first (`bash setup.sh`), cache may be stale
