#!/usr/bin/env bash
# For team members who received the kit as a zip:
#   unzip, cd into the folder, then:  bash tools/join_repo.sh <repo-url> "Your Name" "your-github-email"
# Connects this folder to the shared GitHub repo (Krishna creates it with tools/setup_repo.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
url="${1:?Usage: bash tools/join_repo.sh <repo-url> \"Your Name\" \"email\"}"
name="${2:?missing name}"
email="${3:?missing email}"
[ -d .git ] || git init -q -b main
git remote remove origin 2>/dev/null || true
git remote add origin "$url"
git fetch origin
git reset --hard origin/main   # makes this folder identical to the shared repo (it is a fresh copy, nothing to lose)
git checkout -B main origin/main
bash tools/setup_git.sh "$name" "$email"
echo
echo "Next: cd web && npm install; cd ../deck && npm install"
echo "Then start Claude Code in this folder and paste the line from your prompt file in prompts/members/."
