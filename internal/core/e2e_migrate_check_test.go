package core

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// TestE2E_MigrateCheck_Success seeds a minimal .teamwerx workspace and verifies
// that `teamwerx migrate check` reports no issues and correct entity counts.
func TestE2E_MigrateCheck_Success(t *testing.T) {
	t.Parallel()

	repoRoot := findRepoRoot(t)
	binPath := buildCLI(t, repoRoot)

	// Workspace with default .teamwerx paths (command uses defaults when flags not provided)
	ws := t.TempDir()
	specsDir := filepath.Join(ws, ".teamwerx", "specs")
	goalsDir := filepath.Join(ws, ".teamwerx", "goals")
	changesDir := filepath.Join(ws, ".teamwerx", "changes")

	// Seed two spec domains with valid spec.md to exercise spec counting
	authDir := filepath.Join(specsDir, "auth")
	mkdirAll(t, authDir)
	writeFile(t, filepath.Join(authDir, "spec.md"), []byte(`# Auth Spec

### Requirement: Login

Users must be able to authenticate with credentials.

### Requirement: Logout

Users must be able to logout.
`))

	billingDir := filepath.Join(specsDir, "billing")
	mkdirAll(t, billingDir)
	writeFile(t, filepath.Join(billingDir, "spec.md"), []byte(`# Billing Spec

### Requirement: Payment

Handle customer payments securely.

### Requirement: Invoice

Generate invoices for completed orders.
`))

	// Seed a goal with a valid plan.json (PlanManager.Load is called and will error if missing)
	goalID := "001-demo"
	goalDir := filepath.Join(goalsDir, goalID)
	mkdirAll(t, goalDir)

	type planTask struct {
		ID     string `json:"id"`
		Title  string `json:"title"`
		Status string `json:"status"`
	}
	type plan struct {
		GoalID    string     `json:"goal_id"`
		Tasks     []planTask `json:"tasks"`
		UpdatedAt time.Time  `json:"updated_at"`
	}
	p := plan{
		GoalID: goalID,
		Tasks: []planTask{
			{ID: "T01", Title: "Set up CI", Status: "completed"},
		},
		UpdatedAt: time.Now(),
	}
	b, err := json.MarshalIndent(&p, "", "  ")
	if err != nil {
		t.Fatalf("marshal plan failed: %v", err)
	}
	writeFile(t, filepath.Join(goalDir, "plan.json"), append(b, '\n'))

	// Seed a discussion file (optional; Load will succeed even if file is missing)
	discuss := "" +
		"---\n" +
		"id: D01\n" +
		"type: discussion\n" +
		"timestamp: 2025-01-01T00:00:00Z\n" +
		"content: |-\n" +
		"  Initial plan discussion.\n" +
		"---\n"
	writeFile(t, filepath.Join(goalDir, "discuss.md"), []byte(discuss))

	// Seed a change with a valid minimal JSON to be counted by ListChanges
	changeID := "CH-100"
	changeDir := filepath.Join(changesDir, changeID)
	mkdirAll(t, changeDir)
	changeJSON := map[string]any{
		"id":          changeID,
		"title":       "Test Change",
		"status":      "draft",
		"spec_deltas": []any{},
	}
	cb, err := json.MarshalIndent(changeJSON, "", "  ")
	if err != nil {
		t.Fatalf("marshal change failed: %v", err)
	}
	writeFile(t, filepath.Join(changeDir, "change.json"), append(cb, '\n'))

	// Run migrate check using defaults in CWD
	out := runCLIWithDir(t, binPath, ws, []string{"migrate", "check"})

	// Validate output
	if !strings.Contains(out, "Migration compatibility check") {
		t.Fatalf("expected header in migrate check output, got:\n%s", out)
	}
	if !strings.Contains(out, "Specs:   2") {
		t.Fatalf("expected spec count 2, got:\n%s", out)
	}
	if !strings.Contains(out, "Goals:   1") {
		t.Fatalf("expected goal count 1, got:\n%s", out)
	}
	if !strings.Contains(out, "Changes: 1") {
		t.Fatalf("expected change count 1, got:\n%s", out)
	}
	if !strings.Contains(out, "No issues found. Data is compatible.") {
		t.Fatalf("expected success message, got:\n%s", out)
	}
}
