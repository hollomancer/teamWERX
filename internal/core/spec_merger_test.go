package core

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/teamwerx/teamwerx/internal/model"
)

// createTempDir is provided by the shared test helper in testutil.go.

// Helper to write a spec.md file for a domain.
func writeSpecFile(t *testing.T, baseDir, domain, content string) {
	t.Helper()
	dir := filepath.Join(baseDir, domain)
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	path := filepath.Join(dir, "spec.md")
	if err := ioutil.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("write spec failed: %v", err)
	}
}

// Read file contents helper.
func readFile(t *testing.T, path string) string {
	t.Helper()
	b, err := ioutil.ReadFile(path)
	if err != nil {
		t.Fatalf("read file failed: %v", err)
	}
	return string(b)
}

func TestSpecMerger_AddRequirementToEmptySpec(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "add-domain"

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	// Delta: add a single requirement
	req := model.Requirement{
		ID:      "new-feature",
		Title:   "New Feature",
		Content: "### Requirement: New Feature\n\nThe system shall support a new feature.\n\n",
	}
	delta := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{
				Type:        "ADDED",
				Requirement: req,
			},
		},
	}

	if err := merger.Merge(delta); err != nil {
		t.Fatalf("Merge failed: %v", err)
	}

	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := readFile(t, specPath)

	if !strings.Contains(content, "Requirement: New Feature") {
		t.Errorf("expected file to contain new requirement heading, got:\n%s", content)
	}
	if !strings.Contains(content, "The system shall support a new feature.") {
		t.Errorf("expected file to contain requirement body, got:\n%s", content)
	}

	// Also verify that SpecManager can parse it back and find the requirement.
	parsed, err := specManager.ReadSpec(domain)
	if err != nil {
		t.Fatalf("ReadSpec failed: %v", err)
	}
	found := false
	for _, r := range parsed.Requirements {
		if r.Title == "New Feature" || r.ID == "new-feature" {
			found = true
		}
	}
	if !found {
		t.Errorf("parsed spec did not contain the added requirement; parsed requirements: %+v", parsed.Requirements)
	}
}

func TestSpecMerger_RemoveRequirement(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "remove-domain"

	// Create a spec with two requirements
	orig := `# Domain Spec

### Requirement: First Req

First requirement body.

### Requirement: Password Reset

Users can reset passwords.

`
	writeSpecFile(t, baseDir, domain, orig)

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	// Remove the "Password Reset" requirement (ID should be "password-reset")
	req := model.Requirement{ID: "password-reset", Title: "Password Reset"}
	delta := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{
				Type:        "REMOVED",
				Requirement: req,
			},
		},
	}

	if err := merger.Merge(delta); err != nil {
		t.Fatalf("Merge failed: %v", err)
	}

	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := readFile(t, specPath)

	if strings.Contains(content, "Password Reset") || strings.Contains(content, "Users can reset passwords.") {
		t.Errorf("expected removed requirement to be absent, got:\n%s", content)
	}
	// Ensure the other requirement remains
	if !strings.Contains(content, "First Req") || !strings.Contains(content, "First requirement body.") {
		t.Errorf("expected other requirement to remain, got:\n%s", content)
	}
}

func TestSpecMerger_ModifyRequirement(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "modify-domain"

	// Initial spec with one requirement
	orig := `# Domain Spec

### Requirement: Login

Allow users to log in with email/password.

`
	writeSpecFile(t, baseDir, domain, orig)

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	// Modify the "Login" requirement content
	modReq := model.Requirement{
		ID:      "login",
		Title:   "Login",
		Content: "### Requirement: Login\n\nAllow users to authenticate using email/password and 2FA.\n\n",
	}
	delta := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{
				Type:        "MODIFIED",
				Requirement: modReq,
			},
		},
	}

	if err := merger.Merge(delta); err != nil {
		t.Fatalf("Merge (modify) failed: %v", err)
	}

	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := readFile(t, specPath)

	if !strings.Contains(content, "2FA") {
		t.Errorf("expected modified content to be present (2FA), got:\n%s", content)
	}
	// Ensure old text is gone
	if strings.Contains(content, "Allow users to log in with email/password.") {
		t.Errorf("expected old content to be replaced, got:\n%s", content)
	}
}

func TestSpecMerger_UnknownOperationReturnsError(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "bad-op-domain"

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	req := model.Requirement{
		ID:      "whatever",
		Title:   "Whatever",
		Content: "### Requirement: Whatever\n\nSome content.\n\n",
	}
	delta := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{
				Type:        "RENAME", // unsupported
				Requirement: req,
			},
		},
	}

	err := merger.Merge(delta)
	if err == nil {
		t.Fatalf("expected error for unknown operation type, got nil")
	}
	// error content isn't strictly specified; ensure it's non-empty
	if err.Error() == "" {
		t.Fatalf("expected non-empty error for unknown operation")
	}
}
