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
const { handleValidationError, handleError } = require('../utils/errors');

/**
 * Analyze the codebase and generate/update a research report
 * @param {string} goalName - Optional goal name (uses current goal if not specified)
 * @param {Object} options - Command options
 * @param {string} options.goal - Alternative way to specify goal name
 * @returns {Promise<void>}
 */
async function research(goalName, options = {}) {
  const goal = options.goal || goalName || await getCurrentGoal();

  if (!goal) {
    handleValidationError('No goal specified and no current goal set.', 'Set a current goal with: teamwerx use <goal-name>');
  }

  try {
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
  } catch (error) {
    handleError(error, 'generating research report');
  }
}

module.exports = research;
