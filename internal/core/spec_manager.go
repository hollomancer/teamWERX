package core

import (
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/teamwerx/teamwerx/internal/model"
	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
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

	return m.parser.Parse(content)
}

// WriteSpec writes a spec to a file.
func (m *specManager) WriteSpec(spec *model.Spec) error {
	path := filepath.Join(m.baseDir, spec.Domain, "spec.md")
	content, err := m.serializer.Serialize(spec)
	if err != nil {
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
