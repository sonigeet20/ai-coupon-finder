#!/usr/bin/env bash
set -euo pipefail

# Rollback utility
# Usage: ./scripts/rollback.sh <tag-or-commit-sha> [--method reset|revert]
# Default method: reset (hardly resets the working tree to the target commit). Use 'revert' to generate a revert commit instead.

if [ -z "${1-}" ]; then
  echo "Usage: $0 <tag-or-commit-sha> [--method reset|revert]"
  exit 1
fi

TARGET=$1
METHOD="reset"
if [ "${2-}" = "--method" ] && [ "${3-}" = "revert" ]; then
  METHOD="revert"
fi

# Ensure we have a clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Please commit or stash changes before rolling back."
  git status --porcelain
  exit 1
fi

TIMESTAMP=$(date -u +"%Y%m%d%H%M%S")
BACKUP_BRANCH="backup-before-rollback-${TIMESTAMP}"

echo "Creating backup branch ${BACKUP_BRANCH} from current HEAD..."
git branch "${BACKUP_BRANCH}"

if [ "${METHOD}" = "reset" ]; then
  echo "Resetting working tree to ${TARGET} (hard reset)..."
  git reset --hard "${TARGET}"
  echo "You are now at ${TARGET}. If you want to restore your previous state, simply checkout ${BACKUP_BRANCH}."
  echo "If you pushed the changes to remote, you will need to force push or revert on remote as needed." 
else
  echo "Reverting commits between ${TARGET}..HEAD (creates revert commits)."
  # Find commits between target and HEAD, and revert them in reverse order.
  COMMITS=$(git rev-list --no-merges ${TARGET}..HEAD)
  if [ -z "$COMMITS" ]; then
    echo "No commits to revert. You're already at target or there are no commits in the range."
    exit 0
  fi
  for c in $COMMITS; do
    echo "Reverting commit $c..."
    git revert --no-edit $c || {
      echo "Revert failed for commit $c. Resolve conflicts, then run 'git revert --continue' or checkout ${BACKUP_BRANCH} to cancel.";
      exit 1
    }
  done
  echo "Revert commits created. Push to remote to finalize: git push"
fi

echo "Rollback complete. Helpful hints:"
echo " - You have a backup branch: ${BACKUP_BRANCH}";
echo " - If you want to go back to the backup, run: git checkout ${BACKUP_BRANCH}";
echo " - If you used --method reset and want to restore remote, you may need to force push: git push --force origin HEAD"

exit 0
