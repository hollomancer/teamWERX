/**
 * Complete tasks and record implementations
 *
 * Consolidates three operations:
 * - Fix (formerly 'correct'): Record an issue correction
 * - Manual (formerly 'collect'): Collect staged git changes
 * - Batch (formerly 'implement'): Batch-complete pending tasks
 */

const { promisify } = require("util");
const { exec } = require("child_process");
const path = require("path");
const chalk = require("chalk");
const prompts = require("../utils/prompts");
const { getCurrentGoal } = require("../utils/file");
const { GoalWorkspaceManager } = require("../core/goal-workspace-manager");
const { PlanManager } = require("../core/plan-manager");
const { DiscussionManager } = require("../core/discussion-manager");
const { ImplementationManager } = require("../core/implementation-manager");

const execAsync = promisify(exec);

async function getGitOutput(command) {
  try {
    const { stdout } = await execAsync(command);
    return stdout.trim();
  } catch (err) {
    throw new Error(`Git command failed: ${command}\n${err.message}`);
  }
}

async function completeFix(workspace, issueDescription, resolution) {
  const plan = new PlanManager(workspace);
  await plan.load();
  const discussion = new DiscussionManager(workspace);
  await discussion.load();
  const impl = new ImplementationManager(workspace);

  discussion.addEntry({
    type: "issue-correction",
    content: `Issue: ${issueDescription}\nResolution: ${
      resolution || "Not provided."
    }`,
  });
  await discussion.save();

  const task = plan.addTask({
    title: `Fix: ${issueDescription}`,
    status: "completed",
    notes: resolution,
    source: "complete-fix",
  });
  await plan.save();

  await impl.createRecord(task.id, {
    title: `Fix - ${issueDescription}`,
    summary:
      resolution || "Issue addressed via teamwerx complete --source fix.",
    details: `Issue Description:\n${issueDescription}\n\nResolution:\n${
      resolution || "Not specified."
    }`,
    sources: ["complete-fix"],
  });

  console.log(
    chalk.green(
      `\n✓ Issue recorded. Discussion, plan, and implementation logs updated (task ${task.id}).\n`
    )
  );
}

async function completeManual(workspace, title) {
  const changedFiles = await getGitOutput("git diff --cached --name-only");
  if (!changedFiles) {
    console.error(
      chalk.red(
        "\n✗ No staged changes found. Stage files before running complete --source manual.\n"
      )
    );
    process.exit(1);
  }

  const diffStat = await getGitOutput("git diff --cached --stat");
  const diffFull = await getGitOutput("git diff --cached");

  const plan = new PlanManager(workspace);
  await plan.load();
  const taskTitle =
    title || `Collected manual changes (${new Date().toLocaleDateString()})`;
  const task = plan.addTask({
    title: taskTitle,
    status: "completed",
    notes: "Collected via teamwerx complete --source manual",
    source: "complete-manual",
  });
  await plan.save();

  const impl = new ImplementationManager(workspace);
  await impl.createRecord(task.id, {
    title: taskTitle,
    summary: diffStat || changedFiles,
    details: diffFull,
    sources: ["git diff --cached"],
  });

  console.log(
    chalk.green("\n✓ Manual changes recorded in plan and implementation log.\n")
  );
  console.log(
    chalk.gray("  • Task added: ") +
      chalk.cyan(
        `${task.id} (${path.relative(process.cwd(), workspace.planPath)})`
      )
  );
  console.log(
    chalk.gray("  • Implementation record: ") +
      chalk.cyan(
        path.relative(
          process.cwd(),
          path.join(workspace.implementationDir, `${task.id}.md`)
        )
      )
  );
}

async function completeBatch(workspace, notes, limit = 5) {
  const plan = new PlanManager(workspace);
  await plan.load();
  const impl = new ImplementationManager(workspace);

  const pendingTasks = plan.getPendingTasks(limit);
  if (!pendingTasks.length) {
    console.log(chalk.yellow("\n⚠ No pending tasks to complete.\n"));
    return;
  }

  const note =
    notes ||
    "Automatically marked as completed via teamwerx complete --source batch.";

  for (const task of pendingTasks) {
    plan.completeTask(task.id, note, "complete-batch");
    await impl.createRecord(task.id, {
      title: task.title,
      summary: note,
      details: `Task ${
        task.id
      } marked as completed automatically on ${new Date().toLocaleString()}. Please verify the code changes align with this record.`,
      sources: ["complete-batch"],
    });
  }

  await plan.save();
  console.log(
    chalk.green(
      `\n✓ Completed ${pendingTasks.length} task(s) for ${workspace.number}-${workspace.slug}.\n`
    )
  );
}

async function complete(issueOrTitle, options = {}) {
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
  const source = options.source || "batch";

  switch (source) {
    case "fix": {
      if (!issueOrTitle || !issueOrTitle.trim()) {
        console.error(
          chalk.red("\n✗ Issue description is required for --source fix.\n")
        );
        process.exit(1);
      }
      const { resolution } = await prompts.prompt([
        {
          type: "input",
          name: "resolution",
          message: "Describe the fix applied:",
        },
      ]);
      await completeFix(workspace, issueOrTitle, resolution);
      break;
    }

    case "manual": {
      await completeManual(workspace, issueOrTitle);
      break;
    }

    case "batch": {
      const limit = options.limit || 5;
      await completeBatch(workspace, options.notes, limit);
      break;
    }

    default:
      console.error(
        chalk.red(
          `\n✗ Invalid source: ${source}. Use 'fix', 'manual', or 'batch'.\n`
        )
      );
      process.exit(1);
  }
}

module.exports = complete;
