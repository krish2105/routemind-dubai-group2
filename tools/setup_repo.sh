#!/usr/bin/env bash
# Krishna runs this ONCE to create the shared GitHub repo, add all 6 teammates as collaborators and protect main.
#   1) fill team/collaborators.txt (GitHub usernames)   2) gh auth login   3) bash tools/setup_repo.sh [repo-name] [--public|--private]
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_NAME="${1:-routemind-dubai-group2}"
VIS="${2:---public}"   # public is recommended: Vercel's free plan blocks deploys of private repos pushed by other collaborators
command -v gh >/dev/null || { echo "Install the GitHub CLI first: https://cli.github.com  then run: gh auth login"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login"; exit 1; }
OWNER="$(gh api user -q .login)"
NAME="$(git config user.name || true)"; EMAIL="$(git config user.email || true)"
if [ -z "$NAME" ] || [ -z "$EMAIL" ]; then echo 'Run first: bash tools/setup_git.sh "Krishna Mathur" "your-github-email"'; exit 1; fi

[ -d .git ] || git init -q -b main
bash tools/setup_git.sh "$NAME" "$EMAIL"
python3 tools/make_codeowners.py || true
git add -A
git diff --cached --quiet || git commit -q -m "chore: initial project kit (docs, prompts, starter app, deck builder)"

if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
  echo "Repo $OWNER/$REPO_NAME already exists; pushing."
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"
  git push -u origin main
else
  gh repo create "$OWNER/$REPO_NAME" "$VIS" --source=. --remote=origin --push \
    --description "RouteMind Dubai: AI in Logistics & Route Optimization (Group 2, AI in Operations, SP Jain Dubai). Simulated prototype."
fi

echo "Adding collaborators..."
while IFS='|' read -r n u; do
  case "$n" in \#*|"") continue;; esac
  n="$(echo "$n" | xargs)"; u="$(echo "${u:-}" | xargs)"
  if [ -z "$u" ]; then echo "  skip $n (no GitHub username yet)"; continue; fi
  [ "$u" = "$OWNER" ] && continue
  if gh api -X PUT "repos/$OWNER/$REPO_NAME/collaborators/$u" -f permission=push >/dev/null 2>&1; then echo "  invited $n ($u)"; else echo "  FAILED to invite $n ($u): check the username"; fi
done < team/collaborators.txt

echo "Protecting main (pull request required, Krishna can still merge)..."
gh api -X PUT "repos/$OWNER/$REPO_NAME/branches/main/protection" --input - >/dev/null 2>&1 <<'JSON' && echo "  main protected" || echo "  could not protect main (needs admin rights or a public repo); do it in Settings > Branches"
{ "required_status_checks": null, "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null, "allow_force_pushes": false, "allow_deletions": false }
JSON

URL="https://github.com/$OWNER/$REPO_NAME"
echo
echo "Repo ready: $URL"
echo "Send the URL to the group. Each member runs:  bash tools/join_repo.sh $URL.git \"Their Name\" \"their-email\""
echo "Next for Krishna: import the repo in Vercel (Root Directory = web), see docs/00_TEAM_WORKFLOW.md section 5."
