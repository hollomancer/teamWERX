/**
 * Show detailed status of goals
 *
 * Supports multiple view modes:
 * - Default: Shows goal status, success criteria, and plan info
 * - --context: Shows project context with tech stack and directories
 * - --summary: Shows summary with discussion/implementation records
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const Table = require('cli-table3');
const { listGoals, getCurrentGoal, readFileWithFrontmatter, getTeamwerxDir, fileExists } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { PlanManager } = require('../core/plan-manager');
const { DiscussionManager } = require('../core/discussion-manager');
const { deriveGoalStatus, getStatusColor } = require('../utils/goal-status');
const {
  detectTechnologyStack,
  listTopLevelDirs,
} = require('../core/project-insights');

async function status(goalName, options = {}) {
  try {
    if (options.list) {
      // Table view (formerly 'list' command)
      await showTableView(options);
    } else if (goalName) {
      // Show status for specific goal
      if (options.context) {
        await showContextView(goalName);
      } else if (options.summary) {
        await showSummaryView(goalName);
      } else {
        await showGoalStatus(goalName);
      }
    } else {
      // Show status for all goals
      await showAllGoalsStatus();
    }
  } catch (err) {
    console.error(chalk.red(`\n✗ Error: ${err.message}\n`));
    process.exit(1);
  }
}

async function showGoalStatus(goalName) {
  const goalPath = path.join(getTeamwerxDir(), 'goals', `${goalName}.md`);
  
  if (!(await fileExists(goalPath))) {
    throw new Error(`Goal "${goalName}" not found`);
  }
  
  const goal = await readFileWithFrontmatter(goalPath);
  const currentGoal = await getCurrentGoal();
  const isCurrent = currentGoal === goalName;
  const status = await deriveGoalStatus(goalName);
  
  console.log(chalk.blue.bold(`\n📊 Goal Status: ${goal.data.title}\n`));
  
  if (isCurrent) {
    console.log(chalk.green('● Current Goal\n'));
  }
  
  console.log(chalk.white('Status: ') + chalk[getStatusColor(status)](status));
  console.log(chalk.white('Created: ') + chalk.gray(goal.data.created));
  console.log(chalk.white('File: ') + chalk.gray(`.teamwerx/goals/${goalName}.md`));
  
  if (goal.data.success_criteria && goal.data.success_criteria.length > 0) {
    console.log(chalk.white('\nSuccess Criteria:'));
    goal.data.success_criteria.forEach((criterion, i) => {
      console.log(chalk.gray(`  ${i + 1}. ${criterion}`));
    });
  }
  
  // Check for plan
  const planPath = path.join(getTeamwerxDir(), 'plans', `${goalName}.md`);
  if (await fileExists(planPath)) {
    const plan = await readFileWithFrontmatter(planPath);
    console.log(chalk.white('\nPlan: ') + chalk.green('Exists'));
    console.log(chalk.white('Plan Status: ') + chalk[getStatusColor(plan.data.status)](plan.data.status));
    
    if (plan.data.tasks && plan.data.tasks.length > 0) {
      const completed = plan.data.tasks.filter(t => t.status === 'completed').length;
      const total = plan.data.tasks.length;
      console.log(chalk.white('Tasks: ') + chalk.gray(`${completed}/${total} completed`));
    }
  }
  
  console.log();
}

async function showTableView(options) {
  const goals = await listGoals();
  
  if (goals.length === 0) {
    console.log(chalk.yellow('\nNo goals found.'));
    console.log(chalk.gray('Create your first goal with: ') + chalk.cyan('teamwerx goal "Your goal"\n'));
    return;
  }
  
  // Derive status for each goal
  const goalsWithStatus = await Promise.all(
    goals.map(async (goal) => ({
      ...goal,
      status: await deriveGoalStatus(goal.filename)
    }))
  );
  
  // Filter by status if provided
  let filteredGoals = goalsWithStatus;
  if (options.status) {
    filteredGoals = goalsWithStatus.filter(g => g.status === options.status);
    
    if (filteredGoals.length === 0) {
      console.log(chalk.yellow(`\nNo goals found with status: ${options.status}\n`));
      return;
    }
  }
  
  // Sort by created date (newest first)
  filteredGoals.sort((a, b) => new Date(b.created) - new Date(a.created));
  
  // Create table
  const table = new Table({
    head: [
      chalk.white.bold('Title'),
      chalk.white.bold('Status'),
      chalk.white.bold('Created')
    ],
    colWidths: [40, 15, 15]
  });
  
  // Add rows
  for (const goal of filteredGoals) {
    table.push([
      goal.title,
      chalk[getStatusColor(goal.status)](goal.status),
      goal.created
    ]);
  }
  
  console.log('\n' + table.toString() + '\n');
  console.log(chalk.gray(`Total: ${filteredGoals.length} goal(s)\n`));
}

async function showAllGoalsStatus() {
  const goals = await listGoals();
  const currentGoal = await getCurrentGoal();
  
  if (goals.length === 0) {
    console.log(chalk.yellow('\nNo goals found.\n'));
    return;
  }
  
  console.log(chalk.blue.bold('\n📊 All Goals Status\n'));
  
  if (currentGoal) {
    console.log(chalk.white('Current Goal: ') + chalk.cyan(currentGoal) + '\n');
  }
  
  // Derive status for each goal and group
  const goalsWithStatus = await Promise.all(
    goals.map(async (goal) => ({
      ...goal,
      status: await deriveGoalStatus(goal.filename)
    }))
  );
  
  const grouped = goalsWithStatus.reduce((acc, goal) => {
    if (!acc[goal.status]) {
      acc[goal.status] = [];
    }
    acc[goal.status].push(goal);
    return acc;
  }, {});
  
  // Display grouped goals
  const statuses = ['in-progress', 'blocked', 'open', 'draft', 'completed', 'cancelled'];
  
  for (const status of statuses) {
    if (grouped[status] && grouped[status].length > 0) {
      console.log(chalk[getStatusColor(status)].bold(`${status.toUpperCase()} (${grouped[status].length}):`));
      grouped[status].forEach(goal => {
        const marker = currentGoal === goal.filename ? '●' : '○';
        console.log(chalk.gray(`  ${marker} ${goal.title} `) + chalk.dim(`(${goal.filename})`));
      });
      console.log();
    }
  }
}


async function showContextView(goalName) {
  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goalName);
  const plan = new PlanManager(workspace);
  await plan.load();
  const discussion = new DiscussionManager(workspace);
  await discussion.load();
  const stack = await detectTechnologyStack(process.cwd());
  const dirs = await listTopLevelDirs(process.cwd());

  const pending = plan.getPendingTasks(Infinity).length;
  const totalTasks = plan.tasks.length;
  const completed = plan.tasks.filter((t) => t.status === 'completed').length;
  const lastDiscussion = discussion.entries[discussion.entries.length - 1];

  console.log(chalk.blue.bold('\n📚 Project Context Overview\n'));
  console.log(chalk.white('Goal ID: ') + chalk.cyan(`${workspace.number}-${workspace.slug}`));
  console.log(chalk.white('Goal Title: ') + chalk.cyan(workspace.title));
  console.log(chalk.white('Plan Status: ') + chalk.gray(`${completed}/${totalTasks} tasks completed (${pending} pending)`));
  if (lastDiscussion) {
    console.log(
      chalk.white('Last Discussion: ') +
        chalk.gray(`${lastDiscussion.id} · ${new Date(lastDiscussion.timestamp).toLocaleString()}`)
    );
  } else {
    console.log(chalk.white('Last Discussion: ') + chalk.gray('None recorded yet'));
  }

  console.log('\n' + chalk.white('Technology Stack:'));
  stack.forEach((item) => {
    console.log(chalk.gray(`  • ${item.name} (${item.manifest})`));
  });
  if (!stack.length) {
    console.log(chalk.gray('  • Not detected'));
  }

  console.log('\n' + chalk.white('Key Directories:'));
  dirs.slice(0, 8).forEach((dir) => console.log(chalk.gray(`  • ${dir}/`)));
  if (!dirs.length) {
    console.log(chalk.gray('  • None detected'));
  }

  console.log('\n' + chalk.white('Artifacts:'));
  console.log(
    chalk.gray('  • Plan: ') + chalk.cyan(path.relative(process.cwd(), workspace.planPath))
  );
  console.log(
    chalk.gray('  • Discussion: ') + chalk.cyan(path.relative(process.cwd(), workspace.discussPath))
  );
  console.log(
    chalk.gray('  • Research: ') + chalk.cyan(path.relative(process.cwd(), workspace.researchPath))
  );
  console.log();
}

async function listImplementationRecords(workspace) {
  try {
    const files = await fs.readdir(workspace.implementationDir);
    return files.filter((f) => f.endsWith('.md')).sort();
  } catch {
    return [];
  }
}

async function showSummaryView(goalName) {
  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goalName);
  const plan = new PlanManager(workspace);
  await plan.load();
  const discussion = new DiscussionManager(workspace);
  await discussion.load();
  const implFiles = await listImplementationRecords(workspace);

  const completed = plan.tasks.filter((t) => t.status === 'completed').length;
  const pending = plan.getPendingTasks(Infinity).length;

  console.log(chalk.blue.bold('\n📖 Goal Summary\n'));
  console.log(chalk.white('Goal ID: ') + chalk.cyan(`${workspace.number}-${workspace.slug}`));
  console.log(chalk.white('Title: ') + chalk.cyan(workspace.title));
  console.log(chalk.white('Tasks: ') + chalk.gray(`${completed} completed / ${plan.tasks.length} total ( ${pending} pending )`));
  console.log(
    chalk.white('Discussions: ') + chalk.gray(`${discussion.entries.length} entries`)
  );
  console.log(
    chalk.white('Implementation Records: ') + chalk.gray(`${implFiles.length}`)
  );

  if (implFiles.length) {
    console.log(chalk.white('\nRecent Implementation Records:'));
    implFiles.slice(-5).forEach((file) =>
      console.log(chalk.gray(`  • ${path.join('implementation', file)}`))
    );
  }

  const lastDiscussion = discussion.entries[discussion.entries.length - 1];
  if (lastDiscussion) {
    console.log(
      chalk.white('\nLast Discussion Entry:') +
        chalk.gray(` ${lastDiscussion.id} (${new Date(lastDiscussion.timestamp).toLocaleString()})`)
    );
  }

  console.log(
    chalk.gray('\nArtifacts:') +
      ` plan=${path.relative(process.cwd(), workspace.planPath)}, discuss=${path.relative(
        process.cwd(),
        workspace.discussPath
      )}, research=${path.relative(process.cwd(), workspace.researchPath)}`
  );
  console.log();
}

module.exports = status;
