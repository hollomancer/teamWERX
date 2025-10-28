package core

import (
	"io/ioutil"
	"os"
	"path/filepath"

	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
	"github.com/teamwerx/teamwerx/internal/utils"
)

// specManager implements the SpecManager interface.
type specManager struct {
	baseDir    string
	parser     *SpecParser
	serializer *SpecSerializer
}

// NewSpecManager creates a new SpecManager.
func NewSpecManager(baseDir string) SpecManager {
	return &specManager{
		baseDir:    baseDir,
		parser:     NewSpecParser(),
		serializer: NewSpecSerializer(),
	}
}

// ReadSpec reads a spec file for a given domain.
func (m *specManager) ReadSpec(domain string) (*model.Spec, error) {
	path := filepath.Join(m.baseDir, domain, "spec.md")
	content, err := ioutil.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, custom_errors.NewErrNotFound("spec", domain)
		}
		return nil, err
	}

	spec, err := m.parser.Parse(content)
	if err != nil {
		return nil, err
	}
	// Ensure the domain is set on the parsed spec
	spec.Domain = domain

	// Compute and set a fingerprint for the spec content for conflict detection.
	// GenerateFingerprint trims surrounding whitespace before hashing so incidental
	// formatting differences do not change the fingerprint.
	spec.Fingerprint = utils.GenerateFingerprint(spec.Content)

	return spec, nil
}

// WriteSpec writes a spec to a file.
// If `spec.Content` is present (non-empty), prefer writing it directly as the file's content.
// Otherwise fall back to the serializer to construct the content.
func (m *specManager) WriteSpec(spec *model.Spec) error {
	path := filepath.Join(m.baseDir, spec.Domain, "spec.md")

	var content []byte
	var err error

	if spec != nil && spec.Content != "" {
		content = []byte(spec.Content)
	} else {
		content, err = m.serializer.Serialize(spec)
		if err != nil {
			return err
		}
	}

	// Ensure the target directory exists before writing the file.
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}

	return ioutil.WriteFile(path, content, 0644)
}

// ListSpecs lists all available specs.
func (m *specManager) ListSpecs() ([]*model.Spec, error) {
	files, err := ioutil.ReadDir(m.baseDir)
	if err != nil {
		return nil, err
	}

	var specs []*model.Spec
	for _, file := range files {
		if file.IsDir() {
			spec, err := m.ReadSpec(file.Name())
			if err != nil {
				// Ignore specs that can't be read
				continue
			}
			specs = append(specs, spec)
		}
	}

	return specs, nil
}
