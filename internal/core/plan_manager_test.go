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

// writeJSON writes raw JSON to <baseDir>/<goalID>/plan.json creating directories as needed.
func writeJSON(t *testing.T, baseDir, goalID string, data []byte) string {
	t.Helper()
	dir := filepath.Join(baseDir, goalID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatalf("mkdir failed: %v", err)
	}
	path := filepath.Join(dir, "plan.json")
	if err := os.WriteFile(path, data, 0o644); err != nil {
		t.Fatalf("write plan.json failed: %v", err)
	}
	return path
}

func TestPlanManager_Load_NotFound(t *testing.T) {
	baseDir := createTempDir(t)
	pm := NewPlanManager(baseDir)

	_, err := pm.Load("nonexistent-goal")
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	var nf *ce.ErrNotFound
	if !errors.As(err, &nf) {
		t.Fatalf("expected ErrNotFound, got %T: %v", err, err)
	}
}

func TestPlanManager_Save_And_Load_RoundTrip(t *testing.T) {
	baseDir := createTempDir(t)
	pm := NewPlanManager(baseDir)

	goalID := "001-demo"
	plan := &model.Plan{
		GoalID: goalID,
		Tasks:  []model.Task{},
	}

	// Save should set UpdatedAt and write the file
	if err := pm.Save(plan); err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	if plan.UpdatedAt.IsZero() {
		t.Fatalf("Expected UpdatedAt to be set after Save")
	}

	// Verify file exists
	planPath := filepath.Join(baseDir, goalID, "plan.json")
	if _, err := os.Stat(planPath); err != nil {
		t.Fatalf("expected plan file to exist at %s, stat error: %v", planPath, err)
	}

	// Load back and verify content
	reloaded, err := pm.Load(goalID)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if reloaded.GoalID != goalID {
		t.Fatalf("expected GoalID %q, got %q", goalID, reloaded.GoalID)
	}
	if len(reloaded.Tasks) != 0 {
		t.Fatalf("expected 0 tasks, got %d", len(reloaded.Tasks))
	}
	if reloaded.UpdatedAt.IsZero() {
		t.Fatalf("expected non-zero UpdatedAt from loaded plan")
	}
}

func TestPlanManager_AddTask_GeneratesSequentialIDs(t *testing.T) {
	baseDir := createTempDir(t)
	pm := NewPlanManager(baseDir)

	goalID := "001-seq"
	plan := &model.Plan{
		GoalID: goalID,
		Tasks: []model.Task{
			{ID: "T01", Title: "first", Status: "pending"},
			{ID: "T02", Title: "second", Status: "completed"},
		},
	}

	// Add third
	task3, err := pm.AddTask(plan, "third")
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}
	if task3.ID != "T03" {
		t.Fatalf("expected ID T03, got %s", task3.ID)
	}
	if task3.Status != "pending" {
		t.Fatalf("expected new task status 'pending', got %q", task3.Status)
	}

	// Add fourth
	task4, err := pm.AddTask(plan, "fourth")
	if err != nil {
		t.Fatalf("AddTask failed: %v", err)
	}
	if task4.ID != "T04" {
		t.Fatalf("expected ID T04, got %s", task4.ID)
	}

	// Save and reload
	if err := pm.Save(plan); err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	reloaded, err := pm.Load(goalID)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if got := len(reloaded.Tasks); got != 4 {
		t.Fatalf("expected 4 tasks after reload, got %d", got)
	}
	if reloaded.Tasks[2].ID != "T03" || reloaded.Tasks[3].ID != "T04" {
		t.Fatalf("expected tasks T03,T04; got %s,%s", reloaded.Tasks[2].ID, reloaded.Tasks[3].ID)
	}
}

func TestPlanManager_AddTask_EmptyTitle_Error(t *testing.T) {
	baseDir := createTempDir(t)
	pm := NewPlanManager(baseDir)

	plan := &model.Plan{GoalID: "001-empty-title"}
	_, err := pm.AddTask(plan, "")
	if err == nil {
		t.Fatalf("expected error for empty title, got nil")
	}
	var conf *ce.ErrConflict
	if !errors.As(err, &conf) {
		t.Fatalf("expected ErrConflict, got %T: %v", err, err)
	}
}

func TestPlanManager_Save_EmptyGoalID_Error(t *testing.T) {
	baseDir := createTempDir(t)
	pm := NewPlanManager(baseDir)

	plan := &model.Plan{}
	err := pm.Save(plan)
	if err == nil {
		t.Fatalf("expected error for empty GoalID, got nil")
	}
	var conf *ce.ErrConflict
	if !errors.As(err, &conf) {
		t.Fatalf("expected ErrConflict, got %T: %v", err, err)
	}
}

func TestPlanManager_Load_MissingGoalID_In_File(t *testing.T) {
	baseDir := createTempDir(t)
	pm := NewPlanManager(baseDir)

	goalID := "001-missing-goalid"
	// Write a plan.json missing GoalID
	raw := map[string]interface{}{
		"tasks": []map[string]interface{}{
			{"id": "T01", "title": "first", "status": "pending"},
		},
		// Intentionally no "goal_id" and no "updated_at"
	}
	b, err := json.Marshal(raw)
	if err != nil {
		t.Fatalf("json marshal failed: %v", err)
	}
	_ = writeJSON(t, baseDir, goalID, append(b, '\n'))

	plan, err := pm.Load(goalID)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if plan.GoalID != goalID {
		t.Fatalf("expected GoalID to be inferred as %q, got %q", goalID, plan.GoalID)
	}
	if len(plan.Tasks) != 1 || plan.Tasks[0].ID != "T01" {
		t.Fatalf("expected one task with ID T01, got %+v", plan.Tasks)
	}
}

func TestPlanManager_Save_Updates_UpdatedAt(t *testing.T) {
	baseDir := createTempDir(t)
	pm := NewPlanManager(baseDir)

	goalID := "001-update-time"
	plan := &model.Plan{GoalID: goalID}

	// Save once
	if err := pm.Save(plan); err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	first := plan.UpdatedAt
	if first.IsZero() {
		t.Fatalf("expected UpdatedAt to be set")
	}

	// Sleep a tick to ensure observable time difference
	time.Sleep(10 * time.Millisecond)

	// Save again (without changes) should bump UpdatedAt
	if err := pm.Save(plan); err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	second := plan.UpdatedAt
	if !second.After(first) {
		t.Fatalf("expected UpdatedAt to increase; first=%v second=%v", first, second)
	}
}
