package core

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// TestE2E_ChangeConflictResolveApplyArchive exercises an end-to-end workflow:
// 1) Seed a spec with initial content.
// 2) Seed a change with a bogus base fingerprint to trigger ErrDiverged on apply.
// 3) Run `change apply --id ...` and expect failure.
// 4) Run `change resolve --id ...` to refresh base fingerprint and re-apply successfully.
// 5) Verify the spec content reflects the change.
// 6) Run `change archive --id ...` and verify the change is archived.
func TestE2E_ChangeConflictResolveApplyArchive(t *testing.T) {
	t.Parallel()

	repoRoot := findRepoRoot(t)
	binPath := buildCLI(t, repoRoot)

	// Create a temporary workspace root; work with defaults .teamwerx/* by setting the CWD.
	ws := t.TempDir()
	specsDir := filepath.Join(ws, ".teamwerx", "specs")
	changesDir := filepath.Join(ws, ".teamwerx", "changes")

	// Seed spec: .teamwerx/specs/auth/spec.md
	authDir := filepath.Join(specsDir, "auth")
	mkdirAll(t, authDir)
	writeFile(t, filepath.Join(authDir, "spec.md"), []byte(`# Auth Spec

### Requirement: Login

Allow users to log in with email/password.

### Requirement: Logout

Allow users to log out.
`))

	// Seed change: .teamwerx/changes/CH-001/change.json
	chID := "CH-001"
	chDir := filepath.Join(changesDir, chID)
	mkdirAll(t, chDir)

	// Prepare a SpecDelta that modifies the "Login" requirement content,
	// but set BaseFingerprint to a bogus value to force ErrDiverged.
	type deltaOperation struct {
		Type        string `json:"type"`
		Requirement struct {
			ID      string `json:"id"`
			Title   string `json:"title"`
			Content string `json:"content"`
		} `json:"requirement"`
	}
	type specDelta struct {
		Domain          string           `json:"domain"`
		BaseFingerprint string           `json:"base_fingerprint,omitempty"`
		Operations      []deltaOperation `json:"operations"`
	}
	type change struct {
		ID         string      `json:"id"`
		Title      string      `json:"title"`
		Status     string      `json:"status"`
		CreatedAt  time.Time   `json:"created_at"`
		SpecDeltas []specDelta `json:"spec_deltas"`
	}

	modOp := deltaOperation{Type: "MODIFIED"}
	modOp.Requirement.ID = "login"
	modOp.Requirement.Title = "Login"
	modOp.Requirement.Content = "### Requirement: Login\n\nUpdated content with 2FA.\n\n"

	ch := change{
		ID:        chID,
		Title:     "Update Login requirement",
		Status:    "draft",
		CreatedAt: time.Now(),
		SpecDeltas: []specDelta{
			{
				Domain:          "auth",
				BaseFingerprint: "deadbeefcafebabe", // bogus -> will trigger ErrDiverged
				Operations:      []deltaOperation{modOp},
			},
		},
	}

	data, err := json.MarshalIndent(&ch, "", "  ")
	if err != nil {
		t.Fatalf("marshal change failed: %v", err)
	}
	writeFile(t, filepath.Join(chDir, "change.json"), append(data, '\n'))

	// 1) Attempt to apply -> expect failure (ErrDiverged)
	out, err := runCLIAllowFailWithDir(t, binPath, ws, []string{"change", "apply", "--id", chID})
	if err == nil {
		t.Fatalf("expected change apply to fail due to divergence, but it succeeded.\nOutput:\n%s", out)
	}
	if !strings.Contains(out, "failed to apply change") && !strings.Contains(strings.ToLower(out), "diverged") {
		t.Fatalf("unexpected error output for divergent apply:\n%s", out)
	}

	// 2) Resolve (non-interactive default => "Refresh base fingerprint and retry")
	out = runCLIWithDir(t, binPath, ws, []string{"change", "resolve", "--id", chID})
	if !strings.Contains(out, "Applied change CH-001") {
		t.Fatalf("change resolve did not apply successfully:\n%s", out)
	}

	// 3) Verify spec content includes updated text
	specBytes, rerr := os.ReadFile(filepath.Join(authDir, "spec.md"))
	if rerr != nil {
		t.Fatalf("failed to read spec after apply: %v", rerr)
	}
	if !strings.Contains(string(specBytes), "Updated content with 2FA.") {
		t.Fatalf("expected spec to contain updated content; got:\n%s", string(specBytes))
	}

	// 4) Archive the change
	out = runCLIWithDir(t, binPath, ws, []string{"change", "archive", "--id", chID})
	if !strings.Contains(out, "Archived change CH-001") {
		t.Fatalf("change archive unexpected output:\n%s", out)
	}

	// Verify change directory moved to .archive
	if _, statErr := os.Stat(filepath.Join(changesDir, chID)); statErr == nil || !os.IsNotExist(statErr) {
		t.Fatalf("expected %s to be removed after archive; stat err: %v", filepath.Join(changesDir, chID), statErr)
	}
	if _, statErr := os.Stat(filepath.Join(changesDir, ".archive", chID, "change.json")); statErr != nil {
		t.Fatalf("expected archived change.json to exist; stat err: %v", statErr)
	}
}
