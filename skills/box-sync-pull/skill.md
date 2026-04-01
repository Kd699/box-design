# /box-sync-pull - Pull Skills from box-design

Pull the latest skills from the shared `box-design` repo into your local `~/.claude/skills/`.

## Instructions

### Step 1: Ensure box-design repo is cloned
```bash
if [ ! -d ~/box-design/.git ]; then
  echo "First time? Clone the repo:"
  echo "  git clone https://github.com/Kd699/box-design.git ~/box-design"
  exit 1
fi
```

### Step 2: Fetch and check for updates
```bash
cd ~/box-design && git fetch origin main
```

Compare local main to remote:
```bash
git log HEAD..origin/main --oneline
```

If no new commits, tell the user they're up to date and stop.

### Step 3: Show what's new (DRY RUN)

```bash
cd ~/box-design && git diff HEAD..origin/main --stat
```

Read `manifest.json` from remote to show JTBD descriptions:
```bash
git show origin/main:manifest.json 2>/dev/null
```

Display:
```
Updates available:

  skills/cr/SKILL.md (v2 -> v3): added wireframe gate before coding
  skills/new-skill/skill.md (NEW v1): what this skill does

Pull all? Or select? (all / 1 / 2 / 3)
```

### Step 4: Pull updates

If user says "all":
```bash
cd ~/box-design && git checkout main && git pull origin main
```

If user selects specific skills:
```bash
cd ~/box-design && git checkout origin/main -- skills/<skill-name>/
git checkout main
git merge origin/main --no-edit
```

### Step 5: Install to local skills
```bash
# Copy all skills from box-design to local
for skill_dir in ~/box-design/skills/*/; do
  skill=$(basename "$skill_dir")
  mkdir -p ~/.claude/skills/$skill
  cp "$skill_dir"*.md ~/.claude/skills/$skill/
done
```

### Step 6: Confirm

```
Pulled and installed:

  /cr (v3) -- Carmack-style code review
  /new-skill (v1) -- what it does

Skills are ready to use. Run any skill with /<skill-name>.
```
