# Resume prompt (any member, any time Claude Code restarts or loses context)

Paste this, replacing NAME with your first name (Gagandeep, Yash, Atharva, Krishna, Advait, Karan, Harsh):

```
I am NAME. Resume my work on RouteMind Dubai. Do this in order:
1. Read prompts/00_COMMON_RULES.md and prompts/members/<my file>.md (the file whose name contains NAME).
2. Run: git status; git pull --rebase origin main; git log --oneline -15; git branch --show-current.
3. Read docs/status.md and my docs/prompt_logs/NAME.md and docs/contributions/NAME.md.
4. Tick which items of section 9 (Definition of done) in my prompt file are already true by checking the real files and by running: cd web && npm run check.
5. Tell me in 6 lines: done, in progress, next, blockers, open PRs, what I should paste in the group chat.
6. Then continue with the next unticked item. Same rules as always: only my files, my branch feat/<name>-<topic>, no AI attribution in commits or PRs, numbers only from the engine or docs/frozen_results.json, log my prompts.
```
