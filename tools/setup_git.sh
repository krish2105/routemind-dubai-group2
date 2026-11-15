#!/usr/bin/env bash
# Run once on each member's machine:  bash tools/setup_git.sh "Your Name" "your-github-email@example.com"
# Sets YOUR identity (so the contribution graph shows YOU), installs the guards that keep AI attribution out of commits.
set -euo pipefail
cd "$(dirname "$0")/.."
name="${1:-$(git config user.name || true)}"
email="${2:-$(git config user.email || true)}"
if [ -z "$name" ] || [ -z "$email" ]; then
  echo 'Usage: bash tools/setup_git.sh "Your Name" "your-github-email@example.com"'; exit 1
fi
if echo "$name $email" | grep -qiE 'anthropic|claude'; then
  echo "Use YOUR OWN name and GitHub email, not an AI identity."; exit 1
fi
git config user.name "$name"
git config user.email "$email"
git config core.hooksPath .githooks
git config pull.rebase true
git config push.autoSetupRemote true
chmod +x .githooks/* tools/*.sh 2>/dev/null || true
echo "Git ready: $name <$email>. Guards installed (commit-msg strips AI attribution, pre-push blocks it)."
echo "Tip: use the email linked to your GitHub account, otherwise GitHub will not credit your commits to you."
