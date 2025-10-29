package core

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/teamwerx/teamwerx/internal/model"
)

// Helper to write a discuss.md file for a goal.
func writeDiscussFile(t *testing.T, baseDir, goalID, content string) string {
	t.Helper()
	dir := filepath.Join(baseDir, goalID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	path := filepath.Join(dir, "discuss.md")
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatalf("write discuss.md failed: %v", err)
	}
	return path
}

func TestDiscussionManager_Load_EmptyIfMissing(t *testing.T) {
	baseDir := createTempDir(t)
	goalID := "001-empty"

	m := NewDiscussionManager(baseDir)
	entries, err := m.Load(goalID)
	if err != nil {
		t.Fatalf("expected no error loading missing discuss.md, got %v", err)
	}
	if len(entries) != 0 {
		t.Fatalf("expected 0 entries for missing file, got %d", len(entries))
	}
}

func TestDiscussionManager_Load_ParseMultipleEntries(t *testing.T) {
	baseDir := createTempDir(t)
	goalID := "001-parse"

	// Two YAML blocks, each delimited by '---'. We intentionally place closing and opening
	// delimiters back-to-back to exercise the scanner's toggle logic.
	content := "" +
		"---\n" +
		"id: D01\n" +
		"type: discussion\n" +
		"timestamp: 2025-01-01T00:00:00Z\n" +
		"content: |-\n" +
		"  First line\n" +
		"  Second line\n" +
		"---\n" +
		"---\n" +
		"id: D02\n" +
		"type: reflection\n" +
		"timestamp: 2025-01-02T00:00:00Z\n" +
		"content: |-\n" +
		"  Reflect on progress\n" +
		"---\n"

	writeDiscussFile(t, baseDir, goalID, content)

	m := NewDiscussionManager(baseDir)
	entries, err := m.Load(goalID)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}

	// Validate first entry
	e1 := entries[0]
	if e1.ID != "D01" {
		t.Errorf("expected ID D01, got %s", e1.ID)
	}
	if e1.Type != "discussion" {
		t.Errorf("expected type discussion, got %s", e1.Type)
	}
	want1 := "First line\nSecond line"
	if strings.TrimSpace(e1.Content) != want1 {
		t.Errorf("unexpected content for D01:\nwant:\n%s\n\ngot:\n%s", want1, e1.Content)
	}
	ts1, _ := time.Parse(time.RFC3339, "2025-01-01T00:00:00Z")
	if !e1.Timestamp.Equal(ts1) {
		t.Errorf("expected timestamp %v, got %v", ts1, e1.Timestamp)
	}

	// Validate second entry
	e2 := entries[1]
	if e2.ID != "D02" {
		t.Errorf("expected ID D02, got %s", e2.ID)
	}
	if e2.Type != "reflection" {
		t.Errorf("expected type reflection, got %s", e2.Type)
	}
	want2 := "Reflect on progress"
	if strings.TrimSpace(e2.Content) != want2 {
		t.Errorf("unexpected content for D02:\nwant:\n%s\n\ngot:\n%s", want2, e2.Content)
	}
	ts2, _ := time.Parse(time.RFC3339, "2025-01-02T00:00:00Z")
	if !e2.Timestamp.Equal(ts2) {
		t.Errorf("expected timestamp %v, got %v", ts2, e2.Timestamp)
	}
}

func TestDiscussionManager_AddEntry_AppendsAndAssignsIDs(t *testing.T) {
	baseDir := createTempDir(t)
	goalID := "001-append"

	m := NewDiscussionManager(baseDir)

	// Add first entry without specifying ID or Type; should default to D01 and discussion.
	if err := m.AddEntry(goalID, &model.DiscussionEntry{
		Content: "Hello world",
	}); err != nil {
		t.Fatalf("AddEntry failed: %v", err)
	}

	// Add second entry with explicit type
	if err := m.AddEntry(goalID, &model.DiscussionEntry{
		Type:    "reflection",
		Content: "Thoughts and notes",
	}); err != nil {
		t.Fatalf("AddEntry failed: %v", err)
	}

	entries, err := m.Load(goalID)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}

	// First entry expectations
	e1 := entries[0]
	if e1.ID != "D01" {
		t.Errorf("expected first ID D01, got %s", e1.ID)
	}
	if e1.Type != "discussion" {
		t.Errorf("expected default type discussion, got %s", e1.Type)
	}
	if strings.TrimSpace(e1.Content) != "Hello world" {
		t.Errorf("unexpected content for first entry, got %q", e1.Content)
	}
	if e1.Timestamp.IsZero() {
		t.Errorf("expected non-zero timestamp on first entry")
	}

	// Second entry expectations
	e2 := entries[1]
	if e2.ID != "D02" {
		t.Errorf("expected second ID D02, got %s", e2.ID)
	}
	if e2.Type != "reflection" {
		t.Errorf("expected type reflection, got %s", e2.Type)
	}
	if strings.TrimSpace(e2.Content) != "Thoughts and notes" {
		t.Errorf("unexpected content for second entry, got %q", e2.Content)
	}
	if e2.Timestamp.IsZero() {
		t.Errorf("expected non-zero timestamp on second entry")
	}
}

func TestDiscussionManager_AddEntry_NextIDTwoDigits(t *testing.T) {
	baseDir := createTempDir(t)
	goalID := "001-two-digits"

	m := NewDiscussionManager(baseDir)

	// Create nine entries to reach D09
	for i := 0; i < 9; i++ {
		if err := m.AddEntry(goalID, &model.DiscussionEntry{
			Content: "Entry",
		}); err != nil {
			t.Fatalf("AddEntry #%d failed: %v", i+1, err)
		}
	}

	// Add the 10th entry, expect ID D10
	if err := m.AddEntry(goalID, &model.DiscussionEntry{
		Content: "Tenth",
	}); err != nil {
		t.Fatalf("AddEntry (10th) failed: %v", err)
	}

	entries, err := m.Load(goalID)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if len(entries) != 10 {
		t.Fatalf("expected 10 entries, got %d", len(entries))
	}
	if entries[9].ID != "D10" {
		t.Fatalf("expected 10th entry ID D10, got %s", entries[9].ID)
	}
}
