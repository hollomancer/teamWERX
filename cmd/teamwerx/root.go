package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/fatih/color"
	"github.com/manifoldco/promptui"
	"github.com/mattn/go-isatty"
	"github.com/spf13/cobra"
	"github.com/teamwerx/teamwerx/internal/core"
	"github.com/teamwerx/teamwerx/internal/model"
)

var (
	rootCmd = &cobra.Command{
		Use:           "teamwerx",
		Short:         "teamWERX CLI (Go)",
		Long:          "teamWERX: Goal-based development workflow, now with a Go CLI.",
		SilenceUsage:  true,
		SilenceErrors: true,
	}

	specCmd = &cobra.Command{
		Use:   "spec",
		Short: "Work with specs",
		Long:  "Commands for listing, inspecting, and modifying specs.",
	}

	specListCmd = &cobra.Command{
		Use:   "list",
		Short: "List available specs",
		RunE:  runSpecList,
	}

	planCmd = &cobra.Command{
		Use:   "plan",
		Short: "Work with plans",
		Long:  "Commands for planning tasks for goals.",
	}

	planAddCmd = &cobra.Command{
		Use:   "add",
		Short: "Add a task to a goal's plan",
		Args:  cobra.MinimumNArgs(1),
		RunE:  runPlanAdd,
	}

	// Flags
	specsBaseDir string
	goalsBaseDir string
	goalID       string
)

// Execute runs the root command (to be called by main in future integration).
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	// Attach hierarchy: root -> spec -> list
	rootCmd.AddCommand(specCmd)
	specCmd.AddCommand(specListCmd)

	// Attach plan hierarchy: root -> plan -> add
	rootCmd.AddCommand(planCmd)
	planCmd.AddCommand(planAddCmd)

	// Flags
	specCmd.PersistentFlags().StringVar(&specsBaseDir, "specs-dir", ".teamwerx/specs", "Base directory containing spec domains")
	planCmd.PersistentFlags().StringVar(&goalsBaseDir, "goals-dir", ".teamwerx/goals", "Base directory containing goals")
	planAddCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID to add the task to")
	_ = planAddCmd.MarkFlagRequired("goal")
}

func runSpecList(cmd *cobra.Command, args []string) error {
	// In non-interactive or CI environments, skip prompt and proceed
	isCI := os.Getenv("TEAMWERX_CI") != ""
	isTTY := isatty.IsTerminal(os.Stdout.Fd()) || isatty.IsCygwinTerminal(os.Stdout.Fd())
	if !(isCI || !isTTY) {
		// Prompt user to confirm or cancel
		actionPrompt := promptui.Select{
			Label: "Select action",
			Items: []string{"List specs", "Cancel"},
			Size:  2,
		}

		choiceIdx, choice, err := actionPrompt.Run()
		if err != nil {
			return fmt.Errorf("prompt failed: %w", err)
		}
		if choiceIdx != 0 || choice != "List specs" {
			color.Yellow("Cancelled.")
			return nil
		}
	}

	// Proceed to list specs
	hdr := color.New(color.FgCyan, color.Bold)
	hdr.Printf("Scanning specs directory: %s\n", specsBaseDir)

	specManager := core.NewSpecManager(specsBaseDir)
	specs, err := specManager.ListSpecs()
	if err != nil {
		return fmt.Errorf("failed to list specs: %w", err)
	}

	if len(specs) == 0 {
		color.Yellow("No specs found.")
		return nil
	}

	ok := color.New(color.FgGreen, color.Bold)
	ok.Printf("Found %d spec(s):\n", len(specs))

	for _, spec := range specs {
		title := color.New(color.FgWhite, color.Bold)
		title.Printf("- Domain: %s\n", spec.Domain)

		subtle := color.New(color.Faint)
		subtle.Printf("  Requirements (%d):\n", len(spec.Requirements))

		for _, req := range spec.Requirements {
			fmt.Printf("    - %s ", req.Title)
			subtle.Printf("(id=%s)\n", req.ID)
		}
	}

	return nil
}

func runPlanAdd(cmd *cobra.Command, args []string) error {
	title := strings.TrimSpace(strings.Join(args, " "))
	if title == "" {
		return fmt.Errorf("task title cannot be empty")
	}

	pm := core.NewPlanManager(goalsBaseDir)

	// Try to load existing plan; if not found, start a new one.
	plan, err := pm.Load(goalID)
	if err != nil {
		plan = &model.Plan{
			GoalID: goalID,
			Tasks:  []model.Task{},
		}
	}

	if _, err := pm.AddTask(plan, title); err != nil {
		return err
	}
	if err := pm.Save(plan); err != nil {
		return err
	}

	color.New(color.FgGreen).Printf("Added task to goal %s: %s\n", goalID, title)
	return nil
}
