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

	changeCmd = &cobra.Command{
		Use:   "change",
		Short: "Work with changes",
		Long:  "Commands for listing, applying, and archiving changes.",
	}

	changeListCmd = &cobra.Command{
		Use:   "list",
		Short: "List changes",
		RunE:  runChangeList,
	}

	changeApplyCmd = &cobra.Command{
		Use:   "apply",
		Short: "Apply a change by ID",
		RunE:  runChangeApply,
	}

	changeArchiveCmd = &cobra.Command{
		Use:   "archive",
		Short: "Archive a change by ID",
		RunE:  runChangeArchive,
	}

	// Flags
	specsBaseDir   string
	goalsBaseDir   string
	goalID         string
	changesBaseDir string
	changeID       string
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

	// Attach change hierarchy: root -> change -> [list|apply|archive]
	rootCmd.AddCommand(changeCmd)
	changeCmd.AddCommand(changeListCmd)
	changeCmd.AddCommand(changeApplyCmd)
	changeCmd.AddCommand(changeArchiveCmd)

	// Flags
	specCmd.PersistentFlags().StringVar(&specsBaseDir, "specs-dir", ".teamwerx/specs", "Base directory containing spec domains")
	planCmd.PersistentFlags().StringVar(&goalsBaseDir, "goals-dir", ".teamwerx/goals", "Base directory containing goals")
	planAddCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID to add the task to")
	_ = planAddCmd.MarkFlagRequired("goal")

	changeCmd.PersistentFlags().StringVar(&changesBaseDir, "changes-dir", ".teamwerx/changes", "Base directory containing changes")
	changeApplyCmd.Flags().StringVar(&changeID, "id", "", "Change ID to apply")
	_ = changeApplyCmd.MarkFlagRequired("id")
	changeArchiveCmd.Flags().StringVar(&changeID, "id", "", "Change ID to archive")
	_ = changeArchiveCmd.MarkFlagRequired("id")
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

func runChangeList(cmd *cobra.Command, args []string) error {
	sm := core.NewSpecManager(specsBaseDir)
	merger := core.NewSpecMerger(sm)
	cm := core.NewChangeManager(changesBaseDir, sm, merger)

	changes, err := cm.ListChanges()
	if err != nil {
		return fmt.Errorf("failed to list changes: %w", err)
	}

	if len(changes) == 0 {
		color.Yellow("No changes found.")
		return nil
	}

	ok := color.New(color.FgGreen, color.Bold)
	ok.Printf("Found %d change(s):\n", len(changes))
	for _, ch := range changes {
		title := color.New(color.FgWhite, color.Bold)
		title.Printf("- ID: %s\n", ch.ID)
		fmt.Printf("  Title: %s\n", ch.Title)
		fmt.Printf("  Status: %s\n", ch.Status)
		fmt.Printf("  Spec deltas: %d\n", len(ch.SpecDeltas))
	}
	return nil
}

func runChangeApply(cmd *cobra.Command, args []string) error {
	if strings.TrimSpace(changeID) == "" {
		return fmt.Errorf("change id is required")
	}

	sm := core.NewSpecManager(specsBaseDir)
	merger := core.NewSpecMerger(sm)
	cm := core.NewChangeManager(changesBaseDir, sm, merger)

	ch, err := cm.ReadChange(changeID)
	if err != nil {
		return fmt.Errorf("failed to read change: %w", err)
	}
	if err := cm.ApplyChange(ch); err != nil {
		return fmt.Errorf("failed to apply change: %w", err)
	}

	color.New(color.FgGreen).Printf("Applied change %s: %s\n", ch.ID, ch.Title)
	return nil
}

func runChangeArchive(cmd *cobra.Command, args []string) error {
	if strings.TrimSpace(changeID) == "" {
		return fmt.Errorf("change id is required")
	}

	sm := core.NewSpecManager(specsBaseDir)
	merger := core.NewSpecMerger(sm)
	cm := core.NewChangeManager(changesBaseDir, sm, merger)

	ch, err := cm.ReadChange(changeID)
	if err != nil {
		return fmt.Errorf("failed to read change: %w", err)
	}
	if err := cm.ArchiveChange(ch); err != nil {
		return fmt.Errorf("failed to archive change: %w", err)
	}

	color.New(color.FgGreen).Printf("Archived change %s: %s\n", ch.ID, ch.Title)
	return nil
}
