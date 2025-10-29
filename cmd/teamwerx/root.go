package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/teamwerx/teamwerx/internal/core"
	custom_errors "github.com/teamwerx/teamwerx/internal/errors"
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

	planListCmd = &cobra.Command{
		Use:   "list",
		Short: "List tasks for a goal's plan",
		RunE:  runPlanList,
	}

	planCompleteCmd = &cobra.Command{
		Use:   "complete",
		Short: "Mark a plan task as completed",
		RunE:  runPlanComplete,
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

	changeResolveCmd = &cobra.Command{
		Use:   "resolve",
		Short: "Interactively resolve change conflicts",
		Long:  "Resolve ErrDiverged conflicts when applying a change by allowing refresh/skip/cancel per domain, then re-apply.",
		RunE:  runChangeResolve,
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

	charterCmd = &cobra.Command{
		Use:   "charter",
		Short: "Work with project charter",
		Long:  "Commands for creating and viewing the project charter - your project's steering document.",
	}

	charterInitCmd = &cobra.Command{
		Use:   "init",
		Short: "Initialize project charter",
		RunE:  runCharterInit,
	}

	charterShowCmd = &cobra.Command{
		Use:   "show",
		Short: "Display project charter",
		RunE:  runCharterShow,
	}

	completionCmd = &cobra.Command{
		Use:   "completion [bash|zsh|fish|powershell]",
		Short: "Generate shell completion scripts",
		Args:  cobra.ExactArgs(1),
		RunE:  runCompletion,
	}

	// Flags
	specsBaseDir   string
	goalsBaseDir   string
	goalID         string
	changesBaseDir string
	charterBaseDir string
	changeID       string
	taskID         string
)

// Execute runs the root command (to be called by main in future integration).
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	// Attach hierarchy: root -> spec -> list
	rootCmd.AddCommand(specCmd)
	specCmd.AddCommand(specListCmd)
	specShowCmd := &cobra.Command{
		Use:   "show",
		Short: "Show details for a spec domain",
		Args:  cobra.ExactArgs(1),
		RunE:  runSpecShow,
	}
	specCmd.AddCommand(specShowCmd)

	// Attach plan hierarchy: root -> plan -> add
	rootCmd.AddCommand(planCmd)
	planCmd.AddCommand(planAddCmd)
	planCmd.AddCommand(planListCmd)
	planCmd.AddCommand(planCompleteCmd)
	planShowCmd := &cobra.Command{
		Use:   "show",
		Short: "Show a goal's plan details",
		RunE:  runPlanShow,
	}
	planCmd.AddCommand(planShowCmd)
	planShowCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID to show plan for")
	_ = planShowCmd.MarkFlagRequired("goal")

	// Attach change hierarchy: root -> change -> [list|apply|archive]
	rootCmd.AddCommand(changeCmd)
	changeCmd.AddCommand(changeListCmd)
	changeCmd.AddCommand(changeApplyCmd)
	changeCmd.AddCommand(changeArchiveCmd)
	changeCmd.AddCommand(changeResolveCmd) // TODO: interactive conflict resolution scaffolding

	// Attach discuss hierarchy: root -> discuss -> [list|add]
	rootCmd.AddCommand(discussCmd)
	discussCmd.AddCommand(discussListCmd)
	discussCmd.AddCommand(discussAddCmd)

	// Attach charter hierarchy: root -> charter -> [init|show]
	rootCmd.AddCommand(charterCmd)
	charterCmd.AddCommand(charterInitCmd)
	charterCmd.AddCommand(charterShowCmd)

	// Completion command
	rootCmd.AddCommand(completionCmd)

	// Flags for discuss
	discussCmd.PersistentFlags().StringVar(&goalsBaseDir, "goals-dir", ".teamwerx/goals", "Base directory containing goals")
	discussListCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID")
	_ = discussListCmd.MarkFlagRequired("goal")
	discussAddCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID")
	_ = discussAddCmd.MarkFlagRequired("goal")

	// Flags
	specCmd.PersistentFlags().StringVar(&specsBaseDir, "specs-dir", ".teamwerx/specs", "Base directory containing spec domains")
	specCmd.PersistentFlags().StringVar(&goalsBaseDir, "goals-dir", ".teamwerx/goals", "Base directory containing goals")
	specCmd.PersistentFlags().StringVar(&changesBaseDir, "changes-dir", ".teamwerx/changes", "Base directory containing changes")
	planCmd.PersistentFlags().StringVar(&goalsBaseDir, "goals-dir", ".teamwerx/goals", "Base directory containing goals")
	planAddCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID to add the task to")
	_ = planAddCmd.MarkFlagRequired("goal")

	planListCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID to list tasks for")
	_ = planListCmd.MarkFlagRequired("goal")

	planCompleteCmd.Flags().StringVar(&goalID, "goal", "", "Goal ID")
	planCompleteCmd.Flags().StringVar(&taskID, "task", "", "Task ID to complete (e.g., T01)")
	_ = planCompleteCmd.MarkFlagRequired("goal")
	_ = planCompleteCmd.MarkFlagRequired("task")

	changeCmd.PersistentFlags().StringVar(&changesBaseDir, "changes-dir", ".teamwerx/changes", "Base directory containing changes")
	changeApplyCmd.Flags().StringVar(&changeID, "id", "", "Change ID to apply")
	_ = changeApplyCmd.MarkFlagRequired("id")
	changeArchiveCmd.Flags().StringVar(&changeID, "id", "", "Change ID to archive")
	_ = changeArchiveCmd.MarkFlagRequired("id")
	changeResolveCmd.Flags().StringVar(&changeID, "id", "", "Change ID to resolve conflicts for")
	_ = changeResolveCmd.MarkFlagRequired("id")

	charterCmd.PersistentFlags().StringVar(&charterBaseDir, "charter-dir", ".teamwerx", "Base directory for charter")
}

func runSpecList(cmd *cobra.Command, args []string) error {
	// Prompt user to confirm or cancel (defaults to List specs in non-interactive environments)
	if idx, choice, err := promptutil.Select("Select action", []string{"List specs", "Cancel"}, 0); err != nil {
		return fmt.Errorf("prompt failed: %w", err)
	} else if idx != 0 || choice != "List specs" {
		color.Yellow("Cancelled.")
		return nil
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

func runPlanList(cmd *cobra.Command, args []string) error {
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

	plan, err := app.PlanManager.Load(goalID)
	if err != nil {
		color.Yellow("No plan found for goal %s.", goalID)
		return nil
	}

	ok := color.New(color.FgGreen, color.Bold)
	ok.Printf("Tasks for goal %s (%d):\n", goalID, len(plan.Tasks))
	for _, t := range plan.Tasks {
		status := t.Status
		if strings.TrimSpace(status) == "" {
			status = "pending"
		}
		fmt.Printf("- %s [%s] %s\n", t.ID, status, t.Title)
	}
	return nil
}

func runPlanComplete(cmd *cobra.Command, args []string) error {
	if strings.TrimSpace(goalID) == "" {
		return fmt.Errorf("goal id is required")
	}
	if strings.TrimSpace(taskID) == "" {
		return fmt.Errorf("task id is required")
	}

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	plan, err := app.PlanManager.Load(goalID)
	if err != nil {
		return fmt.Errorf("failed to load plan: %w", err)
	}

	found := false
	for i := range plan.Tasks {
		if strings.EqualFold(plan.Tasks[i].ID, taskID) {
			plan.Tasks[i].Status = "completed"
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("task %s not found in goal %s", taskID, goalID)
	}

	if err := app.PlanManager.Save(plan); err != nil {
		return fmt.Errorf("failed to save plan: %w", err)
	}

	color.New(color.FgGreen).Printf("Marked task %s as completed for goal %s\n", taskID, goalID)
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

// change resolve: interactively handle ErrDiverged conflicts by allowing the user
// to refresh base fingerprints from current specs or skip conflicting domains, then
// re-apply the change. Saves any updates to the change file on success.
func runChangeResolve(cmd *cobra.Command, args []string) error {
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

	for {
		// Attempt to apply the full change
		if err := app.ChangeManager.ApplyChange(ch); err == nil {
			color.New(color.FgGreen).Printf("Applied change %s: %s\n", ch.ID, ch.Title)
			// Persist updated change (e.g., refreshed BaseFingerprints or pruned deltas)
			_ = app.ChangeManager.Save(ch)
			return nil
		} else {
			// Check for divergence conflicts
			if de, ok := err.(*custom_errors.ErrDiverged); ok && de != nil {
				color.Yellow("Conflict detected for domain '%s' (base=%s current=%s)", de.Domain, de.BaseFingerprint, de.CurrentFingerprint)

				// Offer resolution choices
				opts := []string{
					"Refresh base fingerprint from current spec and retry",
					"Skip this domain and continue",
					"Cancel",
				}
				idx, _, perr := promptutil.Select("Choose a resolution", opts, 0)
				if perr != nil {
					return fmt.Errorf("prompt failed: %w", perr)
				}

				switch idx {
				case 0: // Refresh base fingerprint and retry
					// Read current spec to obtain its fingerprint
					spec, rerr := app.SpecManager.ReadSpec(de.Domain)
					if rerr != nil {
						return fmt.Errorf("failed to read current spec for '%s': %w", de.Domain, rerr)
					}
					// Update BaseFingerprint for the conflicting delta
					for i := range ch.SpecDeltas {
						if ch.SpecDeltas[i].Domain == de.Domain {
							ch.SpecDeltas[i].BaseFingerprint = spec.Fingerprint
						}
					}
					// Loop and retry apply
					continue

				case 1: // Skip this domain and continue
					pruned := ch.SpecDeltas[:0]
					for i := range ch.SpecDeltas {
						if ch.SpecDeltas[i].Domain != de.Domain {
							pruned = append(pruned, ch.SpecDeltas[i])
						}
					}
					ch.SpecDeltas = pruned
					if len(ch.SpecDeltas) == 0 {
						color.Yellow("All deltas skipped; nothing to apply.")
						_ = app.ChangeManager.Save(ch)
						return nil
					}
					// Loop and retry apply with remaining deltas
					continue

				default: // Cancel
					color.Yellow("Cancelled by user. No changes were applied.")
					return nil
				}
			}

			// Non-divergence error: surface to caller
			return fmt.Errorf("failed to apply change: %w", err)
		}
	}
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

func runSpecShow(cmd *cobra.Command, args []string) error {
	domain := strings.TrimSpace(args[0])
	if domain == "" {
		return fmt.Errorf("domain is required")
	}

	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	spec, err := app.SpecManager.ReadSpec(domain)
	if err != nil {
		return fmt.Errorf("failed to read spec: %w", err)
	}

	hdr := color.New(color.FgGreen, color.Bold)
	hdr.Printf("Spec: %s\n", spec.Domain)
	fmt.Printf("Requirements: %d\n", len(spec.Requirements))

	max := len(spec.Requirements)
	if max > 10 {
		max = 10
	}
	for i := 0; i < max; i++ {
		r := spec.Requirements[i]
		fmt.Printf("- %s (%s)\n", r.Title, r.ID)
	}

	return nil
}

func runPlanShow(cmd *cobra.Command, args []string) error {
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

	plan, err := app.PlanManager.Load(goalID)
	if err != nil {
		return fmt.Errorf("failed to load plan: %w", err)
	}

	hdr := color.New(color.FgGreen, color.Bold)
	hdr.Printf("Plan for goal %s\n", goalID)
	if !plan.UpdatedAt.IsZero() {
		fmt.Printf("Updated: %s\n", plan.UpdatedAt.Format(time.RFC3339))
	}
	fmt.Printf("Tasks (%d):\n", len(plan.Tasks))
	for _, t := range plan.Tasks {
		status := strings.TrimSpace(t.Status)
		if status == "" {
			status = "pending"
		}
		fmt.Printf("- %s [%s] %s\n", t.ID, status, t.Title)
	}

	return nil
}

func runCompletion(cmd *cobra.Command, args []string) error {
	if len(args) != 1 {
		return fmt.Errorf("one shell must be specified: bash|zsh|fish|powershell")
	}
	switch args[0] {
	case "bash":
		return rootCmd.GenBashCompletion(os.Stdout)
	case "zsh":
		return rootCmd.GenZshCompletion(os.Stdout)
	case "fish":
		return rootCmd.GenFishCompletion(os.Stdout, true)
	case "powershell":
		return rootCmd.GenPowerShellCompletionWithDesc(os.Stdout)
	default:
		return fmt.Errorf("unsupported shell: %s", args[0])
	}
}

func runCharterInit(cmd *cobra.Command, args []string) error {
	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
		CharterDir: charterBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	// Check if charter already exists
	if app.CharterManager.Exists() {
		color.Yellow("Charter already exists. Edit .teamwerx/charter.md directly or use 'teamwerx charter show' to view it.")
		return nil
	}

	// Create default charter
	charter := &model.Charter{
		Title:   "Project Charter",
		Version: "1.0.0",
		Purpose: "Define the purpose and goals of this project",
		TechStack: []string{
			"Add your technology stack here",
		},
		Conventions: map[string]interface{}{
			"commit_prefix": "[PROJECT]",
			"branch_naming": "feature/*, bugfix/*",
		},
		Content: `# Project Charter

## Purpose

[Describe the purpose and vision of this project]

## Governance

[Define decision-making processes, approval workflows, etc.]

## Standards

[Document coding standards, conventions, and best practices]

## AI Agent Instructions

[Specific instructions for AI coding assistants working on this project]
`,
	}

	if err := app.CharterManager.Write(charter); err != nil {
		return fmt.Errorf("failed to write charter: %w", err)
	}

	ok := color.New(color.FgGreen, color.Bold)
	ok.Println("Charter initialized at .teamwerx/charter.md")
	fmt.Println("\nEdit the file to customize your project's steering document.")
	fmt.Println("This charter will guide AI agents and team members throughout the project.")

	return nil
}

func runCharterShow(cmd *cobra.Command, args []string) error {
	app, err := core.NewApp(core.AppOptions{
		SpecsDir:   specsBaseDir,
		GoalsDir:   goalsBaseDir,
		ChangesDir: changesBaseDir,
		CharterDir: charterBaseDir,
	})
	if err != nil {
		return fmt.Errorf("failed to init app: %w", err)
	}

	charter, err := app.CharterManager.Read()
	if err != nil {
		color.Yellow("No charter found. Run 'teamwerx charter init' to create one.")
		return nil
	}

	// Display charter
	hdr := color.New(color.FgCyan, color.Bold)
	hdr.Printf("Charter: %s\n", charter.Title)

	if charter.Version != "" {
		fmt.Printf("Version: %s\n", charter.Version)
	}
	if !charter.Created.IsZero() {
		fmt.Printf("Created: %s\n", charter.Created.Format("2006-01-02"))
	}
	if !charter.Updated.IsZero() {
		fmt.Printf("Updated: %s\n", charter.Updated.Format("2006-01-02"))
	}

	if charter.Purpose != "" {
		fmt.Printf("\nPurpose: %s\n", charter.Purpose)
	}

	if len(charter.TechStack) > 0 {
		fmt.Println("\nTech Stack:")
		for _, tech := range charter.TechStack {
			fmt.Printf("  - %s\n", tech)
		}
	}

	if len(charter.Conventions) > 0 {
		fmt.Println("\nConventions:")
		for key, val := range charter.Conventions {
			fmt.Printf("  %s: %v\n", key, val)
		}
	}

	if charter.Content != "" {
		fmt.Println("\n" + charter.Content)
	}

	return nil
}
