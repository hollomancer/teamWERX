/**
 * reflect.js
 *
 * Lightweight reflect command implementation.
 *
 * Supports:
 * - reflect() called with a string (notes)
 * - reflect(options) called with an options object:
 *    { goal, notes, inspire, dryRun }
 *
 * Behavior:
 * - If `inspire` is true, generates a brief inspiration entry based on pending tasks and last discussion.
 * - If `dryRun` is true, records a dry-run entry (non-destructive summary).
 * - Otherwise, creates a `reflection` entry in the discussion log containing provided notes or a template.
 */

const chalk = require('chalk');
const { getCurrentGoal } = require('../utils/file');
const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
const { DiscussionManager } = require('../core/discussion-manager');
const { PlanManager } = require('../core/plan-manager');

async function reflect(rawOptions = {}) {
  // Support calling reflect with a simple notes string
  const options =
    typeof rawOptions === 'string' ? { notes: rawOptions } : rawOptions || {};

  try {
    const goal = options.goal || (await getCurrentGoal());
    if (!goal) {
      console.error(
        chalk.red('\n✗ Error: No goal specified and no current goal set.')
      );
      console.log(
        chalk.gray('Set a current goal with: ') +
          chalk.cyan('teamwerx use <goal-name>\n')
      );
      process.exit(1);
    }

    const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
    const discussion = new DiscussionManager(workspace);
    await discussion.load();

    // Handle inspire: generate lightweight suggestions based on plan & discussion state
    if (options.inspire) {
      try {
        const plan = new PlanManager(workspace);
        await plan.load();

        const pending = plan.getPendingTasks(10);
        const suggestions = [];

        if (pending.length) {
          suggestions.push(
            `Pending tasks (${pending
              .map((t) => t.id)
              .join(', ')}): consider prioritization or dependency checks.`
          );
        } else {
          suggestions.push(
            'No pending tasks detected. Consider closing or defining follow-up work.'
          );
        }

        if (!discussion.entries.length) {
          suggestions.push(
            'No discussion entries yet — capture architectural decisions before heavy changes.'
          );
        } else {
          const last = discussion.entries[discussion.entries.length - 1];
          suggestions.push(
            `Last discussion (${last.id}) on ${new Date(
              last.timestamp
            ).toLocaleDateString()}; update if plans changed.`
          );
        }

        const content = suggestions.map((s) => `- ${s}`).join('\n');
        const entry = discussion.addEntry({ type: 'inspiration', content });
        await discussion.save();

        console.log(
          chalk.green(
            `\n✓ Added inspiration entry ${entry.id} for ${workspace.title}.\n`
          )
        );
        return;
      } catch (err) {
        console.error(
          chalk.red('Error during inspire generation:'),
          err.message || err
        );
        process.exit(1);
      }
    }

    // Handle dry-run: record a brief non-destructive dry-run note
    if (options.dryRun) {
      try {
        const plan = new PlanManager(workspace);
        await plan.load();

        const pendingIds = plan.getPendingTasks(5).map((t) => t.id);
        const pendingSummary = pendingIds.length
          ? pendingIds.join(', ')
          : 'No pending tasks';

        const notes =
          options.notes || 'Dry-run reflection recorded (no changes applied).';
        const content = `Dry-run Reflection

Pending considered: ${pendingSummary}

Notes:
${notes}`;

        const entry = discussion.addEntry({ type: 'dry-run', content });
        await discussion.save();

        console.log(
          chalk.green(
            `\n✓ Recorded dry-run entry ${entry.id} for ${workspace.title}.\n`
          )
        );
        return;
      } catch (err) {
        console.error(
          chalk.red('Error recording dry-run reflection:'),
          err.message || err
        );
        process.exit(1);
      }
    }

    // Default: add a reflection entry to the discussion log
    const reflectionTemplate =
      options.notes ||
      `**What Worked:**
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
      chalk.green(
        `\n✓ Added reflection entry ${entry.id} for ${workspace.title}.\n`
      )
    );
    console.log(
      chalk.gray('\nEdit the reflection in: ') +
        chalk.cyan(workspace.discussPath)
    );
    console.log(
      chalk.gray('Complete the reflection sections before continuing.\n')
    );
  } catch (err) {
    console.error(
      chalk.red('Error adding reflection entry:'),
      err.message || err
    );
    process.exit(1);
  }
}

module.exports = reflect;
