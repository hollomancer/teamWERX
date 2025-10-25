/**
 * Add reflection entry to capture learning and adaptations
 *
 * This command is designed to be executed by an AI agent.
 * Records what worked, what didn't, and adaptations made during execution.
 */

const chalk = require("chalk");
const inquirer = require("inquirer");
const { getCurrentGoal } = require("../utils/file");
const { GoalWorkspaceManager } = require("../core/goal-workspace-manager");
const { PlanManager } = require("../core/plan-manager");
const { DiscussionManager } = require("../core/discussion-manager");

async function reflect(options = {}) {
  const goal = options.goal || (await getCurrentGoal());

  if (!goal) {
    console.error(
      chalk.red("\n✗ Error: No goal specified and no current goal set.")
    );
    console.log(
      chalk.gray("Set a current goal with: ") +
        chalk.cyan("teamwerx use <goal-name>\n")
    );
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const discussion = new DiscussionManager(workspace);
  await discussion.load();

  // Handle different modes
  if (options.inspire) {
    await handleInspire(workspace, discussion);
  } else if (options.dryRun) {
    await handleDryRun(workspace, discussion, options);
  } else {
    await handleReflection(workspace, discussion, options);
  }
}

async function handleReflection(workspace, discussion, options) {
  // Prepare reflection template
  const reflectionTemplate =
    options.notes ||
    `**What Worked:**
<!-- Successful approaches, helpful patterns, effective strategies -->

**What Didn't Work:**
<!-- Challenges, blockers, unexpected complications -->

**Adaptations Made:**
<!-- Changes to approach, plan adjustments, lessons learned -->

**Next Steps:**
<!-- Action items, follow-up questions, areas needing attention -->`;

  const entry = discussion.addEntry({
    type: "reflection",
    content: reflectionTemplate,
  });

  await discussion.save();

  console.log(
    chalk.green(
      `\n✓ Added reflection entry ${entry.id} for ${workspace.title}.`
    )
  );
  console.log(
    chalk.gray("\nEdit the reflection in: ") + chalk.cyan(workspace.discussPath)
  );
  console.log(
    chalk.gray("Complete the reflection sections before continuing.\n")
  );
}

async function handleInspire(workspace, discussion) {
  const plan = new PlanManager(workspace);
  await plan.load();

  const pending = plan.getPendingTasks(10);
  const suggestions = [];

  if (pending.length) {
    suggestions.push(
      `Pending tasks (${pending
        .map((t) => t.id)
        .join(", ")}) may require prioritization or dependency checks.`
    );
  }

  if (!pending.length) {
    suggestions.push(
      "All tasks are completed. Consider archiving this goal or defining follow-up work."
    );
  }

  if (!discussion.entries.length) {
    suggestions.push(
      "No discussions recorded yet—capture architectural considerations before proceeding."
    );
  } else {
    const lastEntry = discussion.entries[discussion.entries.length - 1];
    suggestions.push(
      `Last discussion (${lastEntry.id}) occurred on ${new Date(
        lastEntry.timestamp
      ).toLocaleDateString()}; consider adding updates if the plan changed.`
    );
  }

  const entry = discussion.addEntry({
    type: "inspiration",
    content: suggestions.map((line) => `- ${line}`).join("\n"),
  });
  await discussion.save();

  console.log(
    chalk.green(`\n✓ Inspiration entry ${entry.id} added to discussion log.\n`)
  );
}

async function handleDryRun(workspace, discussion, options) {
  const plan = new PlanManager(workspace);
  await plan.load();

  let summary = options.notes;
  if (!summary) {
    const answer = await inquirer.prompt([
      {
        type: "input",
        name: "notes",
        message: "Describe the expected code changes (dry-run summary):",
      },
    ]);
    summary = answer.notes || "Dry-run recorded without additional notes.";
  }

  const pending =
    plan
      .getPendingTasks(5)
      .map((task) => task.id)
      .join(", ") || "No pending tasks.";
  const content = `Dry-run execution based on current plan.

Pending tasks considered: ${pending}

Summary:
${summary}`;

  const entry = discussion.addEntry({
    type: "dry-run",
    content,
  });
  await discussion.save();

  console.log(chalk.green(`\n✓ Dry-run entry ${entry.id} recorded.\n`));
}

module.exports = reflect;
