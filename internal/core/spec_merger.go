package core

import (
	"bytes"
	"fmt"
	"strings"

	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
	"github.com/teamwerx/teamwerx/internal/utils"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/text"
)

// specMerger implements SpecMerger by using the Markdown AST to compute exact
// byte ranges for requirement blocks and then applying text-range edits.
// This gives us robust detection of requirement boundaries while keeping the
// edit model (replace/delete/append) simple and deterministic.
type specMerger struct {
	specManager SpecManager
	md          goldmark.Markdown
}

// NewSpecMerger creates a new AST-assisted SpecMerger.
func NewSpecMerger(specManager SpecManager) SpecMerger {
	return &specMerger{
		specManager: specManager,
		md:          goldmark.New(),
	}
}

// Merge applies the given SpecDelta to the domain's spec. If the delta carries
// a BaseFingerprint it will be compared against the current spec fingerprint
// and an ErrDiverged will be returned when they differ (preventing accidental
// overwrites). The caller may refresh fingerprints or choose a force path as
// appropriate at a higher level.
func (m *specMerger) Merge(delta *model.SpecDelta) error {
	if delta == nil {
		return fmt.Errorf("nil delta")
	}

	// Read existing spec; if not found, treat as empty content.
	spec, err := m.specManager.ReadSpec(delta.Domain)
	if err != nil {
		if _, ok := err.(*custom_errors.ErrNotFound); ok {
			spec = &model.Spec{
				Domain:  delta.Domain,
				Content: "",
			}
		} else {
			return err
		}
	}

	// Conflict detection via base fingerprint (if provided).
	if delta.BaseFingerprint != "" {
		// If current fingerprint differs from the base fingerprint, refuse to merge.
		// Note: spec.Fingerprint may be empty for empty/nonexistent specs.
		if spec.Fingerprint != "" && spec.Fingerprint != delta.BaseFingerprint {
			return custom_errors.NewErrDiverged(delta.Domain, delta.BaseFingerprint, spec.Fingerprint, "current spec fingerprint does not match delta base fingerprint")
		}
	}

	// Use AST to compute byte ranges for requirement blocks.
	content := spec.Content
	src := []byte(content)
	// Parse the AST for the current content once; when content changes due to edits,
	// we will reparse as needed using updated src.
	doc := m.md.Parser().Parse(text.NewReader(src))

	for _, op := range delta.Operations {
		switch op.Type {
		case "ADDED":
			// Append the requirement block to the end of the document.
			block := buildRequirementText(op.Requirement)
			// Ensure tidy separation.
			if len(content) > 0 && !strings.HasSuffix(content, "\n") {
				content += "\n"
			}
			content += block

		case "REMOVED":
			// Find range via AST on current src.
			start, end := findRequirementRangeAST(doc, src, op.Requirement.ID)
			if start == -1 {
				// Nothing to remove.
				continue
			}
			content = content[:start] + content[end:]
			// Re-parse to update doc/src for subsequent operations.
			src = []byte(content)
			doc = m.md.Parser().Parse(text.NewReader(src))

		case "MODIFIED":
			// Replace the existing requirement block, or add if not present.
			start, end := findRequirementRangeAST(doc, src, op.Requirement.ID)
			block := buildRequirementText(op.Requirement)
			if start == -1 {
				// Add as new block.
				if len(content) > 0 && !strings.HasSuffix(content, "\n") {
					content += "\n"
				}
				content += block
			} else {
				content = content[:start] + block + content[end:]
			}
			// Re-parse after modification for subsequent operations.
			src = []byte(content)
			doc = m.md.Parser().Parse(text.NewReader(src))

		default:
			return custom_errors.NewErrConflict(fmt.Sprintf("unknown operation type: %s", op.Type))
		}
	}

	// Persist the updated content.
	spec.Content = content
	// Recompute fingerprint (SpecManager.WriteSpec will persist content; fingerprinting
	// is typically updated on Read; we keep WriteSpec responsibility minimal here).
	if err := m.specManager.WriteSpec(spec); err != nil {
		return err
	}

	return nil
}

// buildRequirementText returns a normalized markdown block for a requirement.
// If the Requirement.Content is non-empty, prefer it (ensuring trailing blank lines).
// Otherwise construct a level-3 "Requirement:" heading block.
func buildRequirementText(r model.Requirement) string {
	if strings.TrimSpace(r.Content) != "" {
		c := r.Content
		if !strings.HasSuffix(c, "\n") {
			c += "\n"
		}
		if !strings.HasSuffix(c, "\n\n") {
			c += "\n"
		}
		return c
	}
	title := strings.TrimSpace(r.Title)
	if title == "" {
		title = r.ID
	}
	return fmt.Sprintf("### Requirement: %s\n\n\n", title)
}

// findRequirementRangeAST locates the byte start/end offsets for a requirement
// block using the parsed AST. It returns (-1, -1) if not found.
//
// Approach:
//   - Walk top-level children of the document looking for level-3 headings.
//   - For a heading whose text begins with "Requirement:", extract the title,
//     kebab-case it and compare with the provided id.
//   - If matched, the start offset is the heading's first line Start.
//   - The end offset is computed as the Start of the next sibling heading that
//     has level <= 3 (i.e., next requirement or higher-level section), or EOF.
func findRequirementRangeAST(doc ast.Node, src []byte, id string) (int, int) {
	const prefix = "Requirement:"

	// Iterate over top-level children; use doc.FirstChild()/NextSibling() to preserve original ordering.
	for node := doc.FirstChild(); node != nil; node = node.NextSibling() {
		// We're looking for headings at level 3.
		h, ok := node.(*ast.Heading)
		if !ok || h.Level != 3 {
			continue
		}

		// Extract heading text bytes.
		headingText := bytes.TrimSpace(h.Text(src))
		if !bytes.HasPrefix(headingText, []byte(prefix)) {
			continue
		}

		// Extract title part after "Requirement:".
		titleBytes := bytes.TrimSpace(bytes.TrimPrefix(headingText, []byte(prefix)))
		title := string(titleBytes)
		if utils.ToKebabCase(title) != id {
			continue
		}

		// Found matching heading. Compute start offset from the first segment of heading.Lines()
		// (Lines represents the source segments that make up the node). The segment start
		// may point to the first character of the heading text (after the "### " marker).
		// To ensure we include the full heading marker (e.g., "### "), search backwards
		// to the beginning of the line and use that as the block start.
		if h.Lines().Len() == 0 {
			// Defensive: if no lines info, fall back to -1.
			return -1, -1
		}
		firstSeg := h.Lines().At(0)
		// Compute the start of the heading line by finding the last newline before firstSeg.Start.
		lineStart := 0
		if firstSeg.Start > 0 {
			if idx := bytes.LastIndex(src[:firstSeg.Start], []byte("\n")); idx >= 0 {
				lineStart = idx + 1
			} else {
				lineStart = 0
			}
		}
		start := lineStart

		// Find the end offset: look for next sibling that is a heading with level <= 3 and take
		// the beginning of that heading's line (so we remove the full trailing heading marker).
		end := len(src) // default: EOF
		for sib := h.NextSibling(); sib != nil; sib = sib.NextSibling() {
			if nh, ok := sib.(*ast.Heading); ok {
				// any heading of level 1..3 marks the end of the current requirement block
				if nh.Lines().Len() > 0 && nh.Level <= 3 {
					endSeg := nh.Lines().At(0)
					// Compute the start of that heading's line the same way as above.
					nextLineStart := 0
					if endSeg.Start > 0 {
						if idx := bytes.LastIndex(src[:endSeg.Start], []byte("\n")); idx >= 0 {
							nextLineStart = idx + 1
						} else {
							nextLineStart = 0
						}
					}
					end = nextLineStart
					break
				}
			}
		}

		return start, end
	}

	return -1, -1
}
