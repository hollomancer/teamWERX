package core

import "github.com/teamwerx/teamwerx/internal/model"

// SpecManager defines the interface for managing project specifications.
type SpecManager interface {
	ReadSpec(domain string) (*model.Spec, error)
	WriteSpec(spec *model.Spec) error
	ListSpecs() ([]*model.Spec, error)
}

// PlanManager defines the interface for managing a goal's plan.
type PlanManager interface {
	Load(goalID string) (*model.Plan, error)
	Save(plan *model.Plan) error
	AddTask(plan *model.Plan, taskTitle string) (*model.Task, error)
}

// ChangeManager defines the interface for managing change proposals.
type ChangeManager interface {
	ReadChange(changeID string) (*model.Change, error)
	ListChanges() ([]*model.Change, error)
	Save(change *model.Change) error
	ApplyChange(change *model.Change) error
	ArchiveChange(change *model.Change) error
}

// SpecMerger defines the interface for merging spec deltas.
type SpecMerger interface {
	Merge(delta *model.SpecDelta) error
}

// DiscussionManager defines the interface for managing discussion logs.
type DiscussionManager interface {
	Load(goalID string) ([]model.DiscussionEntry, error)
	AddEntry(goalID string, entry *model.DiscussionEntry) error
}
