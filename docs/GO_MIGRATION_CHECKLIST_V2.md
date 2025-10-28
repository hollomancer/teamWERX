# Go Migration Checklist 2.0

This checklist provides an actionable roadmap for migrating `teamwerx` from JavaScript to Go, focusing on creating a more robust, maintainable, and performant application.

### Phase 0: Foundation & Tooling (Week 0)

-   [ ] **Project Setup:** Initialize Go module (`go mod init`).
-   [ ] **Directory Structure:** Create the initial directory structure (`cmd/teamwerx`, `internal/core`, `internal/utils`, `internal/model`).
-   [ ] **Makefile:** Create a `Makefile` with essential targets:
    -   `make build`
    -   `make test`
    -   `make lint` (using `golangci-lint`)
    -   `make clean`
-   [ ] **CI Pipeline:** Configure a GitHub Actions workflow to run `make test` and `make lint` on every push to `main` and on all pull requests.
-   [ ] **Library Selection:** Choose, document, and test core third-party libraries:
    -   **CLI:** Cobra (`spf13/cobra`)
    -   **Styling:** `fatih/color` or similar.
    -   **Prompts:** `manifoldco/promptui` or `charmbracelet/bubbletea`.

### Phase 1: Core Data Models & Interfaces (Week 1)

*The goal of this phase is to define the architectural backbone before writing implementation logic.*

-   [ ] **Central Data Models:** In a new `internal/model` package, define the core `struct`s for all major entities:
    -   `Project` / `Workspace` (to hold the application's loaded state)
    -   `Goal`
    -   `Plan` & `Task`
    -   `Spec`, `Requirement`, `Scenario`
    -   `Change`, `SpecDelta`
    -   `DiscussionEntry`
-   [ ] **Manager Interfaces:** In the `internal/core` package, define the Go `interface` for each manager, specifying its public methods.
    -   `SpecManager`
    -   `PlanManager`
    -   `ChangeManager`
    -   `SpecMerger`
    -   `DiscussionManager`
-   [ ] **Custom Error Package:** Create an `internal/errors` package with typed errors (e.g., `ErrConflict`, `ErrNotFound`, `ErrDiverged`).

### Phase 2: The "Spec" Subsystem (Weeks 2-4)

*This is the most complex part of the migration. Tackling it early with a more robust approach is critical.*

-   [ ] **Markdown AST Library:** Research, select, and test a Go Markdown AST library (e.g., `yuin/goldmark`).
-   [ ] **Spec Parser/Serializer:**
    -   [ ] Implement a `SpecParser` that reads a `.md` file and populates the `model.Spec` struct, including the full AST of the content.
    -   [ ] Implement a `SpecSerializer` that writes a `model.Spec` struct (including its AST) back to a markdown file.
-   [ ] **`SpecManager` Implementation:** Implement the `SpecManager` interface using the new parser and serializer.
-   [ ] **`SpecMerger` Re-implementation:**
    -   [ ] Re-implement the merge logic (`_applyOperations`, `_autoMerge`) to operate on the Markdown AST, not raw text.
    -   [ ] Write comprehensive unit tests covering various merge and conflict scenarios. This is a critical checkpoint.

### Phase 3: Core Logic & Utilities (Weeks 5-7)

-   [ ] **Utility Implementation:** Port the JavaScript utilities to Go, ensuring they use the new custom error package.
    -   `internal/utils/file`
    -   `internal/utils/git`
    -   `internal/utils/prompt`
-   [ ] **PlanManager Implementation:** Implement the `PlanManager` interface. It should operate on the `Plan` struct within the central `Project` model.
-   [ ] **ChangeManager Implementation:** Implement the `ChangeManager` interface.
-   [ ] **Remaining Managers:** Implement all other core manager interfaces.
-   [ ] **Dependency Injection:** Ensure managers are instantiated correctly, receiving their dependencies (other managers) via the defined interfaces.

### Phase 4: CLI Command Layer (Weeks 8-10)

-   [ ] **Cobra Setup:** Structure the CLI using Cobra in the `cmd/teamwerx/` directory (`root.go`, `goal.go`, etc.).
-   [ ] **Command Implementation:** Implement each CLI command. The primary responsibility of each command function should be:
    1.  Load the central `Project` state.
    2.  Call the appropriate manager methods via their interfaces.
    3.  Render output to the user using the styling and prompt utilities.
-   [ ] **Port `changes resolve`:** Re-implement the interactive conflict resolution command.
-   [ ] **Shell Completions:** Generate and test shell completion scripts using Cobra's built-in functionality.

### Phase 5: Testing, Documentation & Release (Weeks 11-12)

-   [ ] **Integration Tests:** Write end-to-end tests that execute the compiled binary and verify entire user workflows (e.g., `propose` -> `archive` with a merge conflict).
-   [ ] **Data Migration:** Write and test a script or command to ensure any existing `.teamwerx` data is compatible.
-   [ ] **Documentation:**
    -   [ ] Update `README.md` with new installation and usage instructions for the Go binary.
    -   [ ] Update all other developer and user documentation.
-   [ ] **Release Automation:** Configure `goreleaser` to build and release binaries for multiple platforms (macOS, Linux, Windows) and create GitHub releases.
-   [ ] **Beta Testing:** Perform manual beta testing of the compiled binaries on all target platforms.
