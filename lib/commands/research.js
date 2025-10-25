/**
 * Analyze the codebase and generate a research report
 * 
 * This command is designed to be executed by an AI agent.
 * Each invocation creates a session directory so prior research is never overwritten.
 */

const path = require('path');
const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const { ResearchSessionManager } = require('../core/research-session');

async function research(goalName, options = {}) {
  const goal = goalName || await getCurrentGoal();
  
  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }
  
  const sessionManager = new ResearchSessionManager(goal);
  const { sessionId, sessionDir } = await sessionManager.createSession();
  const supplemental = await sessionManager.captureSupplementalInputs(options);
  const relativeSessionDir = path.relative(process.cwd(), sessionDir);
  
  console.log(chalk.blue.bold('\n🔍 Research Mode\n'));
  console.log(chalk.white('Goal: ') + chalk.cyan(goal));
  console.log(chalk.white('Session: ') + chalk.cyan(`session-${sessionId}`));
  console.log(chalk.white('Session folder: ') + chalk.cyan(relativeSessionDir));
  console.log(chalk.yellow('\nThis command should be executed by an AI agent.'));
  console.log(chalk.gray('The AI agent should:'));
  console.log(chalk.gray('  1. Read the goal file: ') + chalk.cyan(`.teamwerx/goals/${goal}.md`));
  console.log(chalk.gray('  2. Review prior research sessions (do not delete them) and any supplemental inputs provided below.'));
  console.log(chalk.gray('  3. Analyze the codebase and, when allowed, search the web for up-to-date references.'));
  console.log(chalk.gray(`  4. Incorporate any attached files/notes/URLs stored in: `) + chalk.cyan(path.join(relativeSessionDir, 'inputs')));
  console.log(chalk.gray(`  5. Save new findings to: `) + chalk.cyan(path.join(relativeSessionDir, 'report.md')));
  console.log(chalk.gray('  6. Append or cross-reference summaries instead of overwriting earlier sessions.'));
  console.log(chalk.gray('\nSee AGENTS.md for detailed instructions.\n'));
  
  const { notes, files, urls } = supplemental;
  if (notes.length || files.length || urls.length) {
    console.log(chalk.white('Supplemental context captured for this session:'));
    if (notes.length) {
      console.log(chalk.gray(`  • Notes: ${notes.join(', ')}`));
    }
    if (files.length) {
      console.log(chalk.gray(`  • Files: ${files.join(', ')}`));
    }
    if (urls.length) {
      console.log(chalk.gray(`  • URLs: ${urls.join(', ')}`));
    }
    console.log();
  }
}

module.exports = research;
