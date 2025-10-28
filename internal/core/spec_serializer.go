package core

import (
	"bytes"

	"github.com/teamwerx/teamwerx/internal/model"
)

// SpecSerializer is responsible for serializing a Spec model to a file.
type SpecSerializer struct{}

// NewSpecSerializer creates a new SpecSerializer.
func NewSpecSerializer() *SpecSerializer {
	return &SpecSerializer{}
}

// Serialize serializes a Spec model to a byte slice.
func (s *SpecSerializer) Serialize(spec *model.Spec) ([]byte, error) {
	var buf bytes.Buffer

	// The spec.Content is the original full content.
	// If we are just writing it back, we can use it.
	// However, if the requirements have been modified, we need to reconstruct the content.

	// For now, we assume the requirements are the source of truth.

	for _, req := range spec.Requirements {
		buf.WriteString(req.Content)
		buf.WriteString("\n")
	}

	return buf.Bytes(), nil
}
