#!/usr/bin/env bash
set -euo pipefail

# Initialize local git repository (if necessary), create main/staging/production branches and optionally push to remote
# Usage:
#   ./scripts/init-repo.sh [--remote <git-remote-url>] [--branch-main <main-branch-name>]
# Example:
#   ./scripts/init-repo.sh --remote git@github.com:user/repo.git --branch-main main

REMOTE_URL=""
MAIN_BRANCH="main"
FORCE_PUSH=false

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --remote)
      REMOTE_URL="$2"
      shift; shift
      ;;
    --branch-main)
      MAIN_BRANCH="$2"
      shift; shift
      ;;
    --force)
      FORCE_PUSH=true; shift
      ;;
    *)
      shift
      ;;
  esac
done

if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
else
  echo "Git repository already initialized."
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Committing current changes..."
  git add -A
  git commit -m "chore: initial commit"
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD || echo "${MAIN_BRANCH}")
if [ "$CURRENT_BRANCH" != "$MAIN_BRANCH" ]; then
  echo "Creating/checking out main branch ${MAIN_BRANCH}"
  git checkout -B "$MAIN_BRANCH"
fi

echo "Creating staging and production branches from $MAIN_BRANCH"
git branch -f staging "$MAIN_BRANCH"
git branch -f production "$MAIN_BRANCH"

if [ -n "$REMOTE_URL" ]; then
  echo "Adding remote origin: $REMOTE_URL"
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REMOTE_URL"
  echo "Preparing to push branches to remote..."
  if [ "$FORCE_PUSH" = true ]; then
    echo "Force push enabled. This will force update remote branches (careful!)."
    git push -u origin "$MAIN_BRANCH" --force
    git push -u origin staging --force
    git push -u origin production --force
  else
    echo "Performing safe push. If branches already exist remotely, the push will fail and you must push manually or use --force"
    git push -u origin "$MAIN_BRANCH" || echo "Failed to push $MAIN_BRANCH; run 'git push origin $MAIN_BRANCH' and resolve if necessary."
    git push -u origin staging || echo "Failed to push staging; run 'git push origin staging' and resolve if necessary."
    git push -u origin production || echo "Failed to push production; run 'git push origin production' and resolve if necessary."
  fi
fi

echo "Init done. Branches created: $MAIN_BRANCH, staging, production"
echo "To push to remote later, use: git push -u origin <branch>"

exit 0
