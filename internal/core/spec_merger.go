package core

import (
	"github.com/teamwerx/teamwerx/internal/model"
)

// specMerger implements the SpecMerger interface.
type specMerger struct {
	specManager SpecManager
}

// NewSpecMerger creates a new SpecMerger.
func NewSpecMerger(specManager SpecManager) SpecMerger {
	return &specMerger{
		specManager: specManager,
	}
}

// Merge applies a spec delta to the corresponding project spec.
func (m *specMerger) Merge(delta *model.SpecDelta) error {
	// 1. Read the current spec
	spec, err := m.specManager.ReadSpec(delta.Domain)
	if err != nil {
		// If spec does not exist, we can treat it as an empty spec
		spec = &model.Spec{Domain: delta.Domain}
	}

	// 2. Apply operations
	for _, op := range delta.Operations {
		switch op.Type {
		case "ADDED":
			spec.Requirements = append(spec.Requirements, op.Requirement)
		case "REMOVED":
			spec.Requirements = removeRequirement(spec.Requirements, op.Requirement.ID)
		case "MODIFIED":
			spec.Requirements = removeRequirement(spec.Requirements, op.Requirement.ID)
			spec.Requirements = append(spec.Requirements, op.Requirement)
		}
	}

	// 3. Write the updated spec
	return m.specManager.WriteSpec(spec)
}

func removeRequirement(reqs []model.Requirement, id string) []model.Requirement {
	var newReqs []model.Requirement
	for _, req := range reqs {
		if req.ID != id {
			newReqs = append(newReqs, req)
		}
	}
	return newReqs
}
