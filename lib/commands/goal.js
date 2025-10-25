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
  console.log(chalk.gray('\nDefine success criteria (press Enter with empty line to finish):'));
  
  const successCriteria = [];
  let criterionIndex = 1;
  
  while (true) {
    const { criterion } = await inquirer.prompt([
      {
        type: 'input',
        name: 'criterion',
        message: `Criterion ${criterionIndex}:`,
        default: ''
      }
    ]);
    
    if (!criterion.trim()) {
      break;
    }
    
    successCriteria.push(criterion.trim());
    criterionIndex++;
  }
  
  if (successCriteria.length === 0) {
    console.error(chalk.red('\n✗ Error: At least one success criterion is required.\n'));
    process.exit(1);
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
    status: 'draft',
    created: new Date().toISOString().split('T')[0],
    success_criteria: successCriteria
  };
  
  const content = `# Goal: ${goalTitle}

## Description

${goalTitle}

## Success Criteria

${successCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Notes

_Add any additional notes or context here._
`;
  
  try {
    await ensureDir(path.join(teamwerxDir, 'goals'));
    await writeFileWithFrontmatter(goalPath, frontmatter, content);
    
    console.log(chalk.green.bold('\n✓ Goal created successfully!\n'));
    console.log(chalk.white('Goal: ') + chalk.cyan(goalTitle));
    console.log(chalk.white('File: ') + chalk.gray(`.teamwerx/goals/${filename}.md`));
    console.log(chalk.white('Status: ') + chalk.yellow('draft'));
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
