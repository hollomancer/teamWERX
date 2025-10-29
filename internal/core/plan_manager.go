package core

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"regexp"
	"strconv"
	"time"

	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
	fileutil "github.com/teamwerx/teamwerx/internal/utils/file"
)

// planManager implements PlanManager backed by file-based storage.
// Plans are stored as JSON at: <baseDir>/<goalID>/plan.json
//
// Example:
//
//	baseDir: ".teamwerx/goals"
//	goalID:  "001-my-goal"
//	file:    ".teamwerx/goals/001-my-goal/plan.json"
type planManager struct {
	baseDir string
}

// NewPlanManager creates a new file-backed PlanManager.
// The baseDir should point to the goals directory (e.g., ".teamwerx/goals").
func NewPlanManager(baseDir string) PlanManager {
	return &planManager{baseDir: baseDir}
}

func (m *planManager) planPath(goalID string) string {
	return filepath.Join(m.baseDir, goalID, "plan.json")
}

// Load reads and parses the plan for a given goalID.
// Returns ErrNotFound if no plan file exists for the goal.
func (m *planManager) Load(goalID string) (*model.Plan, error) {
	if goalID == "" {
		return nil, custom_errors.NewErrConflict("goalID cannot be empty")
	}

	path := m.planPath(goalID)
	b, err := fileutil.ReadFile(path)
	if err != nil {
		// Pass through custom ErrNotFound as-is.
		return nil, err
	}

	var plan model.Plan
	if err := json.Unmarshal(b, &plan); err != nil {
		return nil, fmt.Errorf("failed to parse plan file '%s': %w", path, err)
	}

	// Ensure GoalID is populated (older/hand-authored files might omit it).
	if plan.GoalID == "" {
		plan.GoalID = goalID
	}

	return &plan, nil
}

// Save writes the given plan to disk, updating the UpdatedAt timestamp.
// Returns an error if plan is nil or GoalID is empty.
func (m *planManager) Save(plan *model.Plan) error {
	if plan == nil {
		return custom_errors.NewErrConflict("plan cannot be nil")
	}
	if plan.GoalID == "" {
		return custom_errors.NewErrConflict("plan.GoalID cannot be empty")
	}

	plan.UpdatedAt = time.Now()
	path := m.planPath(plan.GoalID)

	data, err := json.MarshalIndent(plan, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to encode plan: %w", err)
	}

	if err := fileutil.WriteFile(path, append(data, '\n'), 0o644); err != nil {
		return fmt.Errorf("failed to write plan file '%s': %w", path, err)
	}

	return nil
}

// AddTask appends a new Task to the provided plan with a generated ID and default status.
// It does not persist changes to disk; callers should invoke Save(plan).
func (m *planManager) AddTask(plan *model.Plan, taskTitle string) (*model.Task, error) {
	if plan == nil {
		return nil, custom_errors.NewErrConflict("plan cannot be nil")
	}
	if plan.GoalID == "" {
		return nil, custom_errors.NewErrConflict("plan.GoalID cannot be empty")
	}
	if taskTitle == "" {
		return nil, custom_errors.NewErrConflict("task title cannot be empty")
	}

	nextID := nextTaskID(plan.Tasks)
	task := model.Task{
		ID:     nextID,
		Title:  taskTitle,
		Status: "pending",
	}
	plan.Tasks = append(plan.Tasks, task)
	plan.UpdatedAt = time.Now()

	// Return a pointer to the newly appended slice element
	return &plan.Tasks[len(plan.Tasks)-1], nil
}

// nextTaskID generates a sequential ID for a new task based on existing tasks.
// It prefers the format "TNN" (e.g., T01, T02, ...). If no tasks have such IDs,
// it falls back to using the next index + 1.
//
// Rules:
// - Parse existing task IDs matching ^T(\d+)$ and take max numeric, then +1.
// - Format with at least two digits, growing as needed (T09 -> T10).
func nextTaskID(tasks []model.Task) string {
	re := regexp.MustCompile(`^T(\d+)$`)
	maxN := 0
	for _, t := range tasks {
		m := re.FindStringSubmatch(t.ID)
		if len(m) == 2 {
			if n, err := strconv.Atoi(m[1]); err == nil && n > maxN {
				maxN = n
			}
		}
	}
	n := maxN + 1
	// Keep at least two digits; if n has more digits, Sprintf will expand naturally.
	if n < 100 {
		return fmt.Sprintf("T%02d", n)
	}
	return fmt.Sprintf("T%d", n)
}

/*
TESTING NOTES (scaffold guidance; tests should live in plan_manager_test.go):

1) TestPlanManager_Load_NotFound:
   - Create a temp goals dir.
   - Call NewPlanManager(tempDir).
   - Call Load("nonexistent") and assert custom_errors.ErrNotFound.

2) TestPlanManager_Save_And_Load_RoundTrip:
   - Create a temp goals dir.
   - NewPlanManager(tempDir).
   - Create plan := &model.Plan{GoalID: "001-demo"}.
   - Save(plan) -> expect no error and file exists.
   - Load("001-demo") -> expect same GoalID and empty Tasks.
   - Assert UpdatedAt set on save.

3) TestPlanManager_AddTask_GeneratesSequentialIDs:
   - plan := &model.Plan{GoalID: "001-demo", Tasks: []model.Task{
       {ID: "T01", Title: "first", Status: "pending"},
       {ID: "T02", Title: "second", Status: "completed"},
     }}
   - AddTask(plan, "third") -> expect ID "T03".
   - AddTask(plan, "fourth") -> expect ID "T04".
   - Save and reload to ensure persistence.

4) TestPlanManager_AddTask_EmptyTitle_Error:
   - plan := &model.Plan{GoalID: "001-demo"}
   - AddTask(plan, "") -> expect ErrConflict.

5) TestPlanManager_Save_EmptyGoalID_Error:
   - plan := &model.Plan{}
   - Save(plan) -> expect ErrConflict.

6) TestPlanManager_Load_MissingGoalID_In_File:
   - Manually write a plan.json missing GoalID field.
   - Load() should set GoalID from the argument used to load.
*/
