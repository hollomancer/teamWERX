package core

import (
	"bufio"
	"bytes"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
	"github.com/teamwerx/teamwerx/internal/model"
	fileutil "github.com/teamwerx/teamwerx/internal/utils/file"
	"gopkg.in/yaml.v3"
)

// discussionManager is a file-backed DiscussionManager implementation.
// It stores entries in a markdown file using YAML-block entries:
//
// ---
// id: D01
// type: discussion
// timestamp: 2025-10-28T12:34:56Z
// content: |-
//
//	Multi-line content here...
//	More lines...
//
// ---
//
// File path convention (baseDir is typically ".teamwerx/goals"):
//
//	<baseDir>/<goalID>/discuss.md
type discussionManager struct {
	baseDir string
}

// NewDiscussionManager constructs a DiscussionManager persisting to baseDir/<goalID>/discuss.md.
func NewDiscussionManager(baseDir string) DiscussionManager {
	return &discussionManager{baseDir: baseDir}
}

func (m *discussionManager) discussionPath(goalID string) string {
	return filepath.Join(m.baseDir, goalID, "discuss.md")
}

// Load reads and parses all discussion entries for the given goal.
// If the file does not exist, it returns an empty slice and no error.
func (m *discussionManager) Load(goalID string) ([]model.DiscussionEntry, error) {
	if strings.TrimSpace(goalID) == "" {
		return nil, custom_errors.NewErrConflict("goalID cannot be empty")
	}

	path := m.discussionPath(goalID)
	data, err := fileutil.ReadFile(path)
	if err != nil {
		// If the file doesn't exist, return empty list (not an error)
		if _, ok := err.(*custom_errors.ErrNotFound); ok {
			return []model.DiscussionEntry{}, nil
		}
		return nil, err
	}

	entries, err := parseYAMLEntries(data)
	if err != nil {
		return nil, fmt.Errorf("failed parsing discussion file '%s': %w", path, err)
	}

	return entries, nil
}

// AddEntry appends a new discussion entry for the given goal.
// If entry.ID is empty, it assigns the next sequential ID using the form "DNN".
// If entry.Timestamp is zero, it sets it to time.Now().
// This method appends a YAML block to the bottom of the file atomically.
func (m *discussionManager) AddEntry(goalID string, entry *model.DiscussionEntry) error {
	if strings.TrimSpace(goalID) == "" {
		return custom_errors.NewErrConflict("goalID cannot be empty")
	}
	if entry == nil {
		return custom_errors.NewErrConflict("entry cannot be nil")
	}
	if strings.TrimSpace(entry.Type) == "" {
		entry.Type = "discussion"
	}
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}

	path := m.discussionPath(goalID)

	// Read current file (if any) to compute next ID and append content.
	existing, err := fileutil.ReadFile(path)
	if err != nil {
		// If not found, treat as empty file
		if _, ok := err.(*custom_errors.ErrNotFound); ok {
			existing = nil
		} else {
			return err
		}
	}

	// Assign ID if missing
	if strings.TrimSpace(entry.ID) == "" {
		current, _ := parseYAMLEntries(existing) // ignore parse errors here; if malformed we still try to append
		entry.ID = nextDiscussionID(current)
	}

	// Build YAML block for the entry
	block, err := marshalEntryYAML(*entry)
	if err != nil {
		return err
	}

	var out bytes.Buffer
	out.Write(existing)
	trimmed := bytes.TrimSpace(existing)
	if len(trimmed) > 0 && !bytes.HasSuffix(existing, []byte("\n")) {
		out.WriteString("\n")
	}
	// Ensure a single blank line separation between blocks for readability
	if len(trimmed) > 0 {
		out.WriteString("\n")
	}
	out.Write(block)
	// Ensure trailing newline at EOF
	if !bytes.HasSuffix(block, []byte("\n")) {
		out.WriteString("\n")
	}

	if err := fileutil.WriteFile(path, out.Bytes(), 0o644); err != nil {
		return err
	}
	return nil
}

// marshalEntryYAML serializes a DiscussionEntry into a YAML front-matter style block delimited by "---".
func marshalEntryYAML(e model.DiscussionEntry) ([]byte, error) {
	// Use an intermediate struct for clean YAML keys
	type entryYAML struct {
		ID        string    `yaml:"id"`
		Type      string    `yaml:"type"`
		Timestamp time.Time `yaml:"timestamp"`
		Content   string    `yaml:"content"`
	}
	payload := entryYAML{
		ID:        e.ID,
		Type:      e.Type,
		Timestamp: e.Timestamp,
		Content:   e.Content,
	}

	data, err := yaml.Marshal(&payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode discussion entry yaml: %w", err)
	}

	var buf bytes.Buffer
	buf.WriteString("---\n")
	buf.Write(data)
	// Ensure block is closed with '---' delimiter
	// Add a trailing newline before closing delimiter if not present
	if len(data) > 0 && data[len(data)-1] != '\n' {
		buf.WriteString("\n")
	}
	buf.WriteString("---\n")
	return buf.Bytes(), nil
}

// parseYAMLEntries scans the file content for YAML blocks delimited by lines with only '---'
// and decodes each block into a DiscussionEntry.
func parseYAMLEntries(data []byte) ([]model.DiscussionEntry, error) {
	var entries []model.DiscussionEntry

	sc := bufio.NewScanner(bytes.NewReader(data))
	sc.Buffer(make([]byte, 0, 64*1024), 10*1024*1024) // allow large entries

	const delim = "---"
	var inBlock bool
	var block bytes.Buffer

	for sc.Scan() {
		line := sc.Text()
		if strings.TrimSpace(line) == delim {
			// Toggle block state
			if !inBlock {
				// Starting a new block
				inBlock = true
				block.Reset()
				continue
			} else {
				// Closing the current block: parse it
				b := block.Bytes()
				// decode YAML
				type entryYAML struct {
					ID        string    `yaml:"id"`
					Type      string    `yaml:"type"`
					Timestamp time.Time `yaml:"timestamp"`
					Content   string    `yaml:"content"`
				}
				var y entryYAML
				if err := yaml.Unmarshal(b, &y); err == nil {
					// Only accept entries with at least an ID or Content
					if strings.TrimSpace(y.ID) != "" || strings.TrimSpace(y.Content) != "" {
						entries = append(entries, model.DiscussionEntry{
							ID:        strings.TrimSpace(y.ID),
							Type:      strings.TrimSpace(y.Type),
							Content:   y.Content, // keep exact content, including newlines
							Timestamp: y.Timestamp,
						})
					}
				}
				// Done with this block
				inBlock = false
				block.Reset()
				continue
			}
		}

		if inBlock {
			block.WriteString(line)
			block.WriteString("\n")
		}
	}

	if err := sc.Err(); err != nil {
		return nil, err
	}

	return entries, nil
}

// nextDiscussionID returns the next sequential ID in the form "DNN", using the
// maximum existing numeric suffix + 1. If no entries exist, returns "D01".
// If higher numbers exist (e.g., D120), it will not truncate; width grows as needed.
func nextDiscussionID(entries []model.DiscussionEntry) string {
	re := regexp.MustCompile(`^D(\d+)$`)
	max := 0
	for _, e := range entries {
		m := re.FindStringSubmatch(strings.TrimSpace(e.ID))
		if len(m) == 2 {
			// ignore parse error safely
			var n int
			fmt.Sscanf(m[1], "%d", &n)
			if n > max {
				max = n
			}
		}
	}
	n := max + 1
	if n < 100 {
		return fmt.Sprintf("D%02d", n)
	}
	return fmt.Sprintf("D%d", n)
}
