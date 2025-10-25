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
const { ProjectContext } = require('../core/project-context');

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
  
  const projectContext = new ProjectContext(process.cwd());
  
  // Create directory structure
  const structureSpinner = ora('Creating directory structure...').start();
  
  try {
    await ensureDir(teamwerxPath);
    await projectContext.ensureStructure();
    
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
    
    // Generate AGENTS.md template inline
    const initializedDate = new Date().toISOString().split('T')[0];
    const agentsTemplate = await fs.readFile(path.join(__dirname, '..', '..', 'AGENTS.md'), 'utf8');
    const frontmatter = `---\nteamwerx:\n  version: "1.0.0"\n  initialized: "${initializedDate}"\n---\n\n`;
    
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
      await fs.writeFile(agentsPath, agentsTemplate, 'utf8');
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
