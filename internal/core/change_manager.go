package core

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
	fileutil "github.com/teamwerx/teamwerx/internal/utils/file"
)

// changeManager is a file-backed implementation of ChangeManager.
// It persists each change under: <baseDir>/<changeID>/change.json
// Archives are moved to:          <baseDir>/.archive/<changeID>/
type changeManager struct {
	baseDir     string
	specManager SpecManager
	specMerger  SpecMerger
}

// NewChangeManager constructs a new file-backed ChangeManager.
// - baseDir should point to the directory where change folders live (e.g., ".teamwerx/changes").
// - specManager provides read/write access to specs.
// - specMerger applies SpecDelta operations to specs.
func NewChangeManager(baseDir string, specManager SpecManager, specMerger SpecMerger) ChangeManager {
	return &changeManager{
		baseDir:     baseDir,
		specManager: specManager,
		specMerger:  specMerger,
	}
}

func (m *changeManager) ReadChange(changeID string) (*model.Change, error) {
	if changeID == "" {
		return nil, custom_errors.NewErrConflict("changeID cannot be empty")
	}
	path := m.changeFile(changeID)
	b, err := fileutil.ReadFile(path)
	if err != nil {
		// Translate file not found to resource not found with "change"
		if _, ok := err.(*custom_errors.ErrNotFound); ok {
			return nil, custom_errors.NewErrNotFound("change", changeID)
		}
		return nil, err
	}
	var ch model.Change
	if err := json.Unmarshal(b, &ch); err != nil {
		return nil, fmt.Errorf("failed to parse change file '%s': %w", path, err)
	}
	// Ensure ID is set (older/hand-authored files might omit it)
	if ch.ID == "" {
		ch.ID = changeID
	}
	return &ch, nil
}

func (m *changeManager) ListChanges() ([]*model.Change, error) {
	entries, err := os.ReadDir(m.baseDir)
	if err != nil {
		// If base directory doesn't exist, treat as empty list rather than error.
		if os.IsNotExist(err) {
			return []*model.Change{}, nil
		}
		return nil, err
	}

	var changes []*model.Change
	for _, e := range entries {
		// Skip files and archive folder
		if !e.IsDir() || e.Name() == ".archive" {
			continue
		}
		path := filepath.Join(m.baseDir, e.Name(), "change.json")
		b, rerr := os.ReadFile(path)
		if rerr != nil {
			// Ignore unreadable change entries
			continue
		}
		var ch model.Change
		if jerr := json.Unmarshal(b, &ch); jerr != nil {
			// Ignore invalid JSON entries
			continue
		}
		// Ensure ID is set
		if ch.ID == "" {
			ch.ID = e.Name()
		}
		changes = append(changes, &ch)
	}
	return changes, nil
}

func (m *changeManager) ApplyChange(change *model.Change) error {
	if change == nil {
		return custom_errors.NewErrConflict("change cannot be nil")
	}
	if change.ID == "" {
		return custom_errors.NewErrConflict("change.ID cannot be empty")
	}

	// Apply each SpecDelta using the SpecMerger
	for i := range change.SpecDeltas {
		d := &change.SpecDeltas[i]
		if err := m.specMerger.Merge(d); err != nil {
			return err
		}
	}

	// Mark as applied and persist
	if change.Status == "" {
		change.Status = "applied"
	} else {
		change.Status = "applied"
	}
	if change.CreatedAt.IsZero() {
		change.CreatedAt = time.Now()
	}
	if err := m.saveChange(change); err != nil {
		return err
	}
	return nil
}

func (m *changeManager) ArchiveChange(change *model.Change) error {
	if change == nil {
		return custom_errors.NewErrConflict("change cannot be nil")
	}
	if change.ID == "" {
		return custom_errors.NewErrConflict("change.ID cannot be empty")
	}

	srcDir := m.changeDir(change.ID)
	dstDir := filepath.Join(m.baseDir, ".archive", change.ID)

	// Ensure archive parent exists
	if err := fileutil.MkdirAll(filepath.Dir(dstDir), 0o755); err != nil {
		return err
	}

	// Attempt to move entire directory (preserves any artifacts)
	if err := os.Rename(srcDir, dstDir); err != nil {
		// Best-effort fallback: write archived change JSON and remove original JSON
		// (Note: we won't recursively copy arbitrary artifacts in this fallback)
		change.Status = "archived"
		if err := m.saveChangeToPath(change, filepath.Join(dstDir, "change.json")); err != nil {
			return err
		}
		_ = os.RemoveAll(srcDir) // cleanup original dir; ignore errors
		return nil
	}

	return nil
}

// saveChange writes the change JSON to its canonical path under baseDir/<id>/change.json.
func (m *changeManager) saveChange(change *model.Change) error {
	return m.saveChangeToPath(change, m.changeFile(change.ID))
}

func (m *changeManager) saveChangeToPath(change *model.Change, path string) error {
	if change == nil {
		return custom_errors.NewErrConflict("change cannot be nil")
	}
	if change.ID == "" {
		return custom_errors.NewErrConflict("change.ID cannot be empty")
	}
	// Ensure directory exists
	if err := fileutil.EnsureParentDir(path, 0o755); err != nil {
		return err
	}
	// If CreatedAt is zero, set it
	if change.CreatedAt.IsZero() {
		change.CreatedAt = time.Now()
	}

	// Marshal with indentation for readability
	data, err := json.MarshalIndent(change, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to encode change: %w", err)
	}
	// Ensure newline at EOF
	data = append(data, '\n')

	return fileutil.WriteFile(path, data, 0o644)
}

func (m *changeManager) Save(change *model.Change) error {
	return m.saveChange(change)
}

func (m *changeManager) changeDir(changeID string) string {
	return filepath.Join(m.baseDir, changeID)
}

func (m *changeManager) changeFile(changeID string) string {
	return filepath.Join(m.changeDir(changeID), "change.json")
}
