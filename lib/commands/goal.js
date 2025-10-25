/**
 * Create a new goal
 */

const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const {
  getTeamwerxDir,
  dirExists,
  fileExists,
  writeFileWithFrontmatter,
  toKebabCase,
  ensureDir
} = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');

async function goal(description) {
  console.log(chalk.blue.bold('\n📋 Create a New Goal\n'));
  
  // Check if teamWERX is initialized
  const teamwerxDir = getTeamwerxDir();
  if (!(await dirExists(teamwerxDir))) {
    console.error(chalk.red('✗ Error: teamWERX is not initialized.'));
    console.log(chalk.yellow('  Please run \'teamwerx init\' first.\n'));
    process.exit(1);
  }
  
  let goalTitle = description;
  
  // Prompt for goal description if not provided
  if (!goalTitle) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'What is your goal?',
        validate: (input) => input.trim().length > 0 || 'Goal description is required'
      }
    ]);
    goalTitle = answers.title;
  }
  
  // Prompt for success criteria
  console.log(chalk.gray('\nDefine success criteria (prefix with P1/P2/P3 for priority):'));
  console.log(chalk.gray('P1 = Critical (Must Have), P2 = Important (Should Have), P3 = Nice to Have (Could Have)\n'));

  const successCriteria = [];
  const outcomes = [];

  // Collect success criteria
  let criterionIndex = 1;
  while (true) {
    const { criterion } = await inquirer.prompt([
      {
        type: 'input',
        name: 'criterion',
        message: `Success criterion ${criterionIndex} (press Enter to finish):`,
        default: ''
      }
    ]);

    if (!criterion.trim()) {
      break;
    }

    // Add P1 prefix if not already prefixed
    const trimmed = criterion.trim();
    const hasPriority = /^P[123]:/i.test(trimmed);
    successCriteria.push(hasPriority ? trimmed : `P1: ${trimmed}`);
    criterionIndex++;
  }

  if (successCriteria.length === 0) {
    console.error(chalk.red('\n✗ Error: At least one success criterion is required.\n'));
    process.exit(1);
  }

  // Prompt for outcome measurements (optional)
  console.log(chalk.cyan('\nOutcome Measurements (optional):'));
  console.log(chalk.gray('Define how success will be measured (press Enter to skip)\n'));
  
  let outcomeIndex = 1;
  while (true) {
    const { addOutcome } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addOutcome',
        message: `Add outcome measurement ${outcomeIndex}?`,
        default: outcomeIndex === 1
      }
    ]);

    if (!addOutcome) {
      break;
    }

    const outcomeAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'metric',
        message: 'Metric name:',
        validate: (input) => input.trim().length > 0 || 'Metric name is required'
      },
      {
        type: 'input',
        name: 'target',
        message: 'Target value:',
        validate: (input) => input.trim().length > 0 || 'Target value is required'
      },
      {
        type: 'input',
        name: 'measurement',
        message: 'How to measure:',
        validate: (input) => input.trim().length > 0 || 'Measurement method is required'
      }
    ]);

    outcomes.push({
      metric: outcomeAnswers.metric.trim(),
      target: outcomeAnswers.target.trim(),
      measurement: outcomeAnswers.measurement.trim()
    });
    outcomeIndex++;
  }
  
  // Generate filename
  const filename = toKebabCase(goalTitle);
  const goalPath = path.join(teamwerxDir, 'goals', `${filename}.md`);
  
  // Check if goal already exists
  if (await fileExists(goalPath)) {
    console.error(chalk.red(`\n✗ Error: Goal "${filename}" already exists.\n`));
    process.exit(1);
  }
  
  // Create goal file
  const frontmatter = {
    title: goalTitle,
    created: new Date().toISOString().split('T')[0],
    success_criteria: successCriteria,
    ...(outcomes.length > 0 && { outcomes })
  };
  
  const successCriteriaText = successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n');

  const outcomesText = outcomes.length > 0 ? `

## Outcome Measurements

${outcomes.map((o, i) => `${i + 1}. **${o.metric}**
   - Target: ${o.target}
   - Measurement: ${o.measurement}`).join('\n\n')}` : '';

  const content = `# Goal: ${goalTitle}

## Description

${goalTitle}

## Success Criteria

${successCriteriaText}${outcomesText}

## Notes

_Add any additional notes or context here._
`;
  
  try {
    await ensureDir(path.join(teamwerxDir, 'goals'));
    await writeFileWithFrontmatter(goalPath, frontmatter, content);

    // Create workspace with numbered ID and templates
    const workspace = await GoalWorkspaceManager.ensureWorkspace(filename);

    console.log(chalk.green.bold('\n✓ Goal created successfully!\n'));
    console.log(chalk.white('Goal: ') + chalk.cyan(goalTitle));
    console.log(chalk.white('Workspace: ') + chalk.cyan(`${workspace.number}-${filename}`));
    console.log(chalk.white('File: ') + chalk.gray(`.teamwerx/goals/${filename}.md`));
    console.log(chalk.white('Status: ') + chalk.gray('draft (no plan yet)'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('  1. Set as current goal: ') + chalk.cyan(`teamwerx use ${filename}`));
    console.log(chalk.gray('  2. Start research: ') + chalk.cyan('teamwerx research'));
    console.log(chalk.gray('  3. Remember to commit: ') + chalk.cyan(`git add .teamwerx && git commit -m "[teamWERX] Add goal: ${goalTitle}"`));
    console.log();
    return {
      slug: filename,
      title: goalTitle,
      successCriteria,
    };
  } catch (err) {
    console.error(chalk.red(`\n✗ Error creating goal: ${err.message}\n`));
    process.exit(1);
  }
}

module.exports = goal;
