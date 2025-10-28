package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/manifoldco/promptui"
	"github.com/mattn/go-isatty"
	"github.com/spf13/cobra"
	"github.com/teamwerx/teamwerx/internal/core"
	"github.com/teamwerx/teamwerx/internal/model"
	promptutil "github.com/teamwerx/teamwerx/internal/utils/prompt"
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

	discussCmd = &cobra.Command{
		Use:   "discuss",
		Short: "Work with discussions",
		Long:  "Commands for listing and adding discussion entries.",
	}

	discussListCmd = &cobra.Command{
		Use:   "list",
		Short: "List discussion entries for a goal",
		RunE:  runDiscussList,
	}

	discussAddCmd = &cobra.Command{
		Use:   "add",
		Short: "Add a discussion entry to a goal",
		Args:  cobra.ArbitraryArgs,
		RunE:  runDiscussAdd,
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

	// Attach discuss hierarchy: root -> discuss -> [list|add]
	rootCmd.AddCommand(discussCmd)
	discussCmd.AddCommand(discussListCmd)
	discussCmd.AddCommand(discussAddCmd)

	// Flags for discuss
	discussCmd.PersistentFlags().StringVar(&goalsBaseDir, "goals-dir", ".teamwerx/goals", "Base directory containing goals")
	discussListCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID")
	_ = discussListCmd.MarkFlagRequired("goal")
	discussAddCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID")
	_ = discussAddCmd.MarkFlagRequired("goal")

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

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}
	specs, err := app.SpecManager.ListSpecs()
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

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	// Try to load existing plan; if not found, start a new one.
	plan, err := app.PlanManager.Load(goalID)
	if err != nil {
		plan = &model.Plan{
			GoalID: goalID,
			Tasks:  []model.Task{},
		}
	}

	if _, err := app.PlanManager.AddTask(plan, title); err != nil {
		return err
	}
	if err := app.PlanManager.Save(plan); err != nil {
		return err
	}

	color.New(color.FgGreen).Printf("Added task to goal %s: %s\n", goalID, title)
	return nil
}

func runChangeList(cmd *cobra.Command, args []string) error {
	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}
	changes, err := app.ChangeManager.ListChanges()
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

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	ch, err := app.ChangeManager.ReadChange(changeID)
	if err != nil {
		return fmt.Errorf("failed to read change: %w", err)
	}
	if err := app.ChangeManager.ApplyChange(ch); err != nil {
		return fmt.Errorf("failed to apply change: %w", err)
	}

	color.New(color.FgGreen).Printf("Applied change %s: %s\n", ch.ID, ch.Title)
	return nil
}

func runChangeArchive(cmd *cobra.Command, args []string) error {
	if strings.TrimSpace(changeID) == "" {
		return fmt.Errorf("change id is required")
	}

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	ch, err := app.ChangeManager.ReadChange(changeID)
	if err != nil {
		return fmt.Errorf("failed to read change: %w", err)
	}
	if err := app.ChangeManager.ArchiveChange(ch); err != nil {
		return fmt.Errorf("failed to archive change: %w", err)
	}

	color.New(color.FgGreen).Printf("Archived change %s: %s\n", ch.ID, ch.Title)
	return nil
}

func runDiscussList(cmd *cobra.Command, args []string) error {
	if strings.TrimSpace(goalID) == "" {
		return fmt.Errorf("goal id is required")
	}

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	entries, err := app.DiscussionManager.Load(goalID)
	if err != nil {
		return fmt.Errorf("failed to load discussion entries: %w", err)
	}

	if len(entries) == 0 {
		color.Yellow("No discussion entries found for goal %s.", goalID)
		return nil
	}

	hdr := color.New(color.FgGreen, color.Bold)
	hdr.Printf("Found %d discussion entrie(s) for goal %s:\n", len(entries), goalID)

	for _, e := range entries {
		title := color.New(color.FgWhite, color.Bold)
		title.Printf("- %s ", e.ID)
		fmt.Printf("[%s] ", strings.TrimSpace(e.Type))
		if !e.Timestamp.IsZero() {
			fmt.Printf("%s ", e.Timestamp.Format(time.RFC3339))
		}
		// Print first line of content as a preview
		firstLine := strings.SplitN(strings.TrimSpace(e.Content), "\n", 2)[0]
		if firstLine != "" {
			fmt.Printf("- %s", firstLine)
		}
		fmt.Println()
	}

	return nil
}

func runDiscussAdd(cmd *cobra.Command, args []string) error {
	if strings.TrimSpace(goalID) == "" {
		return fmt.Errorf("goal id is required")
	}

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	// Determine message content
	message := strings.TrimSpace(strings.Join(args, " "))
	if message == "" {
		if v, perr := promptutil.Input("Discussion message", ""); perr == nil {
			message = strings.TrimSpace(v)
		} else {
			return fmt.Errorf("failed to prompt for message: %w", perr)
		}
	}
	if message == "" {
		return fmt.Errorf("discussion message cannot be empty")
	}

	// Determine entry type (discussion|reflection)
	entryType := "discussion"
	types := []string{"discussion", "reflection"}
	if idx, choice, _ := promptutil.Select("Entry type", types, 0); idx >= 0 && choice != "" {
		entryType = choice
	}

	entry := model.DiscussionEntry{
		Type:    entryType,
		Content: message,
	}
	if err := app.DiscussionManager.AddEntry(goalID, &entry); err != nil {
		return fmt.Errorf("failed to add discussion entry: %w", err)
	}

	color.New(color.FgGreen).Printf("Added discussion entry %s to goal %s\n", entry.ID, goalID)
	return nil
}
