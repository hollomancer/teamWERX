package core

import (
	"path/filepath"
	"strings"
	"testing"
)

// TestE2E_CLI_Workflow builds the CLI and exercises a minimal end-to-end workflow
// against a temporary .teamwerx workspace:
// - Prepare a spec (auth) with requirements
// - spec show auth
// - plan add/list/complete/show
// - discuss add/list
func TestE2E_CLI_Workflow(t *testing.T) {
	t.Parallel()

	repoRoot := findRepoRoot(t)
	binPath := buildCLI(t, repoRoot)

	// Create a temporary workspace
	tmp := t.TempDir()
	specsDir := filepath.Join(tmp, ".teamwerx", "specs")
	goalsDir := filepath.Join(tmp, ".teamwerx", "goals")
	changesDir := filepath.Join(tmp, ".teamwerx", "changes")

	mkdirAll(t, specsDir)
	mkdirAll(t, goalsDir)
	mkdirAll(t, changesDir)

	// Seed a spec: .teamwerx/specs/auth/spec.md
	authDir := filepath.Join(specsDir, "auth")
	mkdirAll(t, authDir)
	writeFile(t, filepath.Join(authDir, "spec.md"), []byte(`# Auth Spec

### Requirement: User Authentication

Users must be able to authenticate with credentials.

### Requirement: User Logout

Users must be able to logout.
`))

	// 1) spec show auth
	out := runCLI(t, binPath, []string{
		"spec", "show", "auth",
		"--specs-dir", specsDir,
		"--goals-dir", goalsDir,
		"--changes-dir", changesDir,
	})
	if !strings.Contains(out, "Spec: auth") || !strings.Contains(out, "Requirements: 2") {
		t.Fatalf("spec show unexpected output:\n%s", out)
	}

	// 2) plan add
	out = runCLI(t, binPath, []string{
		"plan", "add",
		"--goals-dir", goalsDir,
		"--goal", "001-demo",
		"Set up CI",
	})
	if !strings.Contains(out, "Added task to goal 001-demo") {
		t.Fatalf("plan add unexpected output:\n%s", out)
	}

	// 3) plan list (should show T01 with pending status)
	out = runCLI(t, binPath, []string{
		"plan", "list",
		"--goals-dir", goalsDir,
		"--goal", "001-demo",
	})
	if !strings.Contains(out, "T01") || !strings.Contains(out, "Set up CI") {
		t.Fatalf("plan list missing expected task:\n%s", out)
	}

	// 4) plan complete T01
	out = runCLI(t, binPath, []string{
		"plan", "complete",
		"--goals-dir", goalsDir,
		"--goal", "001-demo",
		"--task", "T01",
	})
	if !strings.Contains(out, "Marked task T01 as completed") {
		t.Fatalf("plan complete unexpected output:\n%s", out)
	}

	// 5) plan show (verify completed)
	out = runCLI(t, binPath, []string{
		"plan", "show",
		"--goals-dir", goalsDir,
		"--goal", "001-demo",
	})
	if !strings.Contains(out, "Plan for goal 001-demo") || !strings.Contains(out, "[completed] Set up CI") {
		t.Fatalf("plan show unexpected output:\n%s", out)
	}

	// 6) discuss add/list
	out = runCLI(t, binPath, []string{
		"discuss", "add",
		"--goals-dir", goalsDir,
		"--goal", "001-demo",
		"Planning looks good",
	})
	if !strings.Contains(out, "Added discussion entry") {
		t.Fatalf("discuss add unexpected output:\n%s", out)
	}

	out = runCLI(t, binPath, []string{
		"discuss", "list",
		"--goals-dir", goalsDir,
		"--goal", "001-demo",
	})
	if !strings.Contains(out, "Found 1 discussion entrie(s) for goal 001-demo") ||
		!strings.Contains(out, "Planning looks good") {
		t.Fatalf("discuss list unexpected output:\n%s", out)
	}
}

// buildCLI builds the CLI binary and returns its absolute path.

// runCLI executes the teamwerx binary with TEAMWERX_CI=1 and returns stdout+stderr.

// findRepoRoot walks up from CWD to find the directory containing go.mod.
