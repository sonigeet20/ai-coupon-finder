Rollback & Snapshot Guide
=========================

Use snapshots to create safe recovery points before making changes or deploying new features. Use rollback to revert to a snapshot or revert commits safely.

Create a snapshot (must be a clean working tree):

```bash
# Provide a human description for the snapshot
npm run snapshot -- "Preparing to add coupon localization feature"
```

The script will create a tag named `snapshot-<timestamp>` for the current HEAD. Push it to the remote if you want it available in CI or other machines:

```bash
git push origin snapshot-20251202123456
```

Rollback to a snapshot (two methods):

1) Reset (destructive, but simple & effective locally):

```bash
npm run rollback -- snapshot-20251202123456
```

This does a `git reset --hard` to the target commit and also creates a `backup-before-rollback-<timestamp>` branch for your previous HEAD so you can recover if necessary.

2) Revert (safe, creates revert commits to undo changes):

```bash
npm run rollback -- snapshot-20251202123456 --method revert
```

This will create commit(s) that revert changes made after the snapshot; it's the safer choice if you're working with colleagues or have pushed changes to remote.

Notes & best practices
----------------------
- Always commit or stash local changes before creating a snapshot.
- Prefer using `snapshot` before each feature branch or significant change.
 - When using the staging/production workflow, always create a snapshot before syncing staging to production.
- For collaborative workflows, prefer `revert` to preserve history and avoid forced pushes.
- If you're using CI/CD, extend snapshot/tag creation to your pipeline for release snapshots.

If you'd like, I can now set up a simple git pre-commit or pre-push hook to automatically create a snapshot tag for you before a push, or integrate this snapshot step into a small workflow tool that prompts you for a snapshot description before generating a tag.

To enable automatic snapshot hooks, run:

```bash
npm install
npm run prepare
```
