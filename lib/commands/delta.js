/**
 * View changes between different versions of a goal or plan
 */

const chalk = require('chalk');
const { getDiff } = require('../utils/git');

async function delta(artifactPath, version1, version2) {
  try {
    console.log(chalk.blue.bold('\n📊 Version Delta\n'));
    console.log(chalk.white('File: ') + chalk.cyan(artifactPath));
    console.log(chalk.white('Comparing: ') + chalk.yellow(version1) + chalk.white(' → ') + chalk.green(version2));
    console.log();
    
    const diff = await getDiff(artifactPath, version1, version2);
    
    if (!diff) {
      console.log(chalk.gray('No differences found.\n'));
      return;
    }
    
    // Colorize diff output
    const lines = diff.split('\n');
    for (const line of lines) {
      if (line.startsWith('+')) {
        console.log(chalk.green(line));
      } else if (line.startsWith('-')) {
        console.log(chalk.red(line));
      } else if (line.startsWith('@@')) {
        console.log(chalk.cyan(line));
      } else {
        console.log(chalk.gray(line));
      }
    }
    
    console.log();
  } catch (err) {
    console.error(chalk.red(`\n✗ Error: ${err.message}\n`));
    process.exit(1);
  }
}

module.exports = delta;
