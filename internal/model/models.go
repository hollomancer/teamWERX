package model

import (
	"time"

	"github.com/yuin/goldmark/ast"
)

// Project represents the central application state, holding all loaded data.
type Project struct {
	Goals     []Goal   `json:"goals"`
	Specs     []Spec   `json:"specs"`
	Changes   []Change `json:"changes"`
	Workspace string   `json:"workspace"` // Base directory for .teamwerx
}

// DiscussionEntry represents a single entry in a goal's discussion log.
type DiscussionEntry struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"` // e.g., "discussion", "reflection", "issue-correction"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// Goal represents a high-level objective.
type Goal struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// Plan represents a collection of tasks for a goal.
type Plan struct {
	GoalID    string    `json:"goal_id"`
	Tasks     []Task    `json:"tasks"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Task represents a single work item in a plan.
type Task struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"` // e.g., "pending", "in-progress", "completed"
}

// Spec represents a project specification for a domain.
type Spec struct {
	Domain       string        `json:"domain"`
	Content      string        `json:"content"`
	Fingerprint  string        `json:"fingerprint"`
	Requirements []Requirement `json:"requirements"`
	AST          ast.Node      `json:"-"`
}

// Requirement represents a single requirement within a spec.
type Requirement struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
	Start   int    `json:"-"` // Temporary field for parsing
}

// Scenario represents a behavior-driven scenario associated with a requirement or spec.
type Scenario struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Steps         []string `json:"steps,omitempty"`
	RequirementID string   `json:"requirement_id,omitempty"`
	Content       string   `json:"content,omitempty"`
}

// Change represents a change proposal.
type Change struct {
	ID         string      `json:"id"`
	Title      string      `json:"title"`
	Status     string      `json:"status"`
	GoalID     string      `json:"goal_id"`
	CreatedAt  time.Time   `json:"created_at"`
	SpecDeltas []SpecDelta `json:"spec_deltas"`
}

// SpecDelta represents the changes to a spec in a proposal.
type SpecDelta struct {
	Domain          string           `json:"domain"`
	BaseFingerprint string           `json:"base_fingerprint,omitempty"`
	Operations      []DeltaOperation `json:"operations"`
}

// DeltaOperation represents a single operation in a spec delta.
type DeltaOperation struct {
	Type        string      `json:"type"` // ADDED, MODIFIED, REMOVED
	Requirement Requirement `json:"requirement"`
}
