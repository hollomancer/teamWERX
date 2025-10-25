/**
 * Add reflection entry to capture learning and adaptations
 *
 * This command is designed to be executed by an AI agent.
 * Records what worked, what didn't, and adaptations made during execution.
 */

const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { DiscussionManager } = require('../core/discussion-manager');

async function reflect(options = {}) {
  const goal = options.goal || await getCurrentGoal();

  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const discussion = new DiscussionManager(workspace);
  await discussion.load();

  // Prepare reflection template
  const reflectionTemplate = options.notes || `**What Worked:**
<!-- Successful approaches, helpful patterns, effective strategies -->

**What Didn't Work:**
<!-- Challenges, blockers, unexpected complications -->

**Adaptations Made:**
<!-- Changes to approach, plan adjustments, lessons learned -->

**Next Steps:**
<!-- Action items, follow-up questions, areas needing attention -->`;

  const entry = discussion.addEntry({
    type: 'reflection',
    content: reflectionTemplate,
  });

  await discussion.save();

  console.log(
    chalk.green(`\n✓ Added reflection entry ${entry.id} for ${workspace.title}.`)
  );
  console.log(chalk.gray('\nEdit the reflection in: ') + chalk.cyan(workspace.discussPath));
  console.log(chalk.gray('Complete the reflection sections before continuing.\n'));
}

module.exports = reflect;
