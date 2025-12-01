#!/usr/bin/env bash
set -euo pipefail

# Create a snapshot tag pointing to current HEAD commit before a commit proceeds
# This should be used in a pre-commit hook to capture the repository state before any new commit

COMMIT_MSG="Autosnapshot before commit"
if [ -n "${1-}" ]; then
  COMMIT_MSG="$1"
fi

TIMESTAMP=$(date -u +"%Y%m%d%H%M%S")
TAG_NAME="snapshot-precommit-${TIMESTAMP}"

HEAD_EXISTS=$(git rev-parse --verify HEAD 2>/dev/null || echo "no")
if [ "$HEAD_EXISTS" = "no" ]; then
  # Repository has no commits yet; create initial snapshot from the index
  echo "No HEAD commit. Creating snapshot tag on commit index after first commit will be applied."
  # Don't tag; do nothing for now
  exit 0
fi

echo "Creating pre-commit snapshot tag: ${TAG_NAME} for current HEAD"
git tag -a "${TAG_NAME}" -m "${COMMIT_MSG}"
echo "Pre-commit snapshot tag created: ${TAG_NAME}"
echo "Tip: push snapshot to remote 'git push origin ${TAG_NAME}' to keep it in remote"

exit 0
