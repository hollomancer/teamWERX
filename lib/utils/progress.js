/**
 * Progress indicator utilities for teamWERX
 *
 * Provides consistent progress indicators and spinners for long-running operations
 */

const ora = require('ora');

/**
 * Create a spinner with consistent styling
 * @param {string} text - Text to display with the spinner
 * @param {string} color - Spinner color (default: 'blue')
 * @returns {ora.Ora} Configured spinner instance
 */
function createSpinner(text, color = 'blue') {
  return ora({
    text,
    color,
    spinner: 'dots'
  });
}

/**
 * Execute an async operation with a spinner
 * @param {string} message - Message to show during operation
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Options for spinner behavior
 * @param {string} options.successMessage - Message to show on success
 * @param {string} options.failMessage - Message to show on failure
 * @param {string} options.color - Spinner color
 * @returns {Promise<any>} Result of the operation
 */
async function withSpinner(message, operation, options = {}) {
  const {
    successMessage = 'Completed successfully',
    failMessage = 'Operation failed',
    color = 'blue'
  } = options;

  const spinner = createSpinner(message, color);
  spinner.start();

  try {
    const result = await operation();
    spinner.succeed(successMessage);
    return result;
  } catch (error) {
    spinner.fail(failMessage);
    throw error;
  }
}

/**
 * Show a progress bar for operations with known steps
 * @param {string} title - Progress bar title
 * @param {number} total - Total number of steps
 * @param {Function} operation - Async function that receives progress callback
 * @returns {Promise<any>} Result of the operation
 */
async function withProgress(title, total, operation) {
  const ProgressBar = require('progress');
  const bar = new ProgressBar(`${title} [:bar] :current/:total :percent :etas`, {
    total,
    width: 30,
    complete: '=',
    incomplete: ' '
  });

  const progressCallback = () => bar.tick();

  try {
    const result = await operation(progressCallback);
    bar.terminate();
    return result;
  } catch (error) {
    bar.terminate();
    throw error;
  }
}

/**
 * Show step-by-step progress for multi-step operations
 * @param {string[]} steps - Array of step descriptions
 * @param {Function} operation - Async function that receives step callback
 * @returns {Promise<any>} Result of the operation
 */
async function withSteps(steps, operation) {
  let currentStep = 0;

  const stepCallback = async (stepOperation) => {
    if (currentStep < steps.length) {
      console.log(`\n${currentStep + 1}. ${steps[currentStep]}`);
    }
    currentStep++;
    return await stepOperation();
  };

  return await operation(stepCallback);
}

module.exports = {
  createSpinner,
  withSpinner,
  withProgress,
  withSteps
};