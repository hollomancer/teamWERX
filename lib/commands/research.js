/**
 * Analyze the codebase and generate a research report
 *
 * This command is designed to be executed by an AI agent.
 * Updates the workspace research file with tech stack detection.
 */

const path = require('path');
const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const {
  detectTechnologyStack,
  listTopLevelDirs,
  detectLanguages,
} = require('../core/project-insights');
const {
  writeFileWithFrontmatter,
  fileExists,
  readFileWithFrontmatter,
} = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');

async function research(goalName, options = {}) {
  const goal = options.goal || goalName || await getCurrentGoal();

  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const stack = await detectTechnologyStack(process.cwd());
  const dirs = await listTopLevelDirs(process.cwd());
  const languages = await detectLanguages(process.cwd());

  let existingFrontmatter = {};
  if (await fileExists(workspace.researchPath)) {
    const existing = await readFileWithFrontmatter(workspace.researchPath);
    existingFrontmatter = existing.data || {};
  }

  const data = {
    ...existingFrontmatter,
    goal: workspace.slug,
    goal_number: workspace.number,
    updated: new Date().toISOString(),
    stack,
    directories: dirs,
    languages,
  };

  const content = `# Research Report for ${workspace.title}

## Technology Stack
${stack.length ? stack.map((item) => `- ${item.name} (${item.manifest})`).join('\n') : '- Not detected'}

## Directory Overview
${dirs.length ? dirs.map((dir) => `- ${dir}/`).join('\n') : '- No directories detected'}

## Languages
${languages.length ? languages.join(', ') : 'Unknown'}

## Notes
- Update this report with additional findings as new research is conducted.
`;

  await writeFileWithFrontmatter(workspace.researchPath, data, content);
  console.log(
    chalk.green(`\n✓ Research report updated at ${path.relative(process.cwd(), workspace.researchPath)}\n`)
  );
}

module.exports = research;
