package core

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"time"

	ce "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
)

// fakeSpecMerger is a test double for SpecMerger that records merge calls.
type fakeSpecMerger struct {
	merges []*model.SpecDelta
	err    error
}

func (f *fakeSpecMerger) Merge(delta *model.SpecDelta) error {
	f.merges = append(f.merges, delta)
	return f.err
}

// writeChangeJSON writes raw JSON into <baseDir>/<changeID>/change.json creating directories.
func writeChangeJSON(t *testing.T, baseDir, changeID string, raw map[string]any) string {
	t.Helper()
	dir := filepath.Join(baseDir, changeID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	path := filepath.Join(dir, "change.json")
	data, err := json.Marshal(raw)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}
	if err := os.WriteFile(path, append(data, '\n'), 0o644); err != nil {
		t.Fatalf("write file failed: %v", err)
	}
	return path
}

func TestChangeManager_ReadChange_NotFound(t *testing.T) {
	baseDir := createTempDir(t)
	cm := NewChangeManager(baseDir, nil, nil)

	_, err := cm.ReadChange("CH-404")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var nf *ce.ErrNotFound
	if !errors.As(err, &nf) {
		t.Fatalf("expected ErrNotFound, got %T: %v", err, err)
	}
}

func TestChangeManager_ReadChange_Success_InferID(t *testing.T) {
	baseDir := createTempDir(t)
	changeID := "CH-001"

	// Write change.json with no "id" to test inference from directory
	writeChangeJSON(t, baseDir, changeID, map[string]any{
		"title":       "Add payment requirement",
		"status":      "draft",
		"spec_deltas": []map[string]any{},
	})

	cm := NewChangeManager(baseDir, nil, nil)
	ch, err := cm.ReadChange(changeID)
	if err != nil {
		t.Fatalf("ReadChange failed: %v", err)
	}
	if ch.ID != changeID {
		t.Fatalf("expected inferred ID %q, got %q", changeID, ch.ID)
	}
	if ch.Title != "Add payment requirement" {
		t.Fatalf("expected title to be preserved, got %q", ch.Title)
	}
}

func TestChangeManager_ListChanges_FiltersInvalid(t *testing.T) {
	baseDir := createTempDir(t)

	// Valid change
	writeChangeJSON(t, baseDir, "CH-001", map[string]any{"title": "Valid", "status": "draft"})

	// Invalid JSON
	dirBad := filepath.Join(baseDir, "CH-002")
	_ = os.MkdirAll(dirBad, 0o755)
	_ = os.WriteFile(filepath.Join(dirBad, "change.json"), []byte("{not-json"), 0o644)

	// No change.json
	_ = os.MkdirAll(filepath.Join(baseDir, "CH-003"), 0o755)

	// Archive folder should be ignored
	_ = os.MkdirAll(filepath.Join(baseDir, ".archive", "CH-004"), 0o755)

	cm := NewChangeManager(baseDir, nil, nil)
	changes, err := cm.ListChanges()
	if err != nil {
		t.Fatalf("ListChanges failed: %v", err)
	}

	if len(changes) != 1 {
		t.Fatalf("expected 1 valid change, got %d", len(changes))
	}
	if changes[0].ID != "CH-001" {
		t.Fatalf("expected change ID 'CH-001', got %q", changes[0].ID)
	}
}

func TestChangeManager_ApplyChange_Success_WritesAndMerges(t *testing.T) {
	baseDir := createTempDir(t)

	// Fake merger to capture merge operations
	fm := &fakeSpecMerger{}
	cm := NewChangeManager(baseDir, nil, fm)

	delta1 := model.SpecDelta{
		Domain: "auth",
		Operations: []model.DeltaOperation{
			{Type: "ADDED", Requirement: model.Requirement{ID: "login", Title: "Login"}},
		},
	}
	delta2 := model.SpecDelta{
		Domain: "billing",
		Operations: []model.DeltaOperation{
			{Type: "MODIFIED", Requirement: model.Requirement{ID: "payment", Title: "Payment"}},
		},
	}

	ch := &model.Change{
		ID:         "CH-apply-001",
		Title:      "Auth+Billing updates",
		Status:     "draft",
		SpecDeltas: []model.SpecDelta{delta1, delta2},
	}

	// Apply should call merges and persist the change with updated status/createdAt
	if err := cm.ApplyChange(ch); err != nil {
		t.Fatalf("ApplyChange failed: %v", err)
	}

	// Validate merges called
	if got := len(fm.merges); got != 2 {
		t.Fatalf("expected 2 merges, got %d", got)
	}
	if fm.merges[0].Domain != "auth" || fm.merges[1].Domain != "billing" {
		t.Fatalf("unexpected merge domains: %+v", fm.merges)
	}

	// Validate status and CreatedAt set
	if ch.Status != "applied" {
		t.Fatalf("expected status 'applied', got %q", ch.Status)
	}
	if ch.CreatedAt.IsZero() {
		t.Fatalf("expected CreatedAt to be set")
	}

	// Validate file persisted and readable
	path := filepath.Join(baseDir, ch.ID, "change.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read persisted change: %v", err)
	}
	var onDisk model.Change
	if err := json.Unmarshal(data, &onDisk); err != nil {
		t.Fatalf("failed to unmarshal persisted change: %v", err)
	}
	if onDisk.ID != ch.ID || onDisk.Status != "applied" {
		t.Fatalf("unexpected on-disk change: %+v", onDisk)
	}
}

func TestChangeManager_ApplyChange_MergerError_DoesNotPersist(t *testing.T) {
	baseDir := createTempDir(t)

	fm := &fakeSpecMerger{err: errors.New("merge failed")}
	cm := NewChangeManager(baseDir, nil, fm)

	ch := &model.Change{
		ID:    "CH-apply-err",
		Title: "Bad change",
		SpecDeltas: []model.SpecDelta{
			{Domain: "auth", Operations: []model.DeltaOperation{{Type: "ADDED", Requirement: model.Requirement{ID: "x"}}}},
		},
	}
	err := cm.ApplyChange(ch)
	if err == nil {
		t.Fatal("expected error from merger, got nil")
	}

	// Should not have persisted change file on failure
	path := filepath.Join(baseDir, ch.ID, "change.json")
	if _, statErr := os.Stat(path); statErr == nil || !os.IsNotExist(statErr) {
		t.Fatalf("expected no file at %s after failed apply, stat err: %v", path, statErr)
	}
}

func TestChangeManager_ArchiveChange_Success_MovesDirectory(t *testing.T) {
	baseDir := createTempDir(t)
	cm := NewChangeManager(baseDir, nil, nil)

	ch := &model.Change{
		ID:         "CH-archive-001",
		Title:      "To archive",
		Status:     "applied",
		CreatedAt:  time.Now(),
		SpecDeltas: []model.SpecDelta{},
	}

	// Create change directory and file
	if err := os.MkdirAll(filepath.Join(baseDir, ch.ID), 0o755); err != nil {
		t.Fatalf("mkdir change dir failed: %v", err)
	}
	b, _ := json.MarshalIndent(ch, "", "  ")
	if err := os.WriteFile(filepath.Join(baseDir, ch.ID, "change.json"), append(b, '\n'), 0o644); err != nil {
		t.Fatalf("write change.json failed: %v", err)
	}

	// Archive
	if err := cm.ArchiveChange(ch); err != nil {
		t.Fatalf("ArchiveChange failed: %v", err)
	}

	// Original should be gone
	if _, err := os.Stat(filepath.Join(baseDir, ch.ID)); !os.IsNotExist(err) {
		t.Fatalf("expected original dir removed, stat err: %v", err)
	}

	// Archived file should exist
	archivedPath := filepath.Join(baseDir, ".archive", ch.ID, "change.json")
	if _, err := os.Stat(archivedPath); err != nil {
		t.Fatalf("expected archived change.json, stat err: %v", err)
	}
}

func TestChangeManager_InputValidationErrors(t *testing.T) {
	baseDir := createTempDir(t)
	cm := NewChangeManager(baseDir, nil, nil)

	// ReadChange empty ID
	if _, err := cm.ReadChange(""); err == nil {
		t.Fatal("expected error for empty change ID")
	} else {
		var conf *ce.ErrConflict
		if !errors.As(err, &conf) {
			t.Fatalf("expected ErrConflict, got %T: %v", err, err)
		}
	}

	// ApplyChange nil change
	if err := cm.ApplyChange(nil); err == nil {
		t.Fatal("expected error for nil change")
	} else {
		var conf *ce.ErrConflict
		if !errors.As(err, &conf) {
			t.Fatalf("expected ErrConflict, got %T: %v", err, err)
		}
	}

	// ApplyChange empty ID
	if err := cm.ApplyChange(&model.Change{}); err == nil {
		t.Fatal("expected error for empty change ID")
	} else {
		var conf *ce.ErrConflict
		if !errors.As(err, &conf) {
			t.Fatalf("expected ErrConflict, got %T: %v", err, err)
		}
	}

	// ArchiveChange nil change
	if err := cm.ArchiveChange(nil); err == nil {
		t.Fatal("expected error for nil change")
	} else {
		var conf *ce.ErrConflict
		if !errors.As(err, &conf) {
			t.Fatalf("expected ErrConflict, got %T: %v", err, err)
		}
	}

	// ArchiveChange empty ID
	if err := cm.ArchiveChange(&model.Change{}); err == nil {
		t.Fatal("expected error for empty change ID")
	} else {
		var conf *ce.ErrConflict
		if !errors.As(err, &conf) {
			t.Fatalf("expected ErrConflict, got %T: %v", err, err)
		}
	}
}
