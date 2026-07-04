#!/bin/sh
# Install the /plan → /build authoring harness for each agent host.
# Claude Code + opencode: no install (they scan .claude/skills/ on clone).
# Codex: symlink the two skill dirs into $CODEX_HOME/skills/ (verified discovered
# via `codex debug prompt-input`). Re-runnable / idempotent.
set -eu

# Absolute path to this repo (the dir containing this script).
REPO=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)

echo "Authoring harness install — repo: $REPO"

# --- Node preflight (the /build exit gate needs it) ---
if ! command -v node >/dev/null 2>&1; then
  echo "WARN: 'node' not found on PATH — the /build exit gate (.claude/lib/) will not run until Node is installed."
fi

# --- Claude Code / opencode: no-op ---
echo "Claude Code: skills work on clone (auto-discovers .claude/skills/). No install needed."
echo "opencode:    skills work on clone (scans .claude/skills/). No install needed."
if command -v opencode >/dev/null 2>&1; then
  echo "             verify with: opencode debug skill"
fi

# --- Codex: symlink into $CODEX_HOME/skills ---
CODEX_HOME=${CODEX_HOME:-$HOME/.codex}
# strip any trailing slash
CODEX_HOME=$(printf '%s' "$CODEX_HOME" | sed 's:/*$::')
SKILLS_DIR="$CODEX_HOME/skills"
mkdir -p "$SKILLS_DIR"

link_one() {
  name=$1
  src="$REPO/.claude/skills/$name"
  dest="$SKILLS_DIR/$name"
  if [ -d "$dest" ] && [ ! -L "$dest" ]; then
    echo "Codex: skip '$name' — $dest is a real directory, not touching it."
    return 0
  fi
  if [ -L "$dest" ]; then
    current=$(readlink "$dest")
    if [ "$current" != "$src" ] && [ -e "$current" ]; then
      echo "Codex: skip '$name' — $dest already links elsewhere ($current)."
      return 0
    fi
    # dangling, or already ours: (re)point below.
  fi
  ln -sfn "$src" "$dest"
  echo "Codex: linked '$name' -> $src"
}

link_one plan
link_one build
echo "Codex: Restart Codex to load /plan and /build."
