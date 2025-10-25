#!/usr/bin/env node

/**
 * Generate shell completion scripts for teamWERX
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');

program
  .name('generate-completion')
  .description('Generate shell completion scripts')
  .option('--shell <shell>', 'Shell type (bash|zsh|fish)', 'bash')
  .option('--output <file>', 'Output file path')
  .action(async (options) => {
    const { shell, output } = options;

    let completionScript = '';

    switch (shell) {
      case 'bash':
        completionScript = generateBashCompletion();
        break;
      case 'zsh':
        completionScript = generateZshCompletion();
        break;
      case 'fish':
        completionScript = generateFishCompletion();
        break;
      default:
        console.error(chalk.red(`Unsupported shell: ${shell}`));
        process.exit(1);
    }

    const outputPath = output || `teamwerx-completion.${shell}`;

    try {
      await fsp.writeFile(outputPath, completionScript);
      console.log(chalk.green(`✓ Completion script generated: ${outputPath}`));
      console.log(chalk.gray(`\nTo install:`));

      switch (shell) {
        case 'bash':
          console.log(chalk.cyan(`  source ${outputPath}`));
          console.log(chalk.gray(`  # Or add to ~/.bashrc`));
          break;
        case 'zsh':
          console.log(chalk.cyan(`  source ${outputPath}`));
          console.log(chalk.gray(`  # Or add to ~/.zshrc`));
          break;
        case 'fish':
          console.log(chalk.cyan(`  source ${outputPath}`));
          console.log(chalk.gray(`  # Or add to ~/.config/fish/config.fish`));
          break;
      }
    } catch (error) {
      console.error(chalk.red(`Failed to write completion script: ${error.message}`));
      process.exit(1);
    }
  });

function generateBashCompletion() {
  const templatePath = path.join(__dirname, 'completion-templates', 'teamwerx.bash');
  return fs.readFileSync(templatePath, 'utf8');
}

function generateZshCompletion() {
  const templatePath = path.join(__dirname, 'completion-templates', 'teamwerx.zsh');
  return fs.readFileSync(templatePath, 'utf8');
}

function generateFishCompletion() {
  const templatePath = path.join(__dirname, 'completion-templates', 'teamwerx.fish');
  return fs.readFileSync(templatePath, 'utf8');
}

// Run if called directly
if (require.main === module) {
  program.parse(process.argv);
}

module.exports = {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion
};
