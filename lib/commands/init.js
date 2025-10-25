/**
 * Initialize teamWERX in the current project
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const { isGitRepo } = require('../utils/git');
const { dirExists, fileExists, ensureDir } = require('../utils/file');

const TEAMWERX_DIR = '.teamwerx';
const AGENTS_FILE = 'AGENTS.md';

async function init() {
  console.log(chalk.blue.bold('\n🚀 teamWERX Initialization\n'));
  
  // Check if git is initialized
  const spinner = ora('Checking for git repository...').start();
  
  if (!(await isGitRepo())) {
    spinner.fail();
    console.error(chalk.red('\n✗ Error: teamWERX requires a git repository.'));
    console.log(chalk.yellow('  Please run \'git init\' first.\n'));
    process.exit(1);
  }
  
  spinner.succeed('Git repository found');
  
  // Check if .teamwerx already exists
  const teamwerxPath = path.join(process.cwd(), TEAMWERX_DIR);
  
  if (await dirExists(teamwerxPath)) {
    spinner.stop();
    const { reinit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reinit',
        message: 'teamWERX is already initialized. Do you want to reinitialize?',
        default: false
      }
    ]);
    
    if (!reinit) {
      console.log(chalk.yellow('\nInitialization cancelled.\n'));
      process.exit(0);
    }
  }
  
  // Create directory structure
  const structureSpinner = ora('Creating directory structure...').start();
  
  try {
    await ensureDir(teamwerxPath);
    await ensureDir(path.join(teamwerxPath, 'goals'));
    await ensureDir(path.join(teamwerxPath, 'research'));
    await ensureDir(path.join(teamwerxPath, 'plans'));
    await ensureDir(path.join(teamwerxPath, 'proposals'));
    
    structureSpinner.succeed('Directory structure created');
  } catch (err) {
    structureSpinner.fail();
    console.error(chalk.red(`\n✗ Error creating directory structure: ${err.message}\n`));
    process.exit(1);
  }
  
  // Create or update AGENTS.md
  const agentsSpinner = ora('Setting up AGENTS.md...').start();
  
  try {
    const agentsPath = path.join(process.cwd(), AGENTS_FILE);
    const agentsExists = await fileExists(agentsPath);
    
    const frontmatter = `---
teamwerx:
  version: "1.0.0"
  initialized: "${new Date().toISOString().split('T')[0]}"
---

`;
    
    const agentInstructions = `# teamWERX Agent Instructions

AI agents: Use teamWERX commands to coordinate goal-based development with the developer.

## Commands

### \`/teamwerx.goal [description]\`
Create a new goal. Prompt for success criteria. Save to \`.teamwerx/goals/[kebab-case-title].md\` with YAML frontmatter (title, status: draft, created, success_criteria).

### \`/teamwerx.research [goal-name] [--note <text>] [--file <path>] [--url <url>]\`
Session-based analysis. Analyze the current goal (or supplied artifact such as a plan/proposal), search the web when allowed, and incorporate supplemental context passed through \`--note\`, \`--file\`, or \`--url\`. Each invocation creates \`.teamwerx/research/[artifact]/session-<timestamp>/\`; store \`report.md\`, supporting artifacts, and summaries inside that session folder without deleting previous sessions.

### \`/teamwerx.discuss [message]\`
Continue structured discussion about implementation strategy. Append timestamped entries to \`.teamwerx/research/[artifact]/discussion.md\` (never overwrite existing discussion). Call out the relevant goal/plan/proposal at the top of each entry.

### \`/teamwerx.dry-run\`
Simulate current plan to identify potential issues. Provide feedback before execution.

### \`/teamwerx.plan\`
Generate task list from accumulated research/discussion. Update \`.teamwerx/plans/[goal-name].md\` while preserving prior context (append new sections or add version notes instead of deleting previous content).

### \`/teamwerx.execute\`
Execute tasks in current plan. Guide implementation with context and code suggestions.

### \`/teamwerx.propose [description]\`
Propose change to goal/plan. Save to \`.teamwerx/proposals/[goal-name]/[proposal-id].md\`.

### \`/teamwerx.list [--status=<status>]\`
List all goals. Filter by status if specified. Display title, status, created date.

### \`/teamwerx.status [goal-name]\`
Show detailed status of goal (or all goals if omitted). Include plan status and recent activity.

### \`/teamwerx.use [goal-name]\`
Set current working goal context. Store in \`.teamwerx/.current-goal\`.

## Conventions
- Default goal status: \`draft\`
- Git commits: Manual, prefix \`[teamWERX]\`
- File naming: kebab-case
- Task statuses: pending | in-progress | completed
- Goal statuses: draft | open | in-progress | blocked | completed | cancelled
- Commands are non-destructive: append, create new session directories, or add addenda instead of deleting existing artifacts.
`;
    
    if (agentsExists) {
      // Read existing file and update frontmatter
      let existingContent = await fs.readFile(agentsPath, 'utf8');
      
      // Remove existing frontmatter if present
      const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
      existingContent = existingContent.replace(frontmatterRegex, '');
      
      // Write new frontmatter + existing content
      await fs.writeFile(agentsPath, frontmatter + existingContent, 'utf8');
      agentsSpinner.succeed('AGENTS.md updated with teamWERX configuration');
    } else {
      // Create new AGENTS.md
      await fs.writeFile(agentsPath, frontmatter + agentInstructions, 'utf8');
      agentsSpinner.succeed('AGENTS.md created');
    }
  } catch (err) {
    agentsSpinner.fail();
    console.error(chalk.red(`\n✗ Error setting up AGENTS.md: ${err.message}\n`));
    process.exit(1);
  }
  
  // Success message
  console.log(chalk.green.bold('\n✓ teamWERX initialized successfully!\n'));
  console.log(chalk.white('Next steps:'));
  console.log(chalk.gray('  1. Create your first goal: ') + chalk.cyan('teamwerx goal "Your goal description"'));
  console.log(chalk.gray('  2. List all goals: ') + chalk.cyan('teamwerx list'));
  console.log(chalk.gray('  3. View help: ') + chalk.cyan('teamwerx --help'));
  console.log(chalk.gray('\nRemember to commit your .teamwerx files with: ') + chalk.cyan('[teamWERX] prefix\n'));
}

module.exports = init;
