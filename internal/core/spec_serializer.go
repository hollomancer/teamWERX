package core

import (
	"bytes"
	"errors"

	"github.com/teamwerx/teamwerx/internal/model"
	"github.com/yuin/goldmark"
)

// SpecSerializer is responsible for serializing a Spec model to a file.
type SpecSerializer struct{}

// NewSpecSerializer creates a new SpecSerializer.
func NewSpecSerializer() *SpecSerializer {
	return &SpecSerializer{}
}

// Serialize serializes a Spec model to a byte slice.
func (s *SpecSerializer) Serialize(spec *model.Spec) ([]byte, error) {
	if spec == nil {
		return nil, errors.New("spec is nil")
	}

	// Prefer rendering from AST when present, using existing Content as source bytes.
	if spec.AST != nil {
		var buf bytes.Buffer
		md := goldmark.New()
		if err := md.Renderer().Render(&buf, []byte(spec.Content), spec.AST); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	}

	// Fallback: reconstruct from requirements in order, preserving each block and a blank line.
	var buf bytes.Buffer
	for _, req := range spec.Requirements {
		buf.WriteString(req.Content)
		buf.WriteString("\n")
	}
	return buf.Bytes(), nil
}
