package core

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"time"

	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
	fileutil "github.com/teamwerx/teamwerx/internal/utils/file"
	"gopkg.in/yaml.v3"
)

// charterManager implements CharterManager backed by file-based storage.
// The charter is stored at: <baseDir>/charter.md
//
// File format:
// ---
// title: Project Title
// version: 1.0.0
// created: 2025-01-15T10:00:00Z
// updated: 2025-01-15T10:00:00Z
// purpose: Project purpose statement
// tech_stack:
//   - Go 1.18+
//   - PostgreSQL
//
// conventions:
//
//	commit_prefix: "[PROJECT]"
//	branch_naming: feature/*, bugfix/*
//
// ---
//
// # Charter Content
//
// Additional markdown content describing governance, standards, etc.
type charterManager struct {
	baseDir string
}

// NewCharterManager creates a new file-backed CharterManager.
// The baseDir should point to the workspace directory (e.g., ".teamwerx").
func NewCharterManager(baseDir string) CharterManager {
	return &charterManager{baseDir: baseDir}
}

func (m *charterManager) charterPath() string {
	return filepath.Join(m.baseDir, "charter.md")
}

// Exists checks if the charter file exists.
func (m *charterManager) Exists() bool {
	path := m.charterPath()
	_, err := os.Stat(path)
	return err == nil
}

// Read loads and parses the charter file.
// Returns ErrNotFound if the charter file doesn't exist.
func (m *charterManager) Read() (*model.Charter, error) {
	path := m.charterPath()
	data, err := fileutil.ReadFile(path)
	if err != nil {
		return nil, err
	}

	charter, err := parseCharterFile(data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse charter file '%s': %w", path, err)
	}

	return charter, nil
}

// Write saves the charter to disk with YAML frontmatter.
// Updates the 'updated' timestamp automatically.
func (m *charterManager) Write(charter *model.Charter) error {
	if charter == nil {
		return custom_errors.NewErrConflict("charter cannot be nil")
	}

	path := m.charterPath()

	// Update timestamp
	charter.Updated = time.Now()
	if charter.Created.IsZero() {
		charter.Created = charter.Updated
	}

	// Marshal frontmatter
	frontmatter, err := marshalCharterFrontmatter(charter)
	if err != nil {
		return err
	}

	// Combine frontmatter + content
	var buf bytes.Buffer
	buf.WriteString("---\n")
	buf.Write(frontmatter)
	buf.WriteString("---\n")
	if charter.Content != "" {
		buf.WriteString("\n")
		buf.WriteString(charter.Content)
		if charter.Content[len(charter.Content)-1] != '\n' {
			buf.WriteString("\n")
		}
	}

	if err := fileutil.WriteFile(path, buf.Bytes(), 0o644); err != nil {
		return fmt.Errorf("failed to write charter file '%s': %w", path, err)
	}

	return nil
}

// parseCharterFile parses a charter file with YAML frontmatter.
func parseCharterFile(data []byte) (*model.Charter, error) {
	// Split on "---" delimiters
	parts := bytes.SplitN(data, []byte("---"), 3)
	if len(parts) < 3 {
		return nil, fmt.Errorf("invalid charter format: missing YAML frontmatter delimiters")
	}

	// Parse YAML frontmatter (parts[1])
	var charter model.Charter
	if err := yaml.Unmarshal(parts[1], &charter); err != nil {
		return nil, fmt.Errorf("failed to parse YAML frontmatter: %w", err)
	}

	// Store content (parts[2])
	charter.Content = string(bytes.TrimSpace(parts[2]))

	return &charter, nil
}

// marshalCharterFrontmatter serializes charter metadata to YAML.
func marshalCharterFrontmatter(charter *model.Charter) ([]byte, error) {
	// Create intermediate struct for clean YAML output
	type charterYAML struct {
		Title       string                 `yaml:"title"`
		Version     string                 `yaml:"version,omitempty"`
		Created     time.Time              `yaml:"created"`
		Updated     time.Time              `yaml:"updated"`
		Purpose     string                 `yaml:"purpose,omitempty"`
		TechStack   []string               `yaml:"tech_stack,omitempty"`
		Conventions map[string]interface{} `yaml:"conventions,omitempty"`
	}

	payload := charterYAML{
		Title:       charter.Title,
		Version:     charter.Version,
		Created:     charter.Created,
		Updated:     charter.Updated,
		Purpose:     charter.Purpose,
		TechStack:   charter.TechStack,
		Conventions: charter.Conventions,
	}

	data, err := yaml.Marshal(&payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode charter YAML: %w", err)
	}

	return data, nil
}
