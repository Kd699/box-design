# /box-sync-push - Push Skills to box-design

Push new or updated skills from your local `~/.claude/skills/` to the shared `box-design` repo. Creates a PR for review before merging to main.

## Instructions

### Step 1: Ensure box-design repo is cloned
```bash
if [ ! -d ~/box-design/.git ]; then
  echo "box-design repo not found. Clone it first:"
  echo "  git clone https://github.com/Kd699/box-design.git ~/box-design"
  exit 1
fi
cd ~/box-design && git checkout main && git pull origin main
```

### Step 2: Copy skills from local to repo

Only copy skills that already exist in box-design OR that the user explicitly names:
```bash
# Update existing skills
for skill_dir in ~/box-design/skills/*/; do
  skill=$(basename "$skill_dir")
  if [ -d ~/.claude/skills/$skill ]; then
    cp ~/.claude/skills/$skill/*.md ~/box-design/skills/$skill/
  fi
done
```

If the user wants to ADD a new skill, copy it:
```bash
mkdir -p ~/box-design/skills/<skill-name>
cp ~/.claude/skills/<skill-name>/*.md ~/box-design/skills/<skill-name>/
```

### Step 3: Detect changes
```bash
cd ~/box-design && git diff --name-status HEAD
```

If no changes, tell the user everything is in sync and stop.

### Step 4: Show what changed

For each changed file, describe what changed in one sentence (the JTBD).

Display:
```
Changes to push:

  skills/cr/SKILL.md (modified): added wireframe gate before coding
  skills/my-new-skill/skill.md (NEW): one-sentence description

Push these? (y/n)
```

### Step 5: Update manifest.json

Read existing `manifest.json`. For each changed skill:
- If skill exists: increment version
- If new: set version to 1
- Add/update JTBD description

### Step 6: Create branch and PR

```bash
cd ~/box-design
BRANCH="skill-update-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH"
git add -A
git commit -m "skill update: $(date +%Y-%m-%d)

Changes:
<list of changes with JTBD>"
git push -u origin HEAD
gh pr create --title "Skill update $(date +%Y-%m-%d)" --body "$(cat <<'EOF'
## Changes
<list of changed skills with JTBD descriptions>

## How to pull
After merge, teammates run `/box-sync-pull` to get the latest.
EOF
)"
```

### Step 7: Show summary
```
PR created: <url>
Branch: <branch-name>

Once merged, teammates can run /box-sync-pull to get these updates.
```
