/**
 * Archive a goal and related artifacts into .teamwerx/archive/
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const {
  getCurrentGoal,
  getCurrentGoalPath,
  getTeamwerxDir,
  fileExists,
  dirExists,
  ensureDir,
} = require('../utils/file');

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureUniqueTarget(targetPath) {
  if (!(await pathExists(targetPath))) {
    return targetPath;
  }

  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const base = path.basename(targetPath, ext);
  let counter = 1;

  while (true) {
    const candidate = path.join(dir, `${base}-${counter}${ext}`);
    if (!(await pathExists(candidate))) {
      return candidate;
    }
    counter += 1;
  }
}

async function movePath(source, target) {
  const dir = path.dirname(target);
  await ensureDir(dir);
  const finalTarget = await ensureUniqueTarget(target);
  await fs.rename(source, finalTarget);
  return finalTarget;
}

function formatRelative(fullPath) {
  return path.relative(process.cwd(), fullPath);
}

async function archive(goalName, options = {}) {
  const goal = goalName || (await getCurrentGoal());

  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(
      chalk.gray('Specify a goal explicitly or set one with: ') +
        chalk.cyan('teamwerx use <goal-name>\n')
    );
    process.exit(1);
  }

  const teamwerxDir = getTeamwerxDir();
  const artifacts = [
    {
      label: 'Goal',
      source: path.join(teamwerxDir, 'goals', `${goal}.md`),
      target: path.join(teamwerxDir, 'archive', 'goals', `${goal}.md`),
      check: fileExists,
    },
    {
      label: 'Plan',
      source: path.join(teamwerxDir, 'plans', `${goal}.md`),
      target: path.join(teamwerxDir, 'archive', 'plans', `${goal}.md`),
      check: fileExists,
    },
    {
      label: 'Research',
      source: path.join(teamwerxDir, 'research', goal),
      target: path.join(teamwerxDir, 'archive', 'research', goal),
      check: dirExists,
    },
    {
      label: 'Proposals',
      source: path.join(teamwerxDir, 'proposals', goal),
      target: path.join(teamwerxDir, 'archive', 'proposals', goal),
      check: dirExists,
    },
  ];

  const itemsToArchive = [];

  for (const artifact of artifacts) {
    if (await artifact.check(artifact.source)) {
      itemsToArchive.push(artifact);
    }
  }

  if (!itemsToArchive.length) {
    console.log(
      chalk.yellow(
        `\nNo artifacts found for goal '${goal}'. Nothing to archive.`
      )
    );
    return;
  }

  if (!options.yes) {
    console.log(chalk.white('\nThe following artifacts will be archived:'));
    for (const item of itemsToArchive) {
      console.log(
        chalk.gray(`  • ${item.label}: `) +
          chalk.cyan(formatRelative(item.source))
      );
    }

    const { confirmArchive } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmArchive',
        message: `Archive goal '${goal}' and move the artifacts above into .teamwerx/archive/?`,
        default: true,
      },
    ]);

    if (!confirmArchive) {
      console.log(chalk.yellow('\nArchival cancelled.\n'));
      return;
    }
  }

  console.log(chalk.blue.bold('\n📦 Archiving goal\n'));

  const results = [];
  for (const item of itemsToArchive) {
    try {
      const finalTarget = await movePath(item.source, item.target);
      results.push({
        label: item.label,
        target: finalTarget,
      });
      console.log(
        chalk.green(`✓ Archived ${item.label.toLowerCase()}: `) +
          chalk.cyan(`${formatRelative(finalTarget)}`)
      );
    } catch (err) {
      console.error(
        chalk.red(`✗ Failed to archive ${item.label.toLowerCase()}: ${err.message}`)
      );
    }
  }

  const currentGoal = await getCurrentGoal();
  if (currentGoal && currentGoal.trim() === goal.trim()) {
    const currentGoalPath = getCurrentGoalPath();
    try {
      await fs.unlink(currentGoalPath);
    } catch {
      // ignore if file missing
    }
  }

  console.log(
    chalk.white(
      `\nGoal '${goal}' archived. Review .teamwerx/archive/* and commit the changes when ready.`
    )
  );
}

module.exports = archive;
