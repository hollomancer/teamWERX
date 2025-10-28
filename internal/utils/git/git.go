package git

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	customerrors "github.com/teamwerx/teamwerx/internal/errors"
)

// IsRepo checks whether the given path is inside a Git work tree.
// Returns (true, nil) when inside a repository, (false, nil) when not,
// and a non-nil error on execution or IO errors.
func IsRepo(ctx context.Context, repoPath string) (bool, error) {
	if err := ensureDir(repoPath); err != nil {
		return false, err
	}
	out, err := runGit(ctx, repoPath, "rev-parse", "--is-inside-work-tree")
	if err != nil {
		// Not a repo is not necessarily an error in many callers; if git returns
		// a failure, treat as "not a repo" without a hard error, unless the error
		// is due to missing git binary or path IO issues (handled in runGit/ensureDir).
		// Here, for simplicity, return false with nil error if the command ran but failed.
		// Distinguish by checking if the error is a conflict (git command failure).
		if _, ok := err.(*customerrors.ErrConflict); ok {
			return false, nil
		}
		return false, err
	}
	return strings.TrimSpace(out) == "true", nil
}

// StatusPorcelain returns `git status --porcelain` output for the repository at repoPath.
// This is intended for machine parsing. It returns a typed error when the git invocation fails.
func StatusPorcelain(ctx context.Context, repoPath string) (string, error) {
	if err := ensureDir(repoPath); err != nil {
		return "", err
	}
	out, err := runGit(ctx, repoPath, "status", "--porcelain")
	if err != nil {
		return "", err
	}
	return out, nil
}

// Diff returns a unified diff string from the repository at repoPath.
// Behavior:
// - If both refA and refB are non-empty, returns diff of refA..refB (two-dot).
// - If only refA is non-empty, returns diff between refA and the working tree.
// - If neither is provided, returns diff for the working tree vs index/HEAD.
// - Optional pathspecs can be provided to limit the diff; they will be added after "--".
func Diff(ctx context.Context, repoPath, refA, refB string, pathspec ...string) (string, error) {
	if err := ensureDir(repoPath); err != nil {
		return "", err
	}
	args := []string{"diff"}
	switch {
	case refA != "" && refB != "":
		args = append(args, fmt.Sprintf("%s..%s", refA, refB))
	case refA != "":
		args = append(args, refA)
	}
	if len(pathspec) > 0 {
		args = append(args, "--")
		args = append(args, pathspec...)
	}
	out, err := runGit(ctx, repoPath, args...)
	if err != nil {
		return "", err
	}
	return out, nil
}

// Apply applies a patch to the repository at repoPath using `git apply`.
// - If threeWay is true, passes --3way to attempt a three-way merge.
// - If check is true, passes --check to validate without applying.
// The patch is provided as bytes and is piped to git's stdin.
func Apply(ctx context.Context, repoPath string, patch []byte, threeWay bool, check bool) error {
	if err := ensureDir(repoPath); err != nil {
		return err
	}
	args := []string{"apply"}
	if threeWay {
		args = append(args, "--3way")
	}
	if check {
		args = append(args, "--check")
	}
	_, err := runGitWithInput(ctx, repoPath, patch, args...)
	return err
}

// ApplyString convenience wrapper around Apply for string patches.
func ApplyString(ctx context.Context, repoPath string, patch string, threeWay bool, check bool) error {
	return Apply(ctx, repoPath, []byte(patch), threeWay, check)
}

// ensureDir verifies repoPath exists and is a directory; returns ErrNotFound otherwise.
func ensureDir(repoPath string) error {
	if repoPath == "" {
		return customerrors.NewErrNotFound("path", "(empty)")
	}
	info, err := os.Stat(repoPath)
	if err != nil {
		if os.IsNotExist(err) {
			return customerrors.NewErrNotFound("path", repoPath)
		}
		return err
	}
	if !info.IsDir() {
		return customerrors.NewErrConflict(fmt.Sprintf("path is not a directory: %s", repoPath))
	}
	return nil
}

// runGit executes a git command in the given repository directory and returns stdout as a string.
// On a non-zero exit code from git, it returns ErrConflict with stderr content.
func runGit(ctx context.Context, repoPath string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = repoPath

	// Avoid paging and keep output predictable
	cmd.Env = append(os.Environ(),
		"GIT_PAGER=cat",
		"LC_ALL=C",
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		// Distinguish missing binary vs git reported error
		if isExecNotFound(err) {
			return "", customerrors.NewErrNotFound("binary", "git")
		}
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return "", customerrors.NewErrConflict(fmt.Sprintf("git %s failed: %s", strings.Join(args, " "), msg))
	}

	return stdout.String(), nil
}

// runGitWithInput is like runGit but writes the given input to the subprocess stdin.
func runGitWithInput(ctx context.Context, repoPath string, input []byte, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = repoPath

	cmd.Env = append(os.Environ(),
		"GIT_PAGER=cat",
		"LC_ALL=C",
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	cmd.Stdin = bytes.NewReader(input)

	if err := cmd.Run(); err != nil {
		if isExecNotFound(err) {
			return "", customerrors.NewErrNotFound("binary", "git")
		}
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return "", customerrors.NewErrConflict(fmt.Sprintf("git %s failed: %s", strings.Join(args, " "), msg))
	}

	return stdout.String(), nil
}

func isExecNotFound(err error) bool {
	// On Unix-like systems, exec will return *exec.Error when executable is not found,
	// or *os.PathError wrapping ENOENT. We'll conservatively check command's error string.
	if err == nil {
		return false
	}
	// exec.Error for not found typically matches "executable file not found"
	if errorsAsExecErrorNotFound(err) {
		return true
	}
	// Fallback: generic message check
	msg := err.Error()
	return strings.Contains(strings.ToLower(msg), "executable file not found") ||
		strings.Contains(strings.ToLower(msg), "file not found") ||
		strings.Contains(strings.ToLower(msg), "no such file or directory")
}

// errorsAsExecErrorNotFound checks if err is *exec.Error with Err == exec.ErrNotFound.
// Isolated to avoid importing errors for As in case of minimal stdlib usage constraints.
func errorsAsExecErrorNotFound(err error) bool {
	// We avoid using errors.As to keep minimal imports; inspect string safely first.
	// If needed, this can be enhanced to use errors.As for robust type checks.
	if ee, ok := err.(*exec.Error); ok && ee.Err == exec.ErrNotFound {
		return true
	}
	// Also, *os.PathError with ENOENT can occur; rely on string in isExecNotFound fallback.
	return false
}

// RepoRoot returns the absolute repository root (top-level) by invoking
// `git rev-parse --show-toplevel`. Returns ErrNotFound if repoPath is not a Git repo.
func RepoRoot(ctx context.Context, repoPath string) (string, error) {
	if err := ensureDir(repoPath); err != nil {
		return "", err
	}
	out, err := runGit(ctx, repoPath, "rev-parse", "--show-toplevel")
	if err != nil {
		// If not a repo, convert to ErrNotFound for a better signal to callers.
		if _, ok := err.(*customerrors.ErrConflict); ok {
			return "", customerrors.NewErrNotFound("git-repo", repoPath)
		}
		return "", err
	}
	root := strings.TrimSpace(out)
	if root == "" {
		return "", customerrors.NewErrNotFound("git-repo", repoPath)
	}
	// Normalize to absolute path
	if !filepath.IsAbs(root) {
		abs, err := filepath.Abs(root)
		if err == nil {
			root = abs
		}
	}
	return root, nil
}
