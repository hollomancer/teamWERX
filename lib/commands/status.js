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
const {
  listGoals,
  getCurrentGoal,
  readFileWithFrontmatter,
  getTeamwerxDir,
  fileExists,
} = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { PlanManager } = require('../core/plan-manager');
const { DiscussionManager } = require('../core/discussion-manager');
const { deriveGoalStatus } = require('../utils/goal-status');
const {
  detectTechnologyStack,
  listTopLevelDirs,
} = require('../core/project-insights');
const { handleError } = require('../utils/errors');
const { FORMAT, createStyledTable } = require('../utils/styling');

/**
 * Entry: show status(s)
 */
async function status(goalName, options = {}) {
  try {
    if (options.list) {
      await showTableView(options);
    } else if (goalName) {
      if (options.context) {
        await showContextView(goalName, options);
      } else if (options.summary) {
        await showSummaryView(goalName, options);
      } else {
        await showGoalStatus(goalName, options);
      }
    } else {
      await showAllGoalsStatus(options);
    }
  } catch (error) {
    handleError(error, 'retrieving status');
  }
}

/**
 * Show status for a specific goal
 */
async function showGoalStatus(goalName, options = {}) {
  const goalPath = path.join(getTeamwerxDir(), 'goals', goalName + '.md');

  if (!(await fileExists(goalPath))) {
    throw new Error('Goal "' + goalName + '" not found');
  }

  const goal = await readFileWithFrontmatter(goalPath);
  const currentGoal = await getCurrentGoal();
  const isCurrent = currentGoal === goalName;
  const status = await deriveGoalStatus(goalName);

  // Read plan from workspace plan file (canonical location)
  let planData = null;
  try {
    const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goalName);
    const planPath = workspace.planPath;
    if (await fileExists(planPath)) {
      const plan = await readFileWithFrontmatter(planPath);
      const tasks = Array.isArray(plan.data.tasks) ? plan.data.tasks : [];
      const completed = tasks.filter((t) => t.status === 'completed').length;
      const total = tasks.length;
      const blocked = tasks.filter((t) => t.status === 'blocked').length;

      // Derive concise plan status
      let planStatus = 'open';
      if (total === 0) {
        planStatus = 'open';
      } else if (blocked > 0) {
        planStatus = 'blocked';
      } else if (completed === total && total > 0) {
        planStatus = 'completed';
      } else if (completed > 0) {
        planStatus = 'in-progress';
      } else {
        planStatus = 'open';
      }

      planData = {
        exists: true,
        status: planStatus,
        tasks: {
          completed: completed,
          total: total,
          completion: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      };
    }
  } catch (err) {
    // workspace or plan missing -> leave planData null
  }

  const result = {
    goal: goalName,
    title: goal.data.title,
    status: status,
    isCurrent: isCurrent,
    created: goal.data.created,
    file: '.teamwerx/goals/' + goalName + '.md',
    successCriteria: goal.data.success_criteria || [],
    plan: planData,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(FORMAT.header('📊 Goal Status: ' + goal.data.title));

  if (isCurrent) {
    console.log(chalk.green('● Current Goal\n'));
  }

  console.log(FORMAT.labelValue('Status:', status));
  console.log(FORMAT.labelValue('Created:', goal.data.created));
  console.log(
    FORMAT.labelValue('File:', '.teamwerx/goals/' + goalName + '.md'),
  );

  if (goal.data.success_criteria && goal.data.success_criteria.length > 0) {
    console.log(FORMAT.labelValue('\nSuccess Criteria:', ''));
    goal.data.success_criteria.forEach((criterion) => {
      console.log(FORMAT.listItem(criterion));
    });
  }

  if (planData) {
    console.log(FORMAT.labelValue('\nPlan:', 'Exists'));
    console.log(FORMAT.labelValue('Plan Status:', planData.status));
    console.log(
      FORMAT.labelValue(
        'Tasks:',
        planData.tasks.completed + '/' + planData.tasks.total + ' completed',
      ),
    );
  }

  console.log();
}

/**
 * Table view (list)
 */
async function showTableView(options = {}) {
  const goals = await listGoals();

  if (goals.length === 0) {
    console.log(chalk.yellow('\nNo goals found.'));
    console.log(
      chalk.gray('Create your first goal with: ') +
        chalk.cyan('teamwerx goal \'Your goal\'\n'),
    );
    return;
  }

  const goalsWithStatus = await Promise.all(
    goals.map(async (g) => ({
      ...g,
      status: await deriveGoalStatus(g.filename),
    })),
  );

  let filteredGoals = goalsWithStatus;
  if (options.status) {
    filteredGoals = goalsWithStatus.filter((g) => g.status === options.status);
    if (filteredGoals.length === 0) {
      console.log(
        chalk.yellow('\nNo goals found with status: ' + options.status + '\n'),
      );
      return;
    }
  }

  filteredGoals.sort((a, b) => new Date(b.created) - new Date(a.created));

  const table = createStyledTable({
    head: ['Title', 'Status', 'Created'],
    colWidths: [40, 15, 15],
  });

  for (const g of filteredGoals) {
    table.push([g.title, FORMAT.status(g.status), g.created]);
  }

  console.log('\n' + table.toString() + '\n');
  console.log(FORMAT.labelValue('Total:', filteredGoals.length + ' goal(s)'));
}

/**
 * Show all goals status grouped
 */
async function showAllGoalsStatus(options = {}) {
  const goals = await listGoals();
  const currentGoal = await getCurrentGoal();

  if (goals.length === 0) {
    const result = {
      currentGoal: currentGoal,
      goals: [],
      summary: { total: 0 },
    };

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(chalk.yellow('\nNo goals found.\n'));
    return;
  }

  const goalsWithStatus = await Promise.all(
    goals.map(async (g) => ({
      ...g,
      status: await deriveGoalStatus(g.filename),
    })),
  );

  const grouped = goalsWithStatus.reduce((acc, g) => {
    if (!acc[g.status]) acc[g.status] = [];
    acc[g.status].push(g);
    return acc;
  }, {});

  const result = {
    currentGoal: currentGoal,
    goals: goalsWithStatus.map((g) => ({
      name: g.filename,
      title: g.title,
      status: g.status,
      created: g.created,
      isCurrent: g.filename === currentGoal,
    })),
    summary: {
      total: goalsWithStatus.length,
      byStatus: Object.keys(grouped).reduce((acc, statusKey) => {
        acc[statusKey] = grouped[statusKey].length;
        return acc;
      }, {}),
    },
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(FORMAT.header('📊 All Goals Status'));

  if (currentGoal) {
    console.log(FORMAT.labelValue('Current Goal:', currentGoal) + '\n');
  }

  const statuses = [
    'in-progress',
    'blocked',
    'open',
    'draft',
    'completed',
    'cancelled',
  ];

  for (const statusKey of statuses) {
    if (grouped[statusKey] && grouped[statusKey].length > 0) {
      console.log(
        FORMAT.status(statusKey.toUpperCase()) +
          ' (' +
          grouped[statusKey].length +
          '):',
      );
      grouped[statusKey].forEach((g) => {
        const marker = currentGoal === g.filename ? '●' : '○';
        console.log(FORMAT.listItem(g.title + ' (' + g.filename + ')', marker));
      });
      console.log();
    }
  }
}

/**
 * Context view for a specific goal
 */
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
  console.log(
    chalk.white('Goal ID: ') +
      chalk.cyan(workspace.number + '-' + workspace.slug),
  );
  console.log(chalk.white('Goal Title: ') + chalk.cyan(workspace.title));
  console.log(
    chalk.white('Plan Status: ') +
      chalk.gray(
        completed +
          '/' +
          totalTasks +
          ' tasks completed (' +
          pending +
          ' pending)',
      ),
  );

  if (lastDiscussion) {
    console.log(
      chalk.white('Last Discussion: ') +
        chalk.gray(
          lastDiscussion.id +
            ' · ' +
            new Date(lastDiscussion.timestamp).toLocaleString(),
        ),
    );
  } else {
    console.log(
      chalk.white('Last Discussion: ') + chalk.gray('None recorded yet'),
    );
  }

  console.log('\n' + chalk.white('Technology Stack:'));
  stack.forEach((item) => {
    console.log(chalk.gray('  • ' + item.name + ' (' + item.manifest + ')'));
  });
  if (!stack.length) {
    console.log(chalk.gray('  • Not detected'));
  }

  console.log('\n' + chalk.white('Key Directories:'));
  dirs
    .slice(0, 8)
    .forEach((dir) => console.log(chalk.gray('  • ' + dir + '/')));
  if (!dirs.length) {
    console.log(chalk.gray('  • None detected'));
  }

  console.log('\n' + chalk.white('Artifacts:'));
  console.log(
    chalk.gray('  • Plan: ') +
      chalk.cyan(path.relative(process.cwd(), workspace.planPath)),
  );
  console.log(
    chalk.gray('  • Discussion: ') +
      chalk.cyan(path.relative(process.cwd(), workspace.discussPath)),
  );
  console.log(
    chalk.gray('  • Research: ') +
      chalk.cyan(path.relative(process.cwd(), workspace.researchPath)),
  );
  console.log();
}

/**
 * List implementation records within a workspace
 */
async function listImplementationRecords(workspace) {
  try {
    const files = await fs.readdir(workspace.implementationDir);
    return files.filter((f) => f.endsWith('.md')).sort();
  } catch {
    return [];
  }
}

/**
 * Summary view for a specific goal
 */
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
  console.log(
    chalk.white('Goal ID: ') +
      chalk.cyan(workspace.number + '-' + workspace.slug),
  );
  console.log(chalk.white('Title: ') + chalk.cyan(workspace.title));
  console.log(
    chalk.white('Tasks: ') +
      chalk.gray(
        completed +
          ' completed / ' +
          plan.tasks.length +
          ' total ( ' +
          pending +
          ' pending )',
      ),
  );
  console.log(
    chalk.white('Discussions: ') +
      chalk.gray(discussion.entries.length + ' entries'),
  );
  console.log(
    chalk.white('Implementation Records: ') + chalk.gray(implFiles.length),
  );

  if (implFiles.length) {
    console.log(chalk.white('\nRecent Implementation Records:'));
    implFiles
      .slice(-5)
      .forEach((file) =>
        console.log(chalk.gray('  • ' + path.join('implementation', file))),
      );
  }

  const lastDiscussion = discussion.entries[discussion.entries.length - 1];
  if (lastDiscussion) {
    console.log(
      chalk.white('\nLast Discussion Entry:') +
        chalk.gray(
          ' ' +
            lastDiscussion.id +
            ' (' +
            new Date(lastDiscussion.timestamp).toLocaleString() +
            ')',
        ),
    );
  }

  console.log(
    chalk.gray('\nArtifacts:') +
      ' plan=' +
      path.relative(process.cwd(), workspace.planPath) +
      ', discuss=' +
      path.relative(process.cwd(), workspace.discussPath) +
      ', research=' +
      path.relative(process.cwd(), workspace.researchPath),
  );
  console.log();
}

module.exports = status;
