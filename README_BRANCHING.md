Branching & Deployment Workflow
===============================

This project uses a manual staging->production flow with a snapshot created prior to any change.

Branches:
- `main` — default main branch
- `staging` — integration branch for new features and QA
- `production` — deployment branch for production releases

Workflow:
1. Create a snapshot before major work: `npm run snapshot -- "Description of work"`
2. Create a feature branch from `staging` and develop your feature.
3. When ready, merge your feature branch into `staging` (open a PR if using GitHub/GitHub flows).
4. Test and validate on staging.
5. When ready to release, run: `npm run sync:prod -- --push` (this will snapshot, merge `staging` into `production`, and push to `origin`)

Notes:
- The toolchain expects a `git` repository; if you don't have one, use `npm run branch:init -- --remote <git-remote-url>` to initialize and push branches to a remote.
 - The toolchain expects a `git` repository; if you don't have one, use `npm run branch:init -- --remote <git-remote-url>` to initialize and push branches to a remote.
	 - By default, `init-repo.sh` does safe pushes (no --force). If you need to force push for initial setup, append `--force`:
		 ```bash
		 npm run branch:init -- --remote 'git@github.com:geet-sketch/coupon-finder.git' --branch-main main --force
		 ```
- If you are using GitHub, set branch protection rules for `production` and optionally `staging` in your repo settings.
- Consider enabling required checks (CI/PR review) before allowing merges to `production`.
- To enable automatic snapshots on pre-commit and pre-push, install dependencies then run:
-
	```bash
	npm install
	npm run prepare
	```

	This sets up Husky hooks that create tags prior to commit/push as a safety net.
