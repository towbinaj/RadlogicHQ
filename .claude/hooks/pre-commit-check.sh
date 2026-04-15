#!/usr/bin/env bash
#
# PreToolUse hook for Bash tool calls that invoke `git commit`.
#
# Purpose: enforce the test-first rule from docs/test.md section 10.
# Every `git commit` must pass `npm run test:run` and `npm run build`
# before the commit is allowed to proceed. If either check fails, the
# hook exits with status 2 (PreToolUse denial) and prints the tail of
# the failing output so the cause is visible without re-running.
#
# Triggered by: .claude/settings.json PreToolUse hook with matcher "Bash".
# Input: JSON on stdin with the Bash tool's {tool_input: {command: ...}}.
# Output: silent pass (exit 0) for non-commit commands or successful checks,
#         error message + tail to stderr (exit 2) on failure.
#
# Fast-path: non-commit Bash calls (git status, git diff, ls, npm run dev,
# etc.) return immediately without running any checks, so only actual
# commit invocations pay the ~2s cost of test+build.

set -euo pipefail

LOG=/tmp/claude-pre-commit.log
REPO=/home/user/RadlogicHQ

# --- 1. Read the Bash command from the hook's stdin JSON payload ---
CMD=$(jq -r '.tool_input.command // empty')
if [ -z "$CMD" ]; then
  # No command field — not a Bash tool call we recognize. Pass through.
  exit 0
fi

# --- 2. Fast-path: skip unless the command contains `git commit` ---
#
# Matches `git commit` as a whole word followed by space, end-of-string,
# or a quote character. Rejects `git commit-tree` (plumbing) because the
# `-` is not in the trailing character class.
#
# Covers:
#   git commit -m "msg"
#   git commit --amend
#   git add foo && git commit -m "..."
#   git commit -m "$(cat <<'EOF' ... EOF)"
#   bash -c 'git commit -m "msg"'
#
# Rejects:
#   git commit-tree ...
#   echo "git committed the change"  (no space/quote/EOS after "committed")
if ! printf '%s' "$CMD" | grep -qE "\bgit[[:space:]]+commit([[:space:]]|\$|[\"'])"; then
  exit 0
fi

# --- 3. Run the checks, logging full output to /tmp for post-hoc inspection ---
cd "$REPO"
: > "$LOG"  # truncate

run_check() {
  local label="$1"
  shift
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') :: $label ===" >> "$LOG"
  if ! "$@" >> "$LOG" 2>&1; then
    echo "" >&2
    echo "❌ Pre-commit check FAILED: $label" >&2
    echo "   Full log: $LOG" >&2
    echo "   --- last 20 lines ---" >&2
    tail -20 "$LOG" >&2
    echo "   ---" >&2
    echo "" >&2
    echo "Fix the failure above, then retry the commit. The test-first rule" >&2
    echo "in docs/test.md section 10 explains when tests are required." >&2
    exit 2
  fi
  echo "" >> "$LOG"
}

run_check "npm run test:run" npm run test:run
run_check "npm run build"    npm run build

# --- 4. All checks passed. Exit silently so the commit proceeds. ---
exit 0
