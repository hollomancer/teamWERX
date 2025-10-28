package core

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/teamwerx/teamwerx/internal/model"
)

// TestConcurrentModifications_LastWriteWins verifies behavior when two modifications
// are applied to the same requirement sequentially. The current merger implementation
// treats a MODIFIED on a missing requirement as an add, and otherwise performs a replace.
// This test ensures that applying two modifications sequentially results in the
// second modification being present (last-write-wins).
func TestSpecMerger_ConcurrentModifications_LastWriteWins(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "concurrent-mods"

	// Start with a spec containing the requirement.
	orig := `# Domain Spec

### Requirement: Payment
Initial payment requirement body.

`
	writeSpecFile(t, baseDir, domain, orig)

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	// First modification: add 2FA mention
	mod1 := model.Requirement{
		ID:      "payment",
		Title:   "Payment",
		Content: "### Requirement: Payment\n\nInitial payment requirement body.\n\nNote: support 2FA for payments.\n\n",
	}
	delta1 := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "MODIFIED", Requirement: mod1},
		},
	}

	if err := merger.Merge(delta1); err != nil {
		t.Fatalf("first merge failed: %v", err)
	}

	// Second modification: change wording and remove 2FA
	mod2 := model.Requirement{
		ID:      "payment",
		Title:   "Payment",
		Content: "### Requirement: Payment\n\nPayment workflow must be idempotent and audited.\n\n",
	}
	delta2 := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "MODIFIED", Requirement: mod2},
		},
	}

	if err := merger.Merge(delta2); err != nil {
		t.Fatalf("second merge failed: %v", err)
	}

	// Verify last change is present and earlier modification content no longer appears.
	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := readFile(t, specPath)

	if !strings.Contains(content, "Payment workflow must be idempotent and audited.") {
		t.Fatalf("expected final modification to be present, got:\n%s", content)
	}
	if strings.Contains(content, "support 2FA for payments") {
		t.Fatalf("did not expect earlier modification content to remain, got:\n%s", content)
	}
}

// TestDeleteThenModify and TestModifyThenDelete exercise the delete vs modify race.
// According to current semantics:
// - A MODIFIED on a missing requirement behaves like ADD.
// - Removing a requirement that exists will remove it.
// We assert the merger behaves accordingly in both orders.
func TestSpecMerger_DeleteThenModify(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "delete-then-modify"

	orig := `# Domain Spec

### Requirement: Sync
Ensure services sync state periodically.

`
	writeSpecFile(t, baseDir, domain, orig)

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	// Remove the requirement
	removeReq := model.Requirement{ID: "sync", Title: "Sync"}
	deltaRemove := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "REMOVED", Requirement: removeReq},
		},
	}
	if err := merger.Merge(deltaRemove); err != nil {
		t.Fatalf("remove merge failed: %v", err)
	}

	// Now modify the same requirement -> should behave like ADD (recreate)
	modReq := model.Requirement{
		ID:      "sync",
		Title:   "Sync",
		Content: "### Requirement: Sync\n\nEnsure services sync state periodically and report metrics.\n\n",
	}
	deltaModify := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "MODIFIED", Requirement: modReq},
		},
	}
	if err := merger.Merge(deltaModify); err != nil {
		t.Fatalf("modify-after-remove merge failed: %v", err)
	}

	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := readFile(t, specPath)

	if !strings.Contains(content, "report metrics") {
		t.Fatalf("expected modified (added-back) requirement content to be present, got:\n%s", content)
	}
}

func TestSpecMerger_ModifyThenDelete(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "modify-then-delete"

	orig := `# Domain Spec

### Requirement: Export
Export data in JSON.

`
	writeSpecFile(t, baseDir, domain, orig)

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	// First modify
	modReq := model.Requirement{
		ID:      "export",
		Title:   "Export",
		Content: "### Requirement: Export\n\nExport data in JSON and CSV formats.\n\n",
	}
	deltaModify := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "MODIFIED", Requirement: modReq},
		},
	}
	if err := merger.Merge(deltaModify); err != nil {
		t.Fatalf("modify merge failed: %v", err)
	}

	// Then remove
	removeReq := model.Requirement{ID: "export", Title: "Export"}
	deltaRemove := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "REMOVED", Requirement: removeReq},
		},
	}
	if err := merger.Merge(deltaRemove); err != nil {
		t.Fatalf("remove merge failed: %v", err)
	}

	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := readFile(t, specPath)

	// After remove, requirement content should be absent.
	if strings.Contains(content, "Export data in JSON and CSV formats.") || strings.Contains(content, "Export data in JSON.") {
		t.Fatalf("expected requirement to be removed, got:\n%s", content)
	}
}

// TestNonOverlappingAdds ensures adding multiple distinct requirements does not clobber one another.
func TestSpecMerger_NonOverlappingAdds(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "non-overlap-adds"

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	reqA := model.Requirement{
		ID:      "alpha-feature",
		Title:   "Alpha Feature",
		Content: "### Requirement: Alpha Feature\n\nAlpha details.\n\n",
	}
	reqB := model.Requirement{
		ID:      "beta-feature",
		Title:   "Beta Feature",
		Content: "### Requirement: Beta Feature\n\nBeta details.\n\n",
	}
	delta := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "ADDED", Requirement: reqA},
			{Type: "ADDED", Requirement: reqB},
		},
	}
	if err := merger.Merge(delta); err != nil {
		t.Fatalf("merge for non-overlapping adds failed: %v", err)
	}

	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := readFile(t, specPath)

	if !strings.Contains(content, "Alpha Feature") || !strings.Contains(content, "Beta Feature") {
		t.Fatalf("expected both added requirements to appear, got:\n%s", content)
	}
}

// TestRemoveNonExistent ensures removing a requirement that doesn't exist is a no-op and does not error.
func TestSpecMerger_RemoveNonExistent_Noop(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "remove-nonexistent"

	specManager := NewSpecManager(baseDir)
	merger := NewSpecMerger(specManager)

	// Start empty; attempt to remove a requirement that doesn't exist.
	removeReq := model.Requirement{ID: "ghost-req", Title: "Ghost Req"}
	delta := &model.SpecDelta{
		Domain: domain,
		Operations: []model.DeltaOperation{
			{Type: "REMOVED", Requirement: removeReq},
		},
	}
	// Should not return an error.
	if err := merger.Merge(delta); err != nil {
		t.Fatalf("expected no error when removing non-existent requirement, got: %v", err)
	}

	// File should either not exist or be empty.
	specPath := filepath.Join(baseDir, domain, "spec.md")
	content := ""
	// reading may panic on missing file; readFile helper will fail the test if absent, so check file existence.
	if _, err := filepath.Abs(specPath); err == nil {
		// If created, read content
		// Use a safe check: attempt to read file by delegating to readFile only if file exists.
		// But to keep things simple and consistent with other tests, call merger.ReadSpec() to confirm absence.
		_, err := specManager.ReadSpec(domain)
		if err == nil {
			// If it exists, ensure content is empty or whitespace-only.
			content = readFile(t, specPath)
			if strings.TrimSpace(content) != "" {
				t.Fatalf("expected empty content after removing non-existent requirement, got:\n%s", content)
			}
		}
	}
}
