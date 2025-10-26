/**
 * Derive goal status from workspace state
 *
 * Status is no longer stored explicitly - it's computed from:
 * - Existence of plan file
 * - Task completion state
 * - Manual override (archived, cancelled)
 */

const path = require('path');
const {
  getTeamwerxDir,
  fileExists,
  readFileWithFrontmatter,
} = require('./file');

/**
 * Derive status from goal and plan state
 * @param {string} goalSlug - Goal identifier
 * @returns {Promise<string>} - Status: draft|open|in-progress|completed|blocked|cancelled
 */
async function deriveGoalStatus(goalSlug) {
  const goalPath = path.join(getTeamwerxDir(), 'goals', `${goalSlug}.md`);
  const goal = await readFileWithFrontmatter(goalPath);

  // Check for manual status overrides
  if (goal.data.archived) return 'archived';
  if (goal.data.cancelled) return 'cancelled';

  // Try to find workspace and plan
  const { GoalWorkspaceManager } = require('../core/goal-workspace-manager');
  try {
    const workspace = await GoalWorkspaceManager.getWorkspace(goalSlug);
    const planExists = await fileExists(workspace.planPath);

    if (!planExists) {
      return 'draft'; // No plan yet
    }

    const { PlanManager } = require('../core/plan-manager');
    const plan = new PlanManager(workspace);
    await plan.load();

    if (plan.tasks.length === 0) {
      return 'open'; // Plan exists but no tasks
    }

    const completed = plan.tasks.filter((t) => t.status === 'completed').length;
    const blocked = plan.tasks.filter((t) => t.status === 'blocked').length;

    if (blocked > 0) {
      return 'blocked'; // Any blocked tasks = goal is blocked
    }

    if (completed === plan.tasks.length && plan.tasks.length > 0) {
      return 'completed'; // All tasks done
    }

    if (completed > 0) {
      return 'in-progress'; // Some tasks done
    }

    return 'open'; // Has tasks but none started
  } catch (err) {
    // No workspace yet
    return 'draft';
  }
}

/**
 * Get status with color formatting
 */
function getStatusColor(status) {
  const colors = {
    draft: 'gray',
    open: 'blue',
    'in-progress': 'yellow',
    blocked: 'red',
    completed: 'green',
    cancelled: 'dim',
    archived: 'dim',
  };
  return colors[status] || 'white';
}

module.exports = {
  deriveGoalStatus,
  getStatusColor,
};
