# Contributing to teamWERX

Thank you for contributing to the teamWERX CLI. This guide covers development setup, code style, testing, and release procedures.

---

## Table of contents

- Requirements
- Project layout
- Build, test, lint
- Running the CLI (local workspace)
- Writing tests (unit + E2E)
- Adding commands (Cobra)
- Spec/merge architecture
- Error handling
- Data migration and validation
- CI and releases (GoReleaser)
- Pull requests and code review
- Troubleshooting

---

## Requirements

- Go 1.18+
- macOS, Linux, or Windows
- golangci-lint (installed locally)
  - Install: `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest`
- A GitHub account with rights to push branches and open PRs for this repo

Optional but recommended:
- A modern editor with Go tooling (VS Code + Go extension, JetBrains GoLand, etc.)

---

## Project layout

- `cmd/teamwerx` — Cobra CLI entrypoint and command definitions
- `internal/core` — Core domain logic and manager interfaces/implementations
  - `app.go` — App DI container that wires managers with configured base directories
  - `spec_parser.go`, `spec_serializer.go`, `spec_manager.go`, `spec_merger.go`
  - `plan_manager.go`, `change_manager.go`, `discussion_manager.go`
  - `*_test.go` — unit tests and E2E tests (see Testing below)
- `internal/model` — Data models (Spec, Requirement, Plan, Task, Change, SpecDelta, Project, Scenario, DiscussionEntry)
- `internal/errors` — Typed errors (ErrNotFound, ErrConflict, ErrDiverged)
- `internal/utils` — Cross-cutting helpers
  - `file/` — filesystem utilities (atomic writes, copy/move, etc.)
  - `git/` — minimal Git wrappers (diff/status/apply)
  - `prompt/` — interactive helpers, CI/TTY detection
- `.github/workflows` — CI and release workflows
  - `go-ci.yml` — builds, tests, lints
  - `release.yml` — GoReleaser-based release workflow
- `.goreleaser.yaml` — multi-platform build and packaging for releases
- `README.md` — user-facing CLI docs (install, usage)
- `MIGRATION.md` — Node → Go migration guide

Workspace conventions (default paths; override with flags):
- Specs: `.teamwerx/specs/<domain>/spec.md`
- Goals:
  - Plan: `.teamwerx/goals/<goal-id>/plan.json`
  - Discussion: `.teamwerx/goals/<goal-id>/discuss.md`
- Changes: `.teamwerx/changes/<change-id>/change.json` (archives to `.teamwerx/changes/.archive/<id>/`)

---

## Build, test, lint

Common tasks are available via the Makefile:

- Build the CLI:
  - `make build`
  - or: `go build -v -o teamwerx ./cmd/teamwerx`
- Run all tests:
  - `make test`
  - or: `go test -v ./...`
- Lint (requires `golangci-lint` installed):
  - `make lint`
  - or: `golangci-lint run`
- Clean:
  - `make clean`

Run a single test file or pattern:
- `go test -v ./internal/core -run TestSpecParser_`

Run only E2E tests by pattern:
- `go test -v ./internal/core -run E2E_`

---

## Running the CLI (local workspace)

By default, the CLI operates relative to your current directory using `.teamwerx/*`.

Examples (non-interactive mode):
- Set `TEAMWERX_CI=1` to skip prompts and use defaults.

Specs:
- `TEAMWERX_CI=1 ./teamwerx spec list --specs-dir .teamwerx/specs`
- `TEAMWERX_CI=1 ./teamwerx spec show --specs-dir .teamwerx/specs auth`

Plans:
- `TEAMWERX_CI=1 ./teamwerx plan add --goals-dir .teamwerx/goals --goal 001-demo "Set up CI"`
- `TEAMWERX_CI=1 ./teamwerx plan list --goals-dir .teamwerx/goals --goal 001-demo`
- `TEAMWERX_CI=1 ./teamwerx plan complete --goals-dir .teamwerx/goals --goal 001-demo --task T01`
- `TEAMWERX_CI=1 ./teamwerx plan show --goals-dir .teamwerx/goals --goal 001-demo`

Discussions:
- `TEAMWERX_CI=1 ./teamwerx discuss add --goals-dir .teamwerx/goals --goal 001-demo "Initial notes"`
- `TEAMWERX_CI=1 ./teamwerx discuss list --goals-dir .teamwerx/goals --goal 001-demo`

Changes:
- `TEAMWERX_CI=1 ./teamwerx change list --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
- `TEAMWERX_CI=1 ./teamwerx change apply --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
- `TEAMWERX_CI=1 ./teamwerx change resolve --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`
- `TEAMWERX_CI=1 ./teamwerx change archive --id CH-123 --changes-dir .teamwerx/changes --specs-dir .teamwerx/specs`

Migration check:
- `TEAMWERX_CI=1 ./teamwerx migrate check --specs-dir .teamwerx/specs --goals-dir .teamwerx/goals --changes-dir .teamwerx/changes`

Shell completions:
- `./teamwerx completion bash|zsh|fish|powershell`

---

## Writing tests (unit + E2E)

Unit tests live alongside implementations (`*_test.go`).

E2E tests execute the compiled CLI against a temporary workspace:
- Files: `internal/core/e2e_*.go`
- Patterns:
  - Minimal CLI flow: spec/show → plan add/list/complete/show → discuss add/list
  - Changes: divergence → resolve → re-apply → archive
  - Multi-domain/multi-delta apply
  - Migration check

Tips:
- Keep E2E tests fast (disable CGO for builds; small workspaces).
- Use `TEAMWERX_CI=1` in test runners to avoid hanging on prompts.
- Use timeouts for subprocess execution and assert output.

---

## Adding commands (Cobra)

- Location: `cmd/teamwerx`
- Pattern:
  - Define a `*cobra.Command`, add flags, then `RunE` to perform work.
  - Use the DI container to wire managers:

    ```go
    app, err := core.NewApp(core.AppOptions{
      SpecsDir: specsBaseDir,
      GoalsDir: goalsBaseDir,
      ChangesDir: changesBaseDir,
    })
    if err != nil { return err }
    // Use app.SpecManager, app.PlanManager, etc.
    ```

- Prompting:
  - Use `internal/utils/prompt` (Confirm/Select/Input)
  - Respect CI: `prompt.IsInteractive()` and `TEAMWERX_CI` detection are built-in

Ensure new commands:
- Have meaningful error messages
- Respect base-dir flags
- Include unit or E2E coverage where appropriate
- Update `README.md` and `MIGRATION.md` if user-facing

---

## Spec/merge architecture

- Parser/serializer: `goldmark` Markdown AST
- SpecManager:
  - Read/Write/List specs, compute content fingerprints
- SpecMerger:
  - Operates on AST to find/replace requirement blocks by ID (kebab-case of title)
  - Deltas support `ADDED`, `MODIFIED`, `REMOVED` operations
  - Divergence:
    - If `SpecDelta.BaseFingerprint` differs from current spec fingerprint, returns `ErrDiverged`
    - The `change resolve` command lets users refresh base fingerprints or skip domains

---

## Error handling

Use typed errors from `internal/errors`:
- `ErrNotFound` — missing resource (spec, plan, change, path)
- `ErrConflict` — invalid state or conflict (also used for git invocation failures)
- `ErrDiverged` — base fingerprint mismatch

CLI commands should:
- Wrap errors with context
- Distinguish resource-missing vs. genuine failures
- Favor user-facing messages that suggest next steps (e.g., run `change resolve`)

---

## Data migration and validation

- Use `teamwerx migrate check` to validate an existing `.teamwerx` workspace:
  - Parses specs
  - Loads plans and discussion logs
  - Lists and reads changes
  - Reports counts and any issues; returns non-zero on failure

When editing data formats:
- Maintain backward compatibility where possible
- Provide migration utilities for breaking changes
- Update E2E tests to cover the scenarios

---

## CI and releases (GoReleaser)

CI:
- `go-ci.yml` runs `make test` and `make lint` on pushes/PRs to `main` and `go`
- Keep tests fast and deterministic

Releases:
- `.goreleaser.yaml` builds for macOS/Linux/Windows (amd64/arm64), archives, and checksums
- Automatic publishing on tags (`v*`) via `release.yml`

Release workflow:
1) Ensure CI is green on `main`
2) Choose a version (SemVer: `vX.Y.Z`)
3) Tag and push:
   - `git tag vX.Y.Z`
   - `git push origin vX.Y.Z`
4) GitHub Actions will:
   - Build
   - Run tests and lint
   - Create/publish release artifacts
5) Verify assets across macOS/Linux/Windows

Pre-releases:
- Use `vX.Y.Z-rcN` for RCs; prerelease detection is automatic in GoReleaser

---

## Pull requests and code review

Branching:
- Create feature branches from `main`
- Keep PRs small, focused, and reviewable

Coding conventions:
- `gofmt` / `gofmt -s` (your editor should format on save)
- `golangci-lint` must pass locally and in CI
- Prefer clear, explicit code (avoid over-abstracting until duplicated 2–3+ times)
- Keep functions small and testable

Tests:
- Include unit tests for core logic
- Add/update E2E tests for user-visible flows or complex integrations
- Ensure `make test` is green before opening a PR

Docs:
- Update `README.md` for user-facing changes
- Update `MIGRATION.md` when changing command parity or behavior
- Add comments/docstrings for exported items and complex logic

Commit messages:
- Use imperative mood (“Add …”, “Fix …”, “Refactor …”)
- Reference issues when applicable (e.g., “Fixes #123”)

Reviews:
- Address feedback promptly
- Prefer follow-up PRs for larger refactors unrelated to the current change

---

## Troubleshooting

- golangci-lint fails locally:
  - Ensure it’s installed and up-to-date: `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest`
  - Run `golangci-lint run` to see detailed messages
- E2E tests hang:
  - Confirm `TEAMWERX_CI=1` is set in test helpers or environment
  - Make sure your test workspaces are temporary and isolated
- Spec merging issues:
  - Use `change resolve` to refresh base fingerprints
  - Add a focused unit test around the requirement block you’re modifying
- Release errors:
  - Ensure the tag is `v*`
  - Confirm Actions runners completed all jobs and logs show GoReleaser succeeded
  - If needed, rerun workflow with `workflow_dispatch`

---

If you have any questions, open an issue or start a discussion. Thank you for helping improve teamWERX!
