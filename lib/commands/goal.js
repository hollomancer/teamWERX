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
  ensureDir,
} = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const {
  requireInitialization,
  requireGoalExists,
  handleValidationError,
  handleError,
  displaySuccess,
} = require('../utils/errors');

/**
 * Create a new goal with interactive prompts for description and success criteria
 * @param {string} description - Optional goal description (will prompt if not provided)
 * @returns {Promise<Object>} Object containing slug, title, and success criteria
 */
async function goal(description) {
  console.log(chalk.blue.bold('\n📋 Create a New Goal\n'));

  // Check if teamWERX is initialized
  const teamwerxDir = getTeamwerxDir();
  requireInitialization(await dirExists(teamwerxDir));

  let goalTitle = description;

  // Prompt for goal description if not provided
  if (!goalTitle) {
    console.log(
      chalk.gray(
        '💡 Tip: Use a clear, actionable goal statement (e.g., "Implement user authentication system")'
      )
    );
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'What is your goal?',
        validate: (input) => {
          const trimmed = input.trim();
          if (trimmed.length === 0) return 'Goal description is required';
          if (trimmed.length < 5)
            return 'Goal description should be at least 5 characters';
          if (trimmed.length > 100)
            return 'Goal description should be less than 100 characters';
          return true;
        },
      },
    ]);
    goalTitle = answers.title.trim();
  }

  // Prompt for success criteria
  console.log(chalk.cyan('\n📋 Success Criteria'));
  console.log(chalk.gray('Define what success looks like. Use priorities:'));
  console.log(chalk.gray('• P1 = Critical (Must Have) - Core requirements'));
  console.log(chalk.gray('• P2 = Important (Should Have) - Key features'));
  console.log(chalk.gray('• P3 = Nice to Have (Could Have) - Enhancements'));
  console.log(
    chalk.gray(
      'Examples: "P1: Users can log in with email/password", "P2: Password reset functionality"'
    )
  );
  console.log();

  const successCriteria = [];
  const outcomes = [];

  // Collect success criteria
  let criterionIndex = 1;
  /* eslint-disable-next-line no-constant-condition */
  while (true) {
    const { criterion } = await inquirer.prompt([
      {
        type: 'input',
        name: 'criterion',
        message: `Success criterion ${criterionIndex} (press Enter when done):`,
        default: '',
        validate: (input) => {
          const trimmed = input.trim();
          if (trimmed.length > 200)
            return 'Criterion should be less than 200 characters';
          return true;
        },
      },
    ]);

    if (!criterion.trim()) {
      if (successCriteria.length === 0) {
        console.log(
          chalk.yellow('⚠ At least one success criterion is required.')
        );
        continue;
      }
      break;
    }

    // Add P1 prefix if not already prefixed
    const trimmed = criterion.trim();
    const hasPriority = /^P[123]:/i.test(trimmed);
    successCriteria.push(hasPriority ? trimmed : `P1: ${trimmed}`);
    criterionIndex++;

    // Show progress
    console.log(
      chalk.green(`✓ Added: ${successCriteria[successCriteria.length - 1]}`)
    );
  }

  if (successCriteria.length === 0) {
    handleValidationError('At least one success criterion is required.');
  }

  // Prompt for outcome measurements (optional)
  console.log(chalk.cyan('\n📊 Outcome Measurements (Optional)'));
  console.log(
    chalk.gray(
      'Define how you\'ll measure success. This helps track progress quantitatively.'
    )
  );
  console.log(
    chalk.gray(
      'Examples: "User registration conversion rate", "API response time", "Test coverage percentage"'
    )
  );
  console.log();

  let outcomeIndex = 1;
  /* eslint-disable-next-line no-constant-condition */
  while (true) {
    const { addOutcome } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addOutcome',
        message: `Add measurable outcome ${outcomeIndex}?`,
        default: outcomeIndex === 1,
      },
    ]);

    if (!addOutcome) {
      break;
    }

    const outcomeAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'metric',
        message: '📏 Metric name (e.g., "User satisfaction score"):',
        validate: (input) => {
          const trimmed = input.trim();
          if (trimmed.length === 0) return 'Metric name is required';
          if (trimmed.length > 50)
            return 'Metric name should be less than 50 characters';
          return true;
        },
      },
      {
        type: 'input',
        name: 'target',
        message: '🎯 Target value (e.g., "4.5 out of 5", "95%", "< 500ms"):',
        validate: (input) => {
          const trimmed = input.trim();
          if (trimmed.length === 0) return 'Target value is required';
          if (trimmed.length > 30)
            return 'Target value should be less than 30 characters';
          return true;
        },
      },
      {
        type: 'input',
        name: 'measurement',
        message:
          '📐 How to measure (e.g., "Post-implementation survey", "Performance monitoring"):',
        validate: (input) => {
          const trimmed = input.trim();
          if (trimmed.length === 0) return 'Measurement method is required';
          if (trimmed.length > 100)
            return 'Measurement description should be less than 100 characters';
          return true;
        },
      },
    ]);

    outcomes.push({
      metric: outcomeAnswers.metric.trim(),
      target: outcomeAnswers.target.trim(),
      measurement: outcomeAnswers.measurement.trim(),
    });

    console.log(chalk.green(`✓ Added outcome: ${outcomeAnswers.metric}`));
    outcomeIndex++;
  } // Generate filename
  const filename = toKebabCase(goalTitle);
  const goalPath = path.join(teamwerxDir, 'goals', `${filename}.md`);

  // Check if goal already exists
  if (await fileExists(goalPath)) {
    handleValidationError(
      `Goal "${filename}" already exists.`,
      'Choose a different goal name or use a different title.'
    );
  }

  // Create goal file
  const frontmatter = {
    title: goalTitle,
    created: new Date().toISOString().split('T')[0],
    success_criteria: successCriteria,
    ...(outcomes.length > 0 && { outcomes }),
  };

  const successCriteriaText = successCriteria
    .map((c, i) => `${i + 1}. ${c}`)
    .join('\n');

  const outcomesText =
    outcomes.length > 0
      ? `

## Outcome Measurements

${outcomes
    .map(
      (o, i) => `${i + 1}. **${o.metric}**
   - Target: ${o.target}
   - Measurement: ${o.measurement}`
    )
    .join('\n\n')}`
      : '';

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

    displaySuccess('Goal created successfully!', {
      Goal: goalTitle,
      Workspace: `${workspace.number}-${filename}`,
      File: `.teamwerx/goals/${filename}.md`,
      Status: 'draft (no plan yet)',
    });

    console.log(chalk.gray('Next steps:'));
    console.log(
      chalk.gray('  1. Set as current goal: ') +
        chalk.cyan(`teamwerx use ${filename}`)
    );
    console.log(
      chalk.gray('  2. Start research: ') + chalk.cyan('teamwerx research')
    );
    console.log(
      chalk.gray('  3. Remember to commit: ') +
        chalk.cyan(
          `git add .teamwerx && git commit -m "[teamWERX] Add goal: ${goalTitle}"`
        )
    );
    console.log();

    return {
      slug: filename,
      title: goalTitle,
      successCriteria,
    };
  } catch (error) {
    handleError(error, 'creating goal');
  }
}

module.exports = goal;
