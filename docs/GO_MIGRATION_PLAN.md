# TeamWERX Migration to Go
## Complete Implementation Plan

**Version**: 2.0.0  
**Target Language**: Go 1.22+  
**Status**: Planning  
**Last Updated**: 2025-10-28

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why Go?](#why-go)
3. [Architecture Overview](#architecture-overview)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [Technical Specifications](#technical-specifications)
6. [Migration Strategy](#migration-strategy)
7. [Testing Strategy](#testing-strategy)
8. [Risk Management](#risk-management)
9. [Timeline & Resources](#timeline--resources)
10. [Post-Migration](#post-migration)

---

## Executive Summary

### Vision

Rewrite TeamWERX CLI in Go to achieve:
- **10x faster startup** (5-10ms vs 50-100ms)
- **Single binary distribution** (no Node.js dependency)
- **3x lower memory usage** (10-20MB vs 30-50MB)
- **Simpler maintenance** (static typing, faster compilation)
- **Better cross-platform support** (built-in cross-compilation)

### Current State

**JavaScript/Node.js Implementation**:
- **31 files** in `lib/`
- **~5,200 LOC** (excluding tests)
- **7 npm dependencies**: chalk, cli-table3, commander, gray-matter, inquirer, js-yaml, ora
- **5 dev dependencies**: jest, eslint, prettier, husky, lint-staged

### Target State

**Go Implementation**:
- **~35-40 files** (Go prefers smaller files)
- **~7,500-8,000 LOC** (Go is more verbose)
- **Key dependencies**: cobra, viper, survey, color, yaml, goldmark
- **Single 8-12MB binary**

### Success Metrics

✅ **Performance**: Startup <10ms  
✅ **Distribution**: `curl | tar | ./teamwerx`  
✅ **Compatibility**: 100% feature parity  
✅ **Quality**: 80%+ test coverage  
✅ **Timeline**: 12-16 weeks  
✅ **Budget**: 400-500 hours

---

## Why Go?

### Advantages Over Current JavaScript

| Aspect | JavaScript/Node | Go | Improvement |
|--------|----------------|-----|-------------|
| **Startup Time** | 50-100ms | 5-10ms | **10x faster** |
| **Memory Usage** | 30-50MB | 10-20MB | **3x less** |
| **Distribution** | Requires Node.js | Single binary | **No dependencies** |
| **Type Safety** | Runtime (or TypeScript) | Compile-time | **Catch bugs earlier** |
| **Concurrency** | Callbacks/Promises | Goroutines | **Simpler** |
| **Build Time** | Instant (interpreted) | 1-2s | **Acceptable** |
| **Binary Size** | N/A | 8-12MB | **Small enough** |

### Advantages Over Rust

| Aspect | Rust | Go | Winner |
|--------|------|-----|--------|
| **Learning Curve** | 4-8 weeks | 1-2 weeks | **Go** |
| **Dev Velocity** | Slower (borrow checker) | Faster | **Go** |
| **Compile Time** | 30s-5min | 1-2s | **Go** |
| **Ecosystem** | Excellent | Excellent | **Tie** |
| **Performance** | Fastest | Very Fast | Rust (but Go sufficient) |
| **CLI Scaffolding** | Manual | `cobra-cli` | **Go** |

**Verdict**: Go is the pragmatic choice for CLI tools. Rust's performance edge doesn't justify the 2x development time for a CLI tool.

---

## Architecture Overview

### Directory Structure

```
teamwerx/
├── cmd/
│   └── teamwerx/
│       └── main.go                 # Entry point
├── internal/
│   ├── commands/
│   │   ├── goal.go                 # goal command
│   │   ├── propose.go              # propose command
│   │   ├── changes/                # changes subcommands
│   │   │   ├── apply.go
│   │   │   ├── archive.go
│   │   │   ├── list.go
│   │   │   ├── sync.go
│   │   │   └── validate.go
│   │   ├── specs/                  # specs subcommands
│   │   │   ├── create.go
│   │   │   ├── init.go
│   │   │   └── list.go
│   │   ├── status.go
│   │   ├── plan.go
│   │   ├── execute.go
│   │   └── ... (other commands)
│   ├── core/
│   │   ├── change/                 # Change management
│   │   │   ├── manager.go
│   │   │   └── types.go
│   │   ├── spec/                   # Spec management
│   │   │   ├── manager.go
│   │   │   ├── parser.go
│   │   │   ├── merger.go
│   │   │   └── types.go
│   │   ├── plan/                   # Plan management
│   │   │   ├── manager.go
│   │   │   └── types.go
│   │   ├── goal/                   # Goal workspace
│   │   │   ├── workspace.go
│   │   │   └── types.go
│   │   ├── discussion/
│   │   │   ├── manager.go
│   │   │   └── types.go
│   │   └── implementation/
│   │       ├── manager.go
│   │       └── types.go
│   ├── utils/
│   │   ├── file/
│   │   │   ├── file.go             # File operations
│   │   │   └── frontmatter.go      # YAML frontmatter
│   │   ├── git/
│   │   │   └── git.go              # Git operations
│   │   ├── prompt/
│   │   │   └── prompt.go           # User prompts
│   │   └── styling/
│   │       └── styling.go          # Terminal colors
│   └── config/
│       └── config.go               # Configuration
├── pkg/
│   └── teamwerx/                   # Public API (if any)
├── test/
│   ├── integration/
│   └── fixtures/
├── .goreleaser.yml                 # Release automation
├── Makefile                        # Build tasks
├── go.mod                          # Dependencies
└── go.sum                          # Dependency checksums
```

### Key Differences from JavaScript

**Go Conventions**:
1. **Packages**: Each subdirectory is a package (e.g., `internal/core/spec`)
2. **Types**: Explicit type definitions in `types.go`
3. **Interfaces**: Define contracts (e.g., `SpecManager` interface)
4. **Error Handling**: Explicit `if err != nil` checks (no try/catch)
5. **Testing**: `*_test.go` files alongside implementation

---

## Phase-by-Phase Implementation

### Phase 0: Pre-Migration (Week 0)

**Goal**: Set up Go environment and project structure

#### Tasks

**T0.1: Install Go and Tools**
```bash
# Install Go 1.22+
brew install go  # macOS
# or download from https://go.dev/dl/

# Install development tools
go install github.com/spf13/cobra-cli@latest
go install golang.org/x/tools/gopls@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

**T0.2: Initialize Go Module**
```bash
mkdir teamwerx-go
cd teamwerx-go
go mod init github.com/yourusername/teamwerx

# Install core dependencies
go get github.com/spf13/cobra@latest
go get github.com/spf13/viper@latest
go get gopkg.in/yaml.v3@latest
```

**T0.3: Set Up Project Structure**
```bash
# Scaffold with cobra-cli
cobra-cli init

# Create directory structure
mkdir -p internal/{commands,core,utils,config}
mkdir -p internal/core/{change,spec,plan,goal,discussion,implementation}
mkdir -p internal/utils/{file,git,prompt,styling}
mkdir -p internal/commands/{changes,specs}
mkdir -p test/{integration,fixtures}
```

**T0.4: Configure Development Environment**
```bash
# .editorconfig
cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.go]
indent_style = tab
indent_size = 4

[*.{yml,yaml}]
indent_style = space
indent_size = 2
EOF

# .golangci.yml (linter config)
cat > .golangci.yml << 'EOF'
linters:
  enable:
    - gofmt
    - govet
    - errcheck
    - staticcheck
    - gosimple
    - ineffassign
    - unused
    - deadcode
    - misspell

linters-settings:
  errcheck:
    check-blank: true
EOF
```

**T0.5: Create Makefile**
```makefile
# Makefile
.PHONY: build test lint clean install

build:
	go build -o bin/teamwerx ./cmd/teamwerx

test:
	go test -v ./...

test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

lint:
	golangci-lint run

clean:
	rm -rf bin/ dist/

install:
	go install ./cmd/teamwerx

# Cross-compilation
build-all:
	GOOS=linux GOARCH=amd64 go build -o dist/teamwerx-linux-amd64 ./cmd/teamwerx
	GOOS=linux GOARCH=arm64 go build -o dist/teamwerx-linux-arm64 ./cmd/teamwerx
	GOOS=darwin GOARCH=amd64 go build -o dist/teamwerx-darwin-amd64 ./cmd/teamwerx
	GOOS=darwin GOARCH=arm64 go build -o dist/teamwerx-darwin-arm64 ./cmd/teamwerx
	GOOS=windows GOARCH=amd64 go build -o dist/teamwerx-windows-amd64.exe ./cmd/teamwerx
```

**Deliverables**:
- ✅ Go installed and configured
- ✅ Project structure created
- ✅ Development tools set up
- ✅ Makefile for build automation

**Estimated Time**: 4-8 hours

---

### Phase 1: Core Utilities (Weeks 1-2)

**Goal**: Implement foundational utilities used by all other modules

#### T1.1: File Utilities (`internal/utils/file/`)

**file.go**:
```go
package file

import (
	"os"
	"path/filepath"
)

// GetTeamwerxDir returns the .teamwerx directory path
func GetTeamwerxDir() string {
	cwd, _ := os.Getwd()
	return filepath.Join(cwd, ".teamwerx")
}

// EnsureDir creates directory if it doesn't exist
func EnsureDir(path string) error {
	return os.MkdirAll(path, 0755)
}

// FileExists checks if a file exists
func FileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

// DirExists checks if a directory exists
func DirExists(path string) bool {
	info, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}
	return info.IsDir()
}

// ToKebabCase converts string to kebab-case
func ToKebabCase(s string) string {
	// Implementation
	return ""
}
```

**frontmatter.go**:
```go
package file

import (
	"bytes"
	"fmt"
	"os"
	
	"gopkg.in/yaml.v3"
)

// ParsedFile represents a file with YAML frontmatter
type ParsedFile struct {
	Data    map[string]interface{}
	Content string
}

// ReadFileWithFrontmatter reads a file and parses YAML frontmatter
func ReadFileWithFrontmatter(path string) (*ParsedFile, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Split frontmatter and content
	parts := bytes.SplitN(content, []byte("---"), 3)
	if len(parts) < 3 {
		return &ParsedFile{
			Data:    make(map[string]interface{}),
			Content: string(content),
		}, nil
	}

	// Parse YAML frontmatter
	var data map[string]interface{}
	if err := yaml.Unmarshal(parts[1], &data); err != nil {
		return nil, fmt.Errorf("failed to parse frontmatter: %w", err)
	}

	return &ParsedFile{
		Data:    data,
		Content: string(bytes.TrimSpace(parts[2])),
	}, nil
}

// WriteFileWithFrontmatter writes a file with YAML frontmatter
func WriteFileWithFrontmatter(path string, data map[string]interface{}, content string) error {
	yamlData, err := yaml.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal frontmatter: %w", err)
	}

	output := fmt.Sprintf("---\n%s---\n\n%s", yamlData, content)
	
	if err := os.WriteFile(path, []byte(output), 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}
```

**Estimated Time**: 16 hours

#### T1.2: Git Utilities (`internal/utils/git/`)

```go
package git

import (
	"fmt"
	"os/exec"
	"strings"
)

// IsGitRepo checks if current directory is a git repository
func IsGitRepo() bool {
	cmd := exec.Command("git", "rev-parse", "--is-inside-work-tree")
	err := cmd.Run()
	return err == nil
}

// GetCurrentBranch returns the current git branch
func GetCurrentBranch() (string, error) {
	cmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get current branch: %w", err)
	}
	return strings.TrimSpace(string(output)), nil
}

// GetStagedChanges returns list of staged files
func GetStagedChanges() ([]string, error) {
	cmd := exec.Command("git", "diff", "--cached", "--name-only")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get staged changes: %w", err)
	}
	
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(lines) == 1 && lines[0] == "" {
		return []string{}, nil
	}
	return lines, nil
}
```

**Estimated Time**: 8 hours

#### T1.3: Styling Utilities (`internal/utils/styling/`)

```go
package styling

import (
	"github.com/fatih/color"
)

var (
	// Colors
	Red     = color.New(color.FgRed).SprintFunc()
	Green   = color.New(color.FgGreen).SprintFunc()
	Yellow  = color.New(color.FgYellow).SprintFunc()
	Blue    = color.New(color.FgBlue).SprintFunc()
	Cyan    = color.New(color.FgCyan).SprintFunc()
	Magenta = color.New(color.FgMagenta).SprintFunc()
	
	// Styles
	Bold      = color.New(color.Bold).SprintFunc()
	Dim       = color.New(color.Faint).SprintFunc()
	Underline = color.New(color.Underline).SprintFunc()
)

// Success prints a success message
func Success(msg string) {
	color.Green("✓ %s", msg)
}

// Error prints an error message
func Error(msg string) {
	color.Red("✗ %s", msg)
}

// Warning prints a warning message
func Warning(msg string) {
	color.Yellow("⚠ %s", msg)
}

// Info prints an info message
func Info(msg string) {
	color.Blue("ℹ %s", msg)
}
```

**Estimated Time**: 6 hours

#### T1.4: Prompt Utilities (`internal/utils/prompt/`)

```go
package prompt

import (
	"github.com/AlecAivazis/survey/v2"
)

// Input prompts for text input
func Input(message string, defaultValue string) (string, error) {
	var result string
	prompt := &survey.Input{
		Message: message,
		Default: defaultValue,
	}
	err := survey.AskOne(prompt, &result)
	return result, err
}

// Confirm prompts for yes/no confirmation
func Confirm(message string, defaultValue bool) (bool, error) {
	var result bool
	prompt := &survey.Confirm{
		Message: message,
		Default: defaultValue,
	}
	err := survey.AskOne(prompt, &result)
	return result, err
}

// Select prompts for selection from options
func Select(message string, options []string) (string, error) {
	var result string
	prompt := &survey.Select{
		Message: message,
		Options: options,
	}
	err := survey.AskOne(prompt, &result)
	return result, err
}

// MultiSelect prompts for multiple selections
func MultiSelect(message string, options []string) ([]string, error) {
	var result []string
	prompt := &survey.MultiSelect{
		Message: message,
		Options: options,
	}
	err := survey.AskOne(prompt, &result)
	return result, err
}
```

**Estimated Time**: 8 hours

**Phase 1 Total**: 38 hours (~1 week)

---

### Phase 2: Core Managers (Weeks 3-6)

**Goal**: Implement business logic for spec, plan, goal, change management

#### T2.1: Spec Manager (`internal/core/spec/`)

**types.go**:
```go
package spec

import "time"

// Spec represents a specification document
type Spec struct {
	Domain       string        `yaml:"domain"`
	Updated      time.Time     `yaml:"updated"`
	Content      string        `yaml:"-"`
	Fingerprint  string        `yaml:"-"`
	Requirements []Requirement `yaml:"-"`
}

// Requirement represents a single requirement
type Requirement struct {
	ID          string
	Title       string
	Content     string
	Fingerprint string
	Scenarios   []Scenario
}

// Scenario represents a requirement scenario
type Scenario struct {
	Title   string
	Content string
}

// DeltaOperation represents a spec change operation
type DeltaOperation struct {
	Type          string      // "add", "modify", "remove"
	Requirement   Requirement // For add/modify
	RequirementID string      // For remove
}

// SpecDelta represents changes to a spec
type SpecDelta struct {
	Domain     string
	Operations []DeltaOperation
}
```

**manager.go**:
```go
package spec

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	
	"github.com/yourusername/teamwerx/internal/utils/file"
)

// Manager manages specifications
type Manager struct {
	baseDir string
}

// NewManager creates a new spec manager
func NewManager(baseDir string) *Manager {
	return &Manager{baseDir: baseDir}
}

// ReadSpec reads a spec from disk
func (m *Manager) ReadSpec(domain string) (*Spec, error) {
	specPath := filepath.Join(m.baseDir, domain, "spec.md")
	
	parsed, err := file.ReadFileWithFrontmatter(specPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read spec: %w", err)
	}
	
	spec := &Spec{
		Domain:  domain,
		Content: parsed.Content,
	}
	
	// Parse frontmatter
	if domain, ok := parsed.Data["domain"].(string); ok {
		spec.Domain = domain
	}
	
	// Generate fingerprint
	spec.Fingerprint = m.generateFingerprint(parsed.Content)
	
	// Parse requirements
	spec.Requirements = m.parseRequirements(parsed.Content)
	
	return spec, nil
}

// WriteSpec writes a spec to disk
func (m *Manager) WriteSpec(domain string, content string) error {
	domainDir := filepath.Join(m.baseDir, domain)
	if err := file.EnsureDir(domainDir); err != nil {
		return fmt.Errorf("failed to create domain directory: %w", err)
	}
	
	specPath := filepath.Join(domainDir, "spec.md")
	
	data := map[string]interface{}{
		"domain":  domain,
		"updated": time.Now().Format(time.RFC3339),
	}
	
	if err := file.WriteFileWithFrontmatter(specPath, data, content); err != nil {
		return fmt.Errorf("failed to write spec: %w", err)
	}
	
	return nil
}

// ListSpecs lists all specs in baseDir
func (m *Manager) ListSpecs() ([]string, error) {
	entries, err := os.ReadDir(m.baseDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, fmt.Errorf("failed to list specs: %w", err)
	}
	
	var domains []string
	for _, entry := range entries {
		if entry.IsDir() {
			specPath := filepath.Join(m.baseDir, entry.Name(), "spec.md")
			if file.FileExists(specPath) {
				domains = append(domains, entry.Name())
			}
		}
	}
	
	return domains, nil
}

func (m *Manager) generateFingerprint(content string) string {
	hash := sha256.Sum256([]byte(strings.TrimSpace(content)))
	return fmt.Sprintf("%x", hash[:8]) // First 16 chars
}

func (m *Manager) parseRequirements(content string) []Requirement {
	// Parse "### Requirement: <title>" blocks
	// Implementation details...
	return []Requirement{}
}
```

**Estimated Time**: 32 hours

#### T2.2: Plan Manager (`internal/core/plan/`)

**types.go**:
```go
package plan

import "time"

// Task represents a plan task
type Task struct {
	ID      string    `yaml:"id"`
	Title   string    `yaml:"title"`
	Status  string    `yaml:"status"` // pending, in-progress, completed, blocked
	Notes   string    `yaml:"notes,omitempty"`
	Source  string    `yaml:"source,omitempty"`
	Created time.Time `yaml:"created"`
	Updated time.Time `yaml:"updated"`
}

// Plan represents a goal plan
type Plan struct {
	Goal       string    `yaml:"goal"`
	GoalNumber string    `yaml:"goal_number"`
	Updated    time.Time `yaml:"updated"`
	Tasks      []Task    `yaml:"tasks"`
}
```

**manager.go**:
```go
package plan

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	
	"github.com/yourusername/teamwerx/internal/utils/file"
)

// Manager manages plans
type Manager struct {
	planPath string
	plan     *Plan
}

// NewManager creates a new plan manager
func NewManager(planPath string) *Manager {
	return &Manager{
		planPath: planPath,
		plan:     &Plan{},
	}
}

// Load loads the plan from disk
func (m *Manager) Load() error {
	if !file.FileExists(m.planPath) {
		m.plan = &Plan{Tasks: []Task{}}
		return nil
	}
	
	parsed, err := file.ReadFileWithFrontmatter(m.planPath)
	if err != nil {
		return fmt.Errorf("failed to read plan: %w", err)
	}
	
	// Parse frontmatter into plan
	// Implementation details...
	
	return nil
}

// Save saves the plan to disk
func (m *Manager) Save() error {
	data := map[string]interface{}{
		"goal":        m.plan.Goal,
		"goal_number": m.plan.GoalNumber,
		"updated":     time.Now().Format(time.RFC3339),
		"tasks":       m.plan.Tasks,
	}
	
	content := m.generateTable()
	
	if err := file.WriteFileWithFrontmatter(m.planPath, data, content); err != nil {
		return fmt.Errorf("failed to save plan: %w", err)
	}
	
	return nil
}

// AddTask adds a new task to the plan
func (m *Manager) AddTask(title, status, notes, source string) *Task {
	id := m.getNextTaskID()
	
	task := &Task{
		ID:      id,
		Title:   title,
		Status:  status,
		Notes:   notes,
		Source:  source,
		Created: time.Now(),
		Updated: time.Now(),
	}
	
	m.plan.Tasks = append(m.plan.Tasks, *task)
	return task
}

// UpdateTask updates an existing task
func (m *Manager) UpdateTask(id string, updates map[string]interface{}) (*Task, error) {
	for i := range m.plan.Tasks {
		if m.plan.Tasks[i].ID == id {
			// Apply updates
			if title, ok := updates["title"].(string); ok {
				m.plan.Tasks[i].Title = title
			}
			if status, ok := updates["status"].(string); ok {
				m.plan.Tasks[i].Status = status
			}
			m.plan.Tasks[i].Updated = time.Now()
			return &m.plan.Tasks[i], nil
		}
	}
	return nil, fmt.Errorf("task %s not found", id)
}

// GetPendingTasks returns pending tasks
func (m *Manager) GetPendingTasks(limit int) []Task {
	var pending []Task
	for _, task := range m.plan.Tasks {
		if task.Status == "pending" || task.Status == "in-progress" {
			pending = append(pending, task)
			if len(pending) >= limit {
				break
			}
		}
	}
	return pending
}

func (m *Manager) getNextTaskID() string {
	maxNum := 0
	for _, task := range m.plan.Tasks {
		if strings.HasPrefix(task.ID, "T") {
			numStr := strings.TrimPrefix(task.ID, "T")
			if num, err := strconv.Atoi(numStr); err == nil && num > maxNum {
				maxNum = num
			}
		}
	}
	return fmt.Sprintf("T%02d", maxNum+1)
}

func (m *Manager) generateTable() string {
	var lines []string
	lines = append(lines, "# Plan\n")
	lines = append(lines, "| Task | Description | Status |")
	lines = append(lines, "| --- | --- | --- |")
	
	for _, task := range m.plan.Tasks {
		line := fmt.Sprintf("| %s | %s | %s |", task.ID, task.Title, task.Status)
		lines = append(lines, line)
	}
	
	return strings.Join(lines, "\n")
}
```

**Estimated Time**: 28 hours

#### T2.3: Change Manager (`internal/core/change/`)

Similar pattern to spec/plan managers, implementing:
- CreateChange
- ReadChange
- ListChanges
- ApplyChange
- ArchiveChange

**Estimated Time**: 40 hours

#### T2.4: Other Core Managers

- Goal Workspace Manager: 24 hours
- Discussion Manager: 20 hours
- Implementation Manager: 20 hours

**Phase 2 Total**: 164 hours (~4 weeks)

---

### Phase 3: CLI Commands (Weeks 7-10)

**Goal**: Implement all user-facing commands with Cobra

#### T3.1: Root Command Setup

```go
// cmd/teamwerx/main.go
package main

import (
	"fmt"
	"os"
	
	"github.com/yourusername/teamwerx/internal/commands"
)

func main() {
	if err := commands.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
```

```go
// internal/commands/root.go
package commands

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "teamwerx",
	Short: "Development framework for AI agents",
	Long: `TeamWERX provides a structured workflow for coordinating 
developers and AI assistants around shared goals and plans.`,
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	// Add subcommands
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(goalCmd)
	rootCmd.AddCommand(proposeCmd)
	rootCmd.AddCommand(changesCmd)
	rootCmd.AddCommand(specsCmd)
	rootCmd.AddCommand(statusCmd)
	rootCmd.AddCommand(planCmd)
	rootCmd.AddCommand(executeCmd)
	// ... other commands
}
```

**Estimated Time**: 8 hours

#### T3.2: Core Commands

**init command** (8 hours):
```go
// internal/commands/init.go
package commands

import (
	"github.com/spf13/cobra"
	"github.com/yourusername/teamwerx/internal/core/goal"
	"github.com/yourusername/teamwerx/internal/utils/git"
	"github.com/yourusername/teamwerx/internal/utils/styling"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize teamWERX in current project",
	RunE: func(cmd *cobra.Command, args []string) error {
		// Check if git repo
		if !git.IsGitRepo() {
			return fmt.Errorf("not a git repository")
		}
		
		// Initialize .teamwerx directory
		// Create templates
		// Write AGENTS.md
		
		styling.Success("Initialized teamWERX")
		return nil
	},
}
```

**goal command** (12 hours)
**propose command** (20 hours)
**changes command group** (32 hours)
**specs command group** (16 hours)
**status command** (16 hours)
**plan command** (16 hours)
**execute command** (16 hours)
**Other commands** (discuss, research, reflect, etc.): 40 hours

**Phase 3 Total**: 184 hours (~4.5 weeks)

---

### Phase 4: Testing (Weeks 11-13)

**Goal**: Comprehensive test coverage

#### T4.1: Unit Tests

**Example test structure**:
```go
// internal/core/spec/manager_test.go
package spec_test

import (
	"os"
	"path/filepath"
	"testing"
	
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yourusername/teamwerx/internal/core/spec"
)

func TestManager_ReadSpec(t *testing.T) {
	// Setup
	tempDir := t.TempDir()
	manager := spec.NewManager(tempDir)
	
	// Create test spec
	testSpec := `---
domain: test
---

# Test Spec

### Requirement: Example
- MUST do something
`
	
	specDir := filepath.Join(tempDir, "test")
	require.NoError(t, os.MkdirAll(specDir, 0755))
	require.NoError(t, os.WriteFile(filepath.Join(specDir, "spec.md"), []byte(testSpec), 0644))
	
	// Test
	spec, err := manager.ReadSpec("test")
	require.NoError(t, err)
	assert.Equal(t, "test", spec.Domain)
	assert.NotEmpty(t, spec.Fingerprint)
}
```

**Test Coverage**:
- Unit tests for all core managers: 60 hours
- Unit tests for all commands: 40 hours
- Unit tests for utilities: 20 hours

#### T4.2: Integration Tests

```go
// test/integration/workflow_test.go
package integration_test

import (
	"os/exec"
	"testing"
	
	"github.com/stretchr/testify/require"
)

func TestCompleteWorkflow(t *testing.T) {
	// Setup temp directory
	// Initialize teamwerx
	// Create goal
	// Create proposal
	// Apply change
	// Archive
	
	// Verify final state
}
```

**Integration Test Coverage**: 32 hours

**Phase 4 Total**: 152 hours (~3.5 weeks)

---

### Phase 5: Polish & Release (Weeks 14-16)

**Goal**: Production-ready release

#### T5.1: Documentation

- Update README.md: 8 hours
- Write MIGRATION_FROM_NODE.md: 12 hours
- Update all docs/ files: 16 hours
- Go documentation (godoc): 8 hours

#### T5.2: CI/CD Setup

**GitHub Actions**:
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.22'
      - run: make test
      - run: make lint
  
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        os: [linux, darwin, windows]
        arch: [amd64, arm64]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
      - run: GOOS=${{ matrix.os }} GOARCH=${{ matrix.arch }} make build
```

**Estimated Time**: 16 hours

#### T5.3: Release Automation

**GoReleaser**:
```yaml
# .goreleaser.yml
project_name: teamwerx

builds:
  - main: ./cmd/teamwerx
    binary: teamwerx
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64

archives:
  - format: tar.gz
    format_overrides:
      - goos: windows
        format: zip

release:
  github:
    owner: yourusername
    name: teamwerx

changelog:
  sort: asc
```

**Estimated Time**: 8 hours

#### T5.4: Beta Testing & Bug Fixes

- Beta release to early adopters: 8 hours
- Bug fixes and refinements: 40 hours
- Performance tuning: 16 hours

**Phase 5 Total**: 132 hours (~3 weeks)

---

## Technical Specifications

### Dependency Mapping

| JavaScript Package | Go Package | Purpose |
|--------------------|------------|---------|
| chalk | github.com/fatih/color | Terminal colors |
| cli-table3 | github.com/olekukonko/tablewriter | ASCII tables |
| commander | github.com/spf13/cobra | CLI framework |
| gray-matter | gopkg.in/yaml.v3 + custom | YAML frontmatter |
| inquirer | github.com/AlecAivazis/survey/v2 | Interactive prompts |
| js-yaml | gopkg.in/yaml.v3 | YAML parsing |
| ora | github.com/briandowns/spinner | Spinners |

### Type System

**JavaScript (dynamic)**:
```javascript
// Implicit types
const task = {
  id: 'T01',
  title: 'Example task',
  status: 'pending'
};
```

**Go (static)**:
```go
// Explicit types
type Task struct {
	ID     string `yaml:"id"`
	Title  string `yaml:"title"`
	Status string `yaml:"status"`
}

task := Task{
	ID:     "T01",
	Title:  "Example task",
	Status: "pending",
}
```

### Error Handling

**JavaScript**:
```javascript
try {
  const spec = await readSpec('auth');
  await mergeSpec(spec, delta);
} catch (err) {
  console.error('Failed:', err.message);
}
```

**Go**:
```go
spec, err := readSpec("auth")
if err != nil {
	return fmt.Errorf("failed to read spec: %w", err)
}

if err := mergeSpec(spec, delta); err != nil {
	return fmt.Errorf("failed to merge spec: %w", err)
}
```

---

## Migration Strategy

### Parallel Development

**Option A: Big Bang (Not Recommended)**
- Rewrite everything, then switch
- **Risk**: High
- **Timeline**: 14-16 weeks before users see anything

**Option B: Gradual Feature Parity (Recommended)**
- Release v2.0.0-alpha early
- Add features incrementally
- Users can test and provide feedback
- **Risk**: Lower
- **Timeline**: 8 weeks to alpha, 16 weeks to stable

### Data Migration

**User Data**:
- `.teamwerx/` directory structure identical
- File formats unchanged (YAML frontmatter + Markdown)
- **No migration needed** - Go version reads existing data

**Configuration**:
- `AGENTS.md` unchanged
- Go version updates managed block on `init`

### Rollout Plan

**Week 12**: v2.0.0-alpha.1
- Core functionality working
- Basic commands implemented
- Early adopter testing

**Week 14**: v2.0.0-beta.1
- All commands implemented
- 80%+ test coverage
- Documentation complete

**Week 16**: v2.0.0
- Production ready
- Stable release
- Full feature parity

---

## Testing Strategy

### Unit Test Coverage

**Target**: 80%+

**Priority Areas**:
1. Core managers (spec, plan, change): 90%
2. File utilities: 85%
3. Commands: 75%
4. UI/prompts: 60%

### Integration Tests

**Scenarios**:
1. Complete workflow (goal → propose → apply → archive)
2. Concurrent goals
3. Spec merge with conflicts
4. Cross-platform compatibility

### Manual Testing

**Platforms**:
- macOS (Intel + ARM)
- Linux (Ubuntu, Fedora)
- Windows 10/11

**Workflows**:
- New project setup
- Existing project migration
- All commands with variations
- Error scenarios

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Borrow checker complexity** | N/A (Go) | N/A | Chose Go over Rust |
| **Slower compilation** | Low | Low | Go compiles fast (1-2s) |
| **Missing npm packages** | Medium | Medium | Go ecosystem mature for CLIs |
| **YAML frontmatter parsing** | Low | Medium | Custom implementation |
| **Cross-platform bugs** | Medium | High | Extensive testing, CI |

### Project Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Timeline overrun** | Medium | High | Phased releases, buffer time |
| **Feature creep** | High | High | Strict feature parity only |
| **Team capacity** | Low | High | Single developer focus |
| **User resistance** | Low | Medium | Maintain data compatibility |

### Mitigation Strategies

1. **Early Alpha Release**: Get feedback quickly (Week 8)
2. **Feature Freeze**: No new features until parity achieved
3. **Automated Testing**: Catch regressions early
4. **Documentation**: Comprehensive migration guide
5. **Backward Compatibility**: Read existing `.teamwerx/` data

---

## Timeline & Resources

### Summary

| Phase | Duration | Effort | Deliverables |
|-------|----------|--------|--------------|
| **Phase 0** | Week 0 | 8h | Project setup |
| **Phase 1** | Weeks 1-2 | 38h | Core utilities |
| **Phase 2** | Weeks 3-6 | 164h | Core managers |
| **Phase 3** | Weeks 7-10 | 184h | CLI commands |
| **Phase 4** | Weeks 11-13 | 152h | Testing |
| **Phase 5** | Weeks 14-16 | 132h | Polish & release |
| **Total** | **16 weeks** | **678 hours** | v2.0.0 |

### Weekly Breakdown

**Assuming 40-hour work weeks**:
- **Full-time (40h/week)**: 17 weeks
- **Half-time (20h/week)**: 34 weeks
- **Quarter-time (10h/week)**: 68 weeks

**Recommended**: Dedicated 3-4 month sprint (full-time)

### Team Composition

**Minimum** (solo):
- 1 Go developer (experienced)
- **Timeline**: 4 months

**Optimal** (pair):
- 1 Go developer (lead)
- 1 Go developer (contributor)
- **Timeline**: 2-3 months

---

## Post-Migration

### Performance Benchmarks

**Target Metrics**:
- Startup time: <10ms ✅
- Memory usage: <20MB ✅
- Binary size: <15MB ✅
- Test execution: <5s ✅

### Maintenance Plan

**Annual Effort**: ~40 hours
- Go version upgrades: 4 hours
- Dependency updates: 8 hours
- Bug fixes: 20 hours
- Performance tuning: 8 hours

### Community Support

**Documentation**:
- Migration guide from Node version
- Go contribution guide
- Architecture overview
- API documentation (godoc)

**Support Channels**:
- GitHub Issues
- GitHub Discussions
- README FAQ section

---

## Appendix

### A. Go Resources

**Learning**:
- [Tour of Go](https://go.dev/tour/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)

**CLI Development**:
- [Cobra Documentation](https://cobra.dev/)
- [CLI Guidelines](https://clig.dev/)

**Testing**:
- [Testify](https://github.com/stretchr/testify)
- [Go Testing Best Practices](https://go.dev/doc/tutorial/add-a-test)

### B. Code Examples

**Complete Manager Example**: See Phase 2 sections

**Complete Command Example**: See Phase 3 sections

**Complete Test Example**: See Phase 4 sections

### C. Glossary

- **Cobra**: Go CLI framework (like commander.js)
- **Viper**: Configuration management library
- **Survey**: Interactive prompt library (like inquirer)
- **Goroutine**: Lightweight thread in Go
- **Interface**: Go's abstraction mechanism
- **Struct**: Go's data structure type
- **Pointer**: Reference to memory location

---

**Document Status**: Planning  
**Next Review**: After Phase 1 completion  
**Maintainer**: TeamWERX Core Team  
**Version**: 1.0.0
