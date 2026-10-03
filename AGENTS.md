# Project workflow

These instructions reflect the owner's standing authorization for this project.

- Use only the two long-lived branches: `main` and `development`. Do not create feature, task, or temporary branches.
- Make all changes on `development`. Fetch and synchronize with `origin/development` before starting, preserving any existing local work.
- After completing a requested change, run appropriate validation, commit the relevant changes, and push `development` to `origin` without asking for confirmation. Do not include unrelated user changes or secrets.
- Merge into `main` only when the owner explicitly requests it. A request to make or push a change is not authorization to merge it into `main`.
- When a merge is requested, create or reuse a pull request from `development` to `main`, verify its changes and checks, and merge through GitHub. Never push directly to `main` or bypass its protection.
- Use a merge commit to retain shared history. After merging, update local `main`, synchronize `development` with `origin/main`, and push `development` without force. Keep both branches and finish on `development`.
- Never force-push or delete either long-lived branch. Keep GitHub's automatic deletion of merged branches disabled.

For development commands and the scope of the browser and performance checks, see `README.md`.
