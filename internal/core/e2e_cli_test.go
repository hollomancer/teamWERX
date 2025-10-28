package core

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
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
func buildCLI(t *testing.T, repoRoot string) string {
	t.Helper()
	binName := "teamwerx"
	if runtime.GOOS == "windows" {
		binName += ".exe"
	}
	binPath := filepath.Join(t.TempDir(), binName)

	cmd := exec.Command("go", "build", "-v", "-o", binPath, "./cmd/teamwerx")
	cmd.Dir = repoRoot
	cmd.Env = append(os.Environ(), "CGO_ENABLED=0") // speed up and avoid CGO issues in CI
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("failed to build CLI: %v\n%s", err, string(out))
	}
	return binPath
}

// runCLI executes the teamwerx binary with TEAMWERX_CI=1 and returns stdout+stderr.
func runCLI(t *testing.T, binPath string, args []string) string {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binPath, args...)
	cmd.Env = append(os.Environ(), "TEAMWERX_CI=1")
	out, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		t.Fatalf("command timed out: %s %v\n%s", binPath, args, string(out))
	}
	if err != nil {
		t.Fatalf("command failed: %s %v\nerr=%v\n%s", binPath, args, err, string(out))
	}
	return string(out)
}

// findRepoRoot walks up from CWD to find the directory containing go.mod.
func findRepoRoot(t *testing.T) string {
	t.Helper()
	wd, err := os.Getwd()
	if err != nil {
		t.Fatalf("Getwd failed: %v", err)
	}
	dir := wd
	for i := 0; i < 10; i++ { // sanity bound
		if fileExists(filepath.Join(dir, "go.mod")) {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	t.Fatalf("could not find repo root from %s", wd)
	return ""
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func mkdirAll(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatalf("MkdirAll(%s) failed: %v", path, err)
	}
}

func writeFile(t *testing.T, path string, data []byte) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("MkdirAll for file dir failed: %v", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatalf("WriteFile(%s) failed: %v", path, err)
	}
}
