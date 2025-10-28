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
