/**
 * Standardized error handling utilities for teamWERX
 */

const chalk = require('chalk');

/**
 * Standard error codes for consistent exit behavior
 */
const ERROR_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NOT_INITIALIZED: 2,
  GOAL_NOT_FOUND: 3,
  FILE_NOT_FOUND: 4,
  VALIDATION_ERROR: 5,
  PERMISSION_ERROR: 6,
  NETWORK_ERROR: 7,
  CONFIG_ERROR: 8,
};

/**
 * Standard error messages for consistent user communication
 */
const ERROR_MESSAGES = {
  NOT_INITIALIZED:
    'teamWERX is not initialized. Please run \'teamwerx init\' first.',
  GOAL_NOT_FOUND: (goalName) => `Goal "${goalName}" not found.`,
  NO_CURRENT_GOAL: 'No goal specified and no current goal set.',
  GOAL_EXISTS: (goalName) => `Goal "${goalName}" already exists.`,
  INVALID_INPUT: (field) => `${field} is required.`,
  FILE_OPERATION_FAILED: (operation, path) =>
    `Failed to ${operation} file: ${path}`,
  WORKSPACE_ERROR: 'Workspace operation failed.',
  VALIDATION_FAILED: 'Input validation failed.',
};

/**
 * Handle errors consistently across all commands
 * @param {Error} error - The error that occurred
 * @param {string} context - Context message for the error
 * @param {number} exitCode - Exit code to use (defaults to GENERAL_ERROR)
 */
function handleError(
  error,
  context = '',
  exitCode = ERROR_CODES.GENERAL_ERROR,
) {
  const message = context ? `${context}: ${error.message}` : error.message;
  console.error(chalk.red(`\n✗ Error: ${message}\n`));
  process.exit(exitCode);
}

/**
 * Handle validation errors with user-friendly messages
 * @param {string} message - Validation error message
 * @param {string} suggestion - Optional suggestion for fixing the error
 */
function handleValidationError(message, suggestion = '') {
  console.error(chalk.red(`\n✗ ${message}`));
  if (suggestion) {
    console.log(chalk.yellow(`  ${suggestion}\n`));
  } else {
    console.log();
  }
  process.exit(ERROR_CODES.VALIDATION_ERROR);
}

/**
 * Handle file system errors with consistent messaging
 * @param {Error} error - File system error
 * @param {string} operation - Operation that failed (read, write, etc.)
 * @param {string} path - File/directory path
 */
function handleFileError(error, operation, path) {
  const message = ERROR_MESSAGES.FILE_OPERATION_FAILED(operation, path);
  console.error(chalk.red(`\n✗ ${message}`));
  console.error(chalk.gray(`  Details: ${error.message}\n`));
  process.exit(ERROR_CODES.FILE_NOT_FOUND);
}

/**
 * Check if teamWERX is initialized and exit if not
 * @param {boolean} isInitialized - Whether teamWERX is initialized
 */
function requireInitialization(isInitialized) {
  if (!isInitialized) {
    console.error(chalk.red('\n✗ Error: ' + ERROR_MESSAGES.NOT_INITIALIZED));
    console.log(chalk.yellow('  Please run \'teamwerx init\' first.\n'));
    process.exit(ERROR_CODES.NOT_INITIALIZED);
  }
}

/**
 * Check if a goal exists and exit if not
 * @param {boolean} exists - Whether the goal exists
 * @param {string} goalName - Name of the goal
 */
function requireGoalExists(exists, goalName) {
  if (!exists) {
    console.error(
      chalk.red('\n✗ Error: ' + ERROR_MESSAGES.GOAL_NOT_FOUND(goalName)),
    );
    console.log(
      chalk.gray('  List available goals with: ') +
        chalk.cyan('teamwerx list\n'),
    );
    process.exit(ERROR_CODES.GOAL_NOT_FOUND);
  }
}

/**
 * Display success message with consistent formatting
 * @param {string} message - Success message
 * @param {Object} details - Optional details to display
 */
function displaySuccess(message, details = {}) {
  console.log(chalk.green.bold(`\n✓ ${message}\n`));

  Object.entries(details).forEach(([key, value]) => {
    console.log(chalk.white(`${key}: `) + chalk.cyan(value));
  });

  if (Object.keys(details).length > 0) {
    console.log();
  }
}

/**
 * Display info message with consistent formatting
 * @param {string} message - Info message
 */
function displayInfo(message) {
  console.log(chalk.blue(message));
}

/**
 * Display warning message with consistent formatting
 * @param {string} message - Warning message
 */
function displayWarning(message) {
  console.log(chalk.yellow(`⚠ ${message}`));
}

module.exports = {
  ERROR_CODES,
  ERROR_MESSAGES,
  handleError,
  handleValidationError,
  handleFileError,
  requireInitialization,
  requireGoalExists,
  displaySuccess,
  displayInfo,
  displayWarning,
};
