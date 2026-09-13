#!/bin/bash
# name: git-state-summary
# description: Печатает в начале сессии worktree'ы, default branch и локальные feature-ветки — то, чего нет в нативном git-status харнесса.
# type: SessionStart
# matcher: —

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

echo ""
echo "=== GIT STATE ==="

if git rev-parse --git-dir 2>/dev/null | grep -qE '/\.git/worktrees/'; then
    echo "Is worktree: yes"
else
    echo "Is worktree: no"
fi

DEFAULT=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||')
echo "Default branch: ${DEFAULT:-(unknown -- run: git remote set-head origin --auto)}"

WORKTREES=$(git worktree list 2>/dev/null | tail -n +2)
if [ -n "$WORKTREES" ]; then
    echo "Other worktrees:"
    echo "$WORKTREES"
fi

LOCAL_BRANCHES=$(git branch 2>/dev/null | grep -vE '^\*?\s*(main|master|develop)$' | sed 's/^[* ]*//' | head -20)
if [ -n "$LOCAL_BRANCHES" ]; then
    echo "Local feature branches:"
    echo "$LOCAL_BRANCHES"
fi

echo "================="
echo ""
exit 0
