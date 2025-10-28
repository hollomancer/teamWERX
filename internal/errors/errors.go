package errors

import "fmt"

// ErrNotFound is returned when a resource is not found.
type ErrNotFound struct {
	Resource string
	ID       string
}

func (e *ErrNotFound) Error() string {
	return fmt.Sprintf("%s with ID '%s' not found", e.Resource, e.ID)
}

// NewErrNotFound creates a new ErrNotFound.
func NewErrNotFound(resource, id string) error {
	return &ErrNotFound{Resource: resource, ID: id}
}

// ErrConflict is returned when there is a conflict during an operation.
type ErrConflict struct {
	Message string
}

func (e *ErrConflict) Error() string {
	return e.Message
}

// NewErrConflict creates a new ErrConflict.
func NewErrConflict(message string) error {
	return &ErrConflict{Message: message}
}

// ErrDiverged is returned when a spec (or other artifact) has diverged from the
// expected base fingerprint. This is useful to detect concurrent edits and
// prevent silent overwrites during merges.
type ErrDiverged struct {
	Domain             string // domain or resource name that diverged
	BaseFingerprint    string // fingerprint expected by the incoming change
	CurrentFingerprint string // current fingerprint present in the repository
	Reason             string // optional human-readable reason
}

func (e *ErrDiverged) Error() string {
	if e.Reason != "" {
		return fmt.Sprintf("resource '%s' diverged: base=%s current=%s: %s", e.Domain, e.BaseFingerprint, e.CurrentFingerprint, e.Reason)
	}
	return fmt.Sprintf("resource '%s' diverged: base=%s current=%s", e.Domain, e.BaseFingerprint, e.CurrentFingerprint)
}

// NewErrDiverged creates a new ErrDiverged.
func NewErrDiverged(domain, baseFP, currentFP, reason string) error {
	return &ErrDiverged{
		Domain:             domain,
		BaseFingerprint:    baseFP,
		CurrentFingerprint: currentFP,
		Reason:             reason,
	}
}
