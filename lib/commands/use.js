/**
 * Set the current working goal context
 */

const path = require('path');
const chalk = require('chalk');
const { getTeamwerxDir, fileExists, setCurrentGoal } = require('../utils/file');
const { requireGoalExists, displaySuccess } = require('../utils/errors');

/**
 * Set the current working goal context
 * @param {string} goalName - Name of the goal to set as current
 * @returns {Promise<void>}
 */
async function use(goalName) {
  // Check if goal exists
  const goalPath = path.join(getTeamwerxDir(), 'goals', `${goalName}.md`);
  requireGoalExists(await fileExists(goalPath), goalName);

  // Set current goal
  await setCurrentGoal(goalName);

  displaySuccess(`Current goal set to: ${goalName}`);
}

module.exports = use;
