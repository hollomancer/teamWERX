package core

import (
	"fmt"

	fileutil "github.com/teamwerx/teamwerx/internal/utils/file"
)

// AppOptions defines the base directories for all managers.
// Any field left empty will be set to a sensible default in NewApp.
//
// Defaults:
//   - SpecsDir:   ".teamwerx/specs"
//   - GoalsDir:   ".teamwerx/goals"
//   - ChangesDir: ".teamwerx/changes"
type AppOptions struct {
	SpecsDir   string
	GoalsDir   string
	ChangesDir string
}

// withDefaults returns a copy of the options, filling in missing values.
func (o AppOptions) withDefaults() AppOptions {
	if o.SpecsDir == "" {
		o.SpecsDir = ".teamwerx/specs"
	}
	if o.GoalsDir == "" {
		o.GoalsDir = ".teamwerx/goals"
	}
	if o.ChangesDir == "" {
		o.ChangesDir = ".teamwerx/changes"
	}
	return o
}

// App is a small dependency injection container that wires together
// the core managers with consistent base directories.
//
// Typical usage:
//
//	opts := core.AppOptions{}
//	app, err := core.NewApp(opts)
//	if err != nil { /* handle error */ }
//
//	// Use managers, e.g.:
//	specs, _ := app.SpecManager.ListSpecs()
//	_ = app.PlanManager.Save(&model.Plan{GoalID: "001-demo"})
type App struct {
	Options AppOptions

	SpecManager       SpecManager
	SpecMerger        SpecMerger
	PlanManager       PlanManager
	ChangeManager     ChangeManager
	DiscussionManager DiscussionManager
}

// NewApp constructs an App with the provided options, applying defaults for any
// missing paths, ensuring directories exist, and wiring all managers together.
//
// Returns a fully initialized App or an error if required directories cannot be created.
func NewApp(opts AppOptions) (*App, error) {
	o := opts.withDefaults()

	// Ensure base directories exist so downstream file ops don't fail unexpectedly.
	if err := fileutil.MkdirAll(o.SpecsDir, 0o755); err != nil {
		return nil, fmt.Errorf("ensure specs dir: %w", err)
	}
	if err := fileutil.MkdirAll(o.GoalsDir, 0o755); err != nil {
		return nil, fmt.Errorf("ensure goals dir: %w", err)
	}
	if err := fileutil.MkdirAll(o.ChangesDir, 0o755); err != nil {
		return nil, fmt.Errorf("ensure changes dir: %w", err)
	}

	// Wire managers
	specMgr := NewSpecManager(o.SpecsDir)
	specMerger := NewSpecMerger(specMgr)
	planMgr := NewPlanManager(o.GoalsDir)
	changeMgr := NewChangeManager(o.ChangesDir, specMgr, specMerger)
	discMgr := NewDiscussionManager(o.GoalsDir)

	return &App{
		Options:           o,
		SpecManager:       specMgr,
		SpecMerger:        specMerger,
		PlanManager:       planMgr,
		ChangeManager:     changeMgr,
		DiscussionManager: discMgr,
	}, nil
}

// NewDefaultApp is a convenience constructor that builds an App using all default
// directories under .teamwerx/*.
//
// Equivalent to: NewApp(AppOptions{})
func NewDefaultApp() (*App, error) {
	return NewApp(AppOptions{})
}
