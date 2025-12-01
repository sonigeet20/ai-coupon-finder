#!/usr/bin/env bash
set -euo pipefail

# Creates a git tag snapshot for the current clean HEAD so we can rollback later.
# Usage: ./scripts/snapshot.sh "Description for the snapshot"

if [ -z "${1-}" ]; then
  echo "Usage: $0 \"Snapshot description\""
  exit 1
fi

DESC="$1"
TIMESTAMP=$(date -u +"%Y%m%d%H%M%S")
TAG_NAME="snapshot-${TIMESTAMP}"

if [ -n "$(git status --porcelain)" ]; then
  echo "Your working tree contains uncommitted changes. Please commit them before creating a snapshot."
  git status --porcelain
  exit 1
fi

echo "Creating snapshot tag: ${TAG_NAME}"
git tag -a "${TAG_NAME}" -m "Snapshot: ${DESC}"

echo "Tag ${TAG_NAME} created locally."
echo "To push the tag to remote: git push origin ${TAG_NAME}"
echo "You can rollback to this snapshot with: npm run rollback -- ${TAG_NAME}"

exit 0
