package core

import (
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
)

func TestSpecManager_ReadSpec_Success(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "test-domain"
	specContent := []byte(`# Test Spec

### Requirement: Test Req

This is a test requirement.`)

	// Create the directory and file
	specDir := filepath.Join(baseDir, domain)
	if err := os.MkdirAll(specDir, 0755); err != nil {
		t.Fatalf("Failed to create spec dir: %v", err)
	}
	specFile := filepath.Join(specDir, "spec.md")
	if err := ioutil.WriteFile(specFile, specContent, 0644); err != nil {
		t.Fatalf("Failed to write spec file: %v", err)
	}

	manager := NewSpecManager(baseDir)
	spec, err := manager.ReadSpec(domain)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if spec.Domain != domain {
		t.Errorf("Expected domain %s, got %s", domain, spec.Domain)
	}
	if len(spec.Requirements) != 1 {
		t.Errorf("Expected 1 requirement, got %d", len(spec.Requirements))
	}
	if spec.Requirements[0].ID != "test-req" {
		t.Errorf("Expected requirement ID 'test-req', got '%s'", spec.Requirements[0].ID)
	}
}

func TestSpecManager_ReadSpec_NotFound(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "nonexistent-domain"

	manager := NewSpecManager(baseDir)
	_, err := manager.ReadSpec(domain)
	if err == nil {
		t.Fatal("Expected error, got nil")
	}
	var notFoundErr *custom_errors.ErrNotFound
	if !errors.As(err, &notFoundErr) {
		t.Errorf("Expected ErrNotFound, got %T", err)
	}
}

func TestSpecManager_WriteSpec(t *testing.T) {
	baseDir := createTempDir(t)
	domain := "test-domain"
	spec := &model.Spec{
		Domain: domain,
		Requirements: []model.Requirement{
			{
				ID:      "write-test",
				Title:   "Write Test",
				Content: "### Requirement: Write Test\n\nThis is a write test.\n\n",
			},
		},
	}

	manager := NewSpecManager(baseDir)
	err := manager.WriteSpec(spec)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Verify the file was written
	specFile := filepath.Join(baseDir, domain, "spec.md")
	content, err := ioutil.ReadFile(specFile)
	if err != nil {
		t.Fatalf("Failed to read written file: %v", err)
	}

	expected := "### Requirement: Write Test\n\nThis is a write test.\n\n\n"
	if string(content) != expected {
		t.Errorf("Expected content %q, got %q", expected, string(content))
	}
}

func TestSpecManager_ListSpecs(t *testing.T) {
	baseDir := createTempDir(t)

	// Create two spec directories
	domain1 := "domain1"
	domain2 := "domain2"
	specDir1 := filepath.Join(baseDir, domain1)
	specDir2 := filepath.Join(baseDir, domain2)
	if err := os.MkdirAll(specDir1, 0755); err != nil {
		t.Fatalf("Failed to create spec dir1: %v", err)
	}
	if err := os.MkdirAll(specDir2, 0755); err != nil {
		t.Fatalf("Failed to create spec dir2: %v", err)
	}

	// Write spec files
	specFile1 := filepath.Join(specDir1, "spec.md")
	specFile2 := filepath.Join(specDir2, "spec.md")
	content1 := []byte("# Domain1 Spec\n\n### Requirement: Req1\n\nContent1.")
	content2 := []byte("# Domain2 Spec\n\n### Requirement: Req2\n\nContent2.")
	if err := ioutil.WriteFile(specFile1, content1, 0644); err != nil {
		t.Fatalf("Failed to write spec file1: %v", err)
	}
	if err := ioutil.WriteFile(specFile2, content2, 0644); err != nil {
		t.Fatalf("Failed to write spec file2: %v", err)
	}

	manager := NewSpecManager(baseDir)
	specs, err := manager.ListSpecs()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(specs) != 2 {
		t.Errorf("Expected 2 specs, got %d", len(specs))
	}

	// Check domains
	domains := make(map[string]bool)
	for _, spec := range specs {
		domains[spec.Domain] = true
	}
	if !domains["domain1"] || !domains["domain2"] {
		t.Errorf("Expected domains domain1 and domain2, got %v", domains)
	}
}

func TestSpecManager_ListSpecs_Empty(t *testing.T) {
	baseDir := createTempDir(t)

	manager := NewSpecManager(baseDir)
	specs, err := manager.ListSpecs()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(specs) != 0 {
		t.Errorf("Expected 0 specs, got %d", len(specs))
	}
}
