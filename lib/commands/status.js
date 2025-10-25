/**
 * Show detailed status of goals
 */

const path = require('path');
const chalk = require('chalk');
const { listGoals, getCurrentGoal, readFileWithFrontmatter, getTeamwerxDir, fileExists } = require('../utils/file');

async function status(goalName) {
  try {
    if (goalName) {
      // Show status for specific goal
      await showGoalStatus(goalName);
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
  
  console.log(chalk.blue.bold(`\n📊 Goal Status: ${goal.data.title}\n`));
  
  if (isCurrent) {
    console.log(chalk.green('● Current Goal\n'));
  }
  
  console.log(chalk.white('Status: ') + chalk[getStatusColor(goal.data.status)](goal.data.status));
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
  
  // Group by status
  const grouped = goals.reduce((acc, goal) => {
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

function getStatusColor(status) {
  const colors = {
    'draft': 'gray',
    'open': 'blue',
    'in-progress': 'yellow',
    'blocked': 'red',
    'completed': 'green',
    'cancelled': 'dim'
  };
  return colors[status] || 'white';
}

module.exports = status;
