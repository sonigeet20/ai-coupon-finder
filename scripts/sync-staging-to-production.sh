#!/usr/bin/env bash
set -euo pipefail

# Sync staging branch into production branch with snapshot and push to remote
# Usage: ./scripts/sync-staging-to-production.sh [--push] [--snapshot-msg "desc"] [--dry-run]
# Options:
#   --push       : Push production branch to origin after merging
#   --snapshot-msg: Custom snapshot message to use
#   --dry-run    : Show the commands without performing them

PUSH=false
DRY_RUN=false
SNAPSHOT_MSG="Auto snapshot before sync staging->production"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push)
      PUSH=true; shift;
      ;;
    --dry-run)
      DRY_RUN=true; shift;
      ;;
    --snapshot-msg)
      SNAPSHOT_MSG="$2"; shift; shift;
      ;;
    *)
      echo "Unknown option: $1"; exit 1;
      ;;
  esac
done

if [ -z "$(git rev-parse --is-inside-work-tree 2>/dev/null || true)" ]; then
  echo "Not a git repository. Initialize one first: ./scripts/init-repo.sh"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Please commit or stash changes before syncing";
  git status --porcelain
  exit 1
fi

echo "Creating a snapshot tag before merging..."
if [ "$DRY_RUN" = false ]; then
  bash ./scripts/snapshot.sh "$SNAPSHOT_MSG"
fi

if [ "$DRY_RUN" = true ]; then
  echo "DRY RUN: Would merge staging into production and optionally push to origin. Aborting."; exit 0;
fi

CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || true)
if [ -z "$CURRENT_REMOTE" ]; then
  echo "No remote named 'origin' found. Press enter to continue local-only merge or Ctrl-C to abort."; read -r
fi

echo "Fetching latest changes from origin (if any)..."
git fetch --all --prune

echo "Checking out production branch..."
git checkout production
git pull origin production 2>/dev/null || true

echo "Merging staging into production..."
git merge --no-ff staging -m "Merge staging into production"

if [ "$PUSH" = true ]; then
  echo "Pushing production to origin..."
  git push origin production
fi

echo "Sync complete. Production now contains changes merged from staging."

exit 0
