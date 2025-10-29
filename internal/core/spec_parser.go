package core

import (
	"bytes"

	"github.com/teamwerx/teamwerx/internal/model"
	"github.com/teamwerx/teamwerx/internal/utils"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/text"
)

// SpecParser is responsible for parsing spec files.
type SpecParser struct {
	goldmark goldmark.Markdown
}

// NewSpecParser creates a new SpecParser.
func NewSpecParser() *SpecParser {
	return &SpecParser{
		goldmark: goldmark.New(),
	}
}

// Parse parses the content of a spec file and returns a Spec model.
func (p *SpecParser) Parse(content []byte) (*model.Spec, error) {
	reader := text.NewReader(content)
	node := p.goldmark.Parser().Parse(reader)

	spec := &model.Spec{
		Content: string(content),
		AST:     node,
	}

	var requirements []model.Requirement
	var currentReq *model.Requirement

	_ = ast.Walk(node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if entering {
			if h, ok := n.(*ast.Heading); ok && h.Level <= 3 {
				// Finish previous requirement if we encounter a new heading
				if currentReq != nil {
					end := n.Lines().At(0).Start
					currentReq.Content = string(content[currentReq.Start:end])
					requirements = append(requirements, *currentReq)
					currentReq = nil
				}

				if h.Level == 3 && bytes.HasPrefix(h.Text(content), []byte("Requirement:")) {
					title := bytes.TrimSpace(bytes.TrimPrefix(h.Text(content), []byte("Requirement:")))
					currentReq = &model.Requirement{
						ID:    utils.ToKebabCase(string(title)),
						Title: string(title),
						Start: n.Lines().At(n.Lines().Len() - 1).Stop,
					}
				}
			}
		}
		return ast.WalkContinue, nil
	})

	// Add the last requirement if it exists
	if currentReq != nil {
		currentReq.Content = string(content[currentReq.Start:])
		requirements = append(requirements, *currentReq)
	}

	spec.Requirements = requirements

	// We need to remove the Start field from the model, it was temporary
	for i := range spec.Requirements {
		spec.Requirements[i].Start = 0
	}

	return spec, nil
}
