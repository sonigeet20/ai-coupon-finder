#!/usr/bin/env bash
set -euo pipefail

echo "--- SSH & Git Diagnostic Script ---"

echo "1) Current user & OS"
uname -a
echo "User: $(whoami)"

echo "\n2) Check for SSH keys in ~/.ssh"
ls -la ~/.ssh || true

echo "\n3) Check ssh-agent identities"
if ! command -v ssh-add >/dev/null 2>&1; then
  echo "ssh-add not found"
else
  ssh-add -l || echo "No keys loaded into ssh-agent"
fi

echo "\n4) Check ~/.ssh/config (if present)"
if [ -f ~/.ssh/config ]; then
  echo "--- ~/.ssh/config ---"
  sed -n '1,200p' ~/.ssh/config
else
  echo "No ~/.ssh/config file found"
fi

echo "\n5) Check permissions of ~/.ssh directory and files"
ls -ld ~/.ssh || true
ls -la ~/.ssh || true

echo "\n6) Test SSH connection to GitHub (this runs ssh -T -vvv)
-- If interactive, reply yes to trust the host fingerprint if asked. Output will show keys tried by the client."
echo "(You may need to paste the output back to the helper if failure occurs.)"
echo "\n----- SSH Test output begins -----"
ssh -T -vvv git@github.com || true
echo "----- SSH Test output ends -----" 

echo "\n7) Display git remotes and branches (if repository exists)"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git remote -v
  git branch -a
else
  echo "Not a git repo. 'git init' is required."
fi

echo "\nDiagnostic script finished. If the SSH test failed, please copy the SSH test section above and paste it in the chat so I can analyze the keys attempted and the error reason."

exit 0
