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

## Current architecture — authoritative

- Read `docs/PROJECT-STATE.md` before making product, theme, renderer, settings, popup, or test-harness changes. It is the authoritative architecture record; if an older experiment conflicts with it, `docs/PROJECT-STATE.md` wins.
- Surface has one unified purpose-and-paint renderer for all three themes. `src/contextual.js` is its historical internal filename, not an optional renderer mode.
- The A/B/C suite, semantic-only path, Dark Reader adapter and dependency, correction toggle, stylesheet bridge, renderer setting, and multi-renderer test matrix were deliberately removed in version 0.2.0.
- Do not restore a removed renderer, add a parallel rendering path, or resume A/B/C comparisons unless the owner explicitly changes this direction.
- Improve the unified pipeline from concrete failures. Prefer general recognition, preservation, contrast, lifecycle, or theme-treatment improvements with regression coverage.
- Verified host role corrections apply automatically and remain narrowly scoped. Do not add appearance patches as a substitute for general recognition.
- Experiments 01–09 and `docs/FINDINGS.md` are historical evidence only. Their instructions, recommendations, “current” statements, and next steps are superseded by `docs/PROJECT-STATE.md`, the current section of `docs/LEARNINGS.md`, and Experiment 10.

## Shared experiment memory

- Before theme or renderer work, read `docs/PROJECT-STATE.md`, the current section of `docs/LEARNINGS.md`, and Experiment 10. Consult older experiment records only when their evidence is relevant; do not use them as current implementation instructions.
- Record the owner's observations as observations, and distinguish hypotheses, measured behavior, visual review, and unresolved questions.
- For each iteration, update `docs/LEARNINGS.md` with the tested pages or interface types, what changed in the unified path, evidence, failures, and the next bounded iteration. Keep useful failures; do not overwrite history with the latest success.
- Prefer reusable semantic/structural role recognition over host-specific appearance patches. Record correction-free failures before adding a site correction.
- Preserve concise evidence in `docs/` when it informs future decisions; `test-results/` is ignored and is not durable shared memory.
