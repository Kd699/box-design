#!/bin/bash
# box-design installer
# Copies all shared skills to your local ~/.claude/skills/ directory

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"
SKILLS_DST="$HOME/.claude/skills"

echo "box-design: installing skills..."
echo ""

# Ensure target exists
mkdir -p "$SKILLS_DST"

count=0
for skill_dir in "$SKILLS_SRC"/*/; do
  skill=$(basename "$skill_dir")
  mkdir -p "$SKILLS_DST/$skill"
  cp "$skill_dir"*.md "$SKILLS_DST/$skill/"
  echo "  /$skill"
  count=$((count + 1))
done

echo ""
echo "Done. $count skills installed to $SKILLS_DST"
echo ""
echo "Usage: type /<skill-name> in Claude Code (e.g. /cr, /ask, /spidey)"
echo "Update: run /box-sync-pull to get the latest from the team"
