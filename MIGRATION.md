# Migration Guide: Node.js to Go CLI

This document explains the migration from the legacy Node.js CLI to the new Go-based `teamwerx` CLI, highlights what changed, and points you to the most relevant docs.

- If you’re new to the Go CLI, start with:
  - README sections: “Go CLI Installation” and “Go CLI Usage”
  - Command groups currently implemented: `spec`, `plan`, `discuss`, `change`, `migrate`, `completion`
- Legacy Node documentation has been archived in-repo:
  - See: `docs/archive/CONTRIBUTING-node.md`


## What changed (at a glance)

- Implementation
  - From a Node.js CLI to a single binary Go CLI (no Node runtime needed)
  - Robust Markdown AST-based spec parsing/merging
  - File-backed managers for specs, plans, changes, discussions

- Commands (Go CLI today)
  - spec: `list`, `show`
  - plan: `add`, `list`, `complete`, `show`
  - discuss: `add`, `list`
  - change: `list`, `apply`, `resolve`, `archive`
  - migrate: `check`
  - completion: `bash|zsh|fish|powershell`

- Defaults and paths
  - Specs: `.teamwerx/specs/<domain>/spec.md`
  - Goals:
    - Plan: `.teamwerx/goals/<goal-id>/plan.json` (JSON in Go CLI)
    - Discussion: `.teamwerx/goals/<goal-id>/discuss.md`
  - Changes: `.teamwerx/changes/<change-id>/change.json`
    - Archives to: `.teamwerx/changes/.archive/<id>/`
  - Non-interactive mode: set `TEAMWERX_CI=1` to skip prompts

- CI & Release
  - GitHub Actions for tests and lint
  - GoReleaser builds/publishes binaries on `v*` tags


## Where to find migration docs

- Go migration plan and checklist:
  - `docs/GO_MIGRATION_PLAN.md`
  - `docs/GO_MIGRATION_CHECKLIST_V2.md`

- Spec merging details:
  - `docs/spec-merging.md`

- Archived Node docs:
  - `docs/archive/CONTRIBUTING-node.md`


## Migrating an existing repository

1) Ensure your repo is a Git repository
- The CLI expects to run in a Git-initialized project.

2) Back up your existing `.teamwerx/` workspace
- Commit your workspace or copy it elsewhere before migrating.

3) Validate your workspace with the Go CLI
- Run:
  - `TEAMWERX_CI=1 teamwerx migrate check --specs-dir .teamwerx/specs --goals-dir .teamwerx/goals --changes-dir .teamwerx/changes`
- This checks parsability of specs, plans, discussions, and changes and reports any issues.

4) Plans: move to `plan.json` where applicable
- The Go CLI uses JSON for plans at `.teamwerx/goals/<goal-id>/plan.json`.
- If you previously used a Markdown plan (e.g., `plan.md`), you have options:
  - Create a fresh plan via `teamwerx plan add --goal <goal-id> "First task"`; this will create `plan.json` if missing.
  - Manually convert your existing plan content into JSON (see `internal/model.Plan` structure in code for fields).
- After you have `plan.json`, the `plan list`, `plan add`, `plan complete`, and `plan show` commands will work as expected.

5) Specs and changes: keep paths, ensure formats
- Specs remain Markdown at `.teamwerx/specs/<domain>/spec.md` (now parsed via Markdown AST).
- Changes should live at `.teamwerx/changes/<id>/change.json`.
  - Use `change list|apply|resolve|archive` with `--changes-dir` set if you use a non-default location.

6) Discussions
- Discussions remain a Markdown file per goal at `.teamwerx/goals/<goal-id>/discuss.md`.
- Use `discuss add` / `discuss list` to manage entries.

7) Non-interactive / CI mode
- Set `TEAMWERX_CI=1` to disable prompts in automation.


## Command differences vs. legacy Node

- Not implemented in the Go CLI (today):
  - `init`, `goal`, `use`, `research`, `status`, `execute`, `complete`, `reflect`, `summarize`, `charter`, `archive` (goal-level)
- Recommended approaches:
  - Initialization: run Go CLI commands directly; the CLI writes/updates workspace files as needed. Create `.teamwerx/` if you prefer explicit setup.
  - Goals: create a goal workspace directory under `.teamwerx/goals/` manually (e.g., `001-my-goal/`) and use `plan`/`discuss` commands with `--goal <goal-id>`.
  - Status: use `plan show --goal <goal-id>` for focused detail. For broader views or automation, add your own scripts reading `plan.json`.
  - Execution/complete: track implementation in your normal Git workflow; mark tasks via `plan complete`. For richer “execution” automation, add scripts around your plan/change flows.
  - Charter/summarize/reflect: maintain these as Markdown files under the goal workspace. The Go CLI may add these commands in the future; until then, manage manually.


## Practical examples

- List and show specs:
  - `TEAMWERX_CI=1 teamwerx spec list --specs-dir .teamwerx/specs`
  - `TEAMWERX_CI=1 teamwerx spec show auth --specs-dir .teamwerx/specs`

- Work with plans:
  - `TEAMWERX_CI=1 teamwerx plan add --goals-dir .teamwerx/goals --goal 001-demo "Set up CI"`
  - `TEAMWERX_CI=1 teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo`
  - `TEAMWERX_CI=1 teamwerx plan complete --goals-dir .teamwerx/goals --goal 001-demo --task T01`
  - `TEAMWERX_CI=1 teamwerx plan show --goals-dir .teamwerx/goals --goal 001-demo`

- Manage discussions:
  - `TEAMWERX_CI=1 teamwerx discuss add --goals-dir .teamwerx/goals --goal 001-demo "Initial planning notes"`
  - `TEAMWERX_CI=1 teamwerx discuss list --goals-dir .teamwerx/goals --goal 001-demo`

- Manage changes:
  - `TEAMWERX_CI=1 teamwerx change list --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
  - `TEAMWERX_CI=1 teamwerx change apply --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
  - `TEAMWERX_CI=1 teamwerx change resolve --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
  - `TEAMWERX_CI=1 teamwerx change archive --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`

- Validate migration:
  - `TEAMWERX_CI=1 teamwerx migrate check --specs-dir .teamwerx/specs --goals-dir .teamwerx/goals --changes-dir .teamwerx/changes`


## FAQ

- Where did the Node CLI go?
  - It’s been removed from `main`. Historical docs are in `docs/archive/CONTRIBUTING-node.md`.

- Can I still use my existing `.teamwerx/` workspace?
  - Yes. Ensure plans are in `plan.json` format and run `migrate check` to validate. Specs remain Markdown; discussions remain Markdown; changes are JSON.

- How do I operate non-interactively?
  - Set `TEAMWERX_CI=1` in your environment to disable prompts.

- How are releases produced?
  - Push a `v*` tag. GitHub Actions will build/test/lint and GoReleaser will publish assets automatically.


## References

- Go migration plan: `docs/GO_MIGRATION_PLAN.md`
- Go migration checklist: `docs/GO_MIGRATION_CHECKLIST_V2.md`
- Spec merging: `docs/spec-merging.md`
- Archived Node docs: `docs/archive/CONTRIBUTING-node.md`
