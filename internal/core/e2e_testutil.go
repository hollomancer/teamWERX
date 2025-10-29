package core

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
	"time"
)

// buildCLI builds the CLI binary and returns its absolute path.
// It sets CGO_ENABLED=0 for faster, more portable builds in CI/e2e contexts.
func buildCLI(t *testing.T, repoRoot string) string {
	t.Helper()
	binName := "teamwerx"
	if runtime.GOOS == "windows" {
		binName += ".exe"
	}
	binPath := filepath.Join(t.TempDir(), binName)

	cmd := exec.Command("go", "build", "-v", "-o", binPath, "./cmd/teamwerx")
	cmd.Dir = repoRoot
	cmd.Env = append(os.Environ(), "CGO_ENABLED=0")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("failed to build CLI: %v\n%s", err, string(out))
	}
	return binPath
}

// runCLI executes the teamwerx binary with TEAMWERX_CI=1 and returns stdout+stderr.
// Fails the test on non-zero exit or timeout.
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

// runCLIWithDir executes the teamwerx binary with TEAMWERX_CI=1 in a given working directory.
// Fails the test on non-zero exit or timeout.
func runCLIWithDir(t *testing.T, binPath, dir string, args []string) string {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binPath, args...)
	cmd.Dir = dir
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

// runCLIAllowFailWithDir executes the CLI and returns output and error without failing the test.
// Useful for flows where failure is expected and handled by the test.
func runCLIAllowFailWithDir(t *testing.T, binPath, dir string, args []string) (string, error) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, binPath, args...)
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), "TEAMWERX_CI=1")
	out, err := cmd.CombinedOutput()
	if ctx.Err() == context.DeadlineExceeded {
		t.Fatalf("command timed out: %s %v\n%s", binPath, args, string(out))
	}
	return string(out), err
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

// fileExists reports whether the given path exists (file or directory).
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// mkdirAll creates a directory and all necessary parents with 0755 permissions.
func mkdirAll(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatalf("MkdirAll(%s) failed: %v", path, err)
	}
}

// writeFile writes a file, ensuring the parent directory exists, with 0644 permissions.
func writeFile(t *testing.T, path string, data []byte) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("MkdirAll for file dir failed: %v", err)
	}
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatalf("WriteFile(%s) failed: %v", path, err)
	}
}
