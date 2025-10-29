package prompt

import (
	"fmt"
	"os"
	"strings"

	"github.com/manifoldco/promptui"
	"github.com/mattn/go-isatty"
)

// Options controls behavior for prompt helpers.
type Options struct {
	// ForceInteractive overrides detection: if set, true forces interactive mode, false forces non-interactive.
	// When nil, detection falls back to IsInteractive() heuristics.
	ForceInteractive *bool
}

// DefaultOptions provides global options used by helper functions.
// You can override ForceInteractive here for tests or controlled environments.
var DefaultOptions Options

// IsInteractive reports whether interactive prompts should be used.
//
// Heuristics:
// - If DefaultOptions.ForceInteractive is set, returns its value.
// - Otherwise returns false in CI-like environments (TEAMWERX_CI or CI=true).
// - Otherwise returns true only if both stdin and stdout are TTYs.
func IsInteractive() bool {
	if DefaultOptions.ForceInteractive != nil {
		return *DefaultOptions.ForceInteractive
	}

	// Common CI environment flags
	if os.Getenv("TEAMWERX_CI") != "" || strings.EqualFold(os.Getenv("CI"), "true") {
		return false
	}

	stdoutTTY := isatty.IsTerminal(os.Stdout.Fd()) || isatty.IsCygwinTerminal(os.Stdout.Fd())
	stdinTTY := isatty.IsTerminal(os.Stdin.Fd()) || isatty.IsCygwinTerminal(os.Stdin.Fd())
	return stdoutTTY && stdinTTY
}

// Confirm prompts the user with a Yes/No choice.
// - In non-interactive mode, returns defaultYes without prompting.
// - In interactive mode, presents a select prompt with Yes/No.
// Returns true for Yes, false for No.
func Confirm(label string, defaultYes bool) (bool, error) {
	if !IsInteractive() {
		return defaultYes, nil
	}

	items := []string{"Yes", "No"}
	defIdx := 0
	if !defaultYes {
		defIdx = 1
	}

	sel := promptui.Select{
		Label: labelWithDefault(label, items[defIdx]),
		Items: items,
		Size:  min(2, 10),
	}
	_, choice, err := sel.Run()
	if err != nil {
		return false, fmt.Errorf("prompt confirm failed: %w", err)
	}

	return strings.HasPrefix(strings.ToLower(choice), "y"), nil
}

// Select presents a list of items for the user to choose from.
// - In non-interactive mode, returns the defaultIndex (clamped to valid range).
// - In interactive mode, shows a select prompt.
// Returns the chosen index and value.
func Select(label string, items []string, defaultIndex int) (int, string, error) {
	if len(items) == 0 {
		return -1, "", fmt.Errorf("no items to select from")
	}

	if defaultIndex < 0 || defaultIndex >= len(items) {
		defaultIndex = 0
	}

	if !IsInteractive() {
		return defaultIndex, items[defaultIndex], nil
	}

	sel := promptui.Select{
		Label: labelWithDefault(label, items[defaultIndex]),
		Items: items,
		Size:  min(len(items), 10),
	}
	idx, choice, err := sel.Run()
	if err != nil {
		return -1, "", fmt.Errorf("prompt select failed: %w", err)
	}
	return idx, choice, nil
}

// Input prompts the user for free-form text input.
// - In non-interactive mode, returns defaultValue.
// - In interactive mode, shows an input prompt with the default pre-filled.
func Input(label string, defaultValue string) (string, error) {
	if !IsInteractive() {
		return defaultValue, nil
	}

	p := promptui.Prompt{
		Label:   labelWithDefault(label, defaultValue),
		Default: defaultValue,
	}
	result, err := p.Run()
	if err != nil {
		return "", fmt.Errorf("prompt input failed: %w", err)
	}
	if strings.TrimSpace(result) == "" {
		return defaultValue, nil
	}
	return result, nil
}

// Helper to compose a label with a visible default hint in interactive prompts.
func labelWithDefault(label, def string) string {
	def = strings.TrimSpace(def)
	if def == "" {
		return label
	}
	return fmt.Sprintf("%s (default: %s)", label, def)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
