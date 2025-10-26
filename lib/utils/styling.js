/**
 * Consistent styling utilities for teamWERX output
 *
 * Provides standardized colors, formatting, and visual elements
 * to ensure consistent CLI appearance across all commands.
 */

const chalk = require('chalk');

/**
 * Standard color scheme for different types of output
 */
const COLORS = {
  // Status colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.gray,
  white: chalk.white,

  // Semantic colors
  primary: chalk.cyan,
  secondary: chalk.magenta,
  accent: chalk.blue,

  // Status-specific
  current: chalk.green,
  pending: chalk.yellow,
  completed: chalk.green,
  blocked: chalk.red,
  draft: chalk.gray,
  open: chalk.blue,
  cancelled: chalk.red,
};

/**
 * Standard formatting functions
 */
const FORMAT = {
  /**
   * Format a header with consistent styling
   * @param {string} text - Header text
   * @param {string} emoji - Optional emoji prefix
   * @returns {string} Formatted header
   */
  header: (text, emoji = '') => {
    const prefix = emoji ? `${emoji} ` : '';
    return chalk.bold.blue(`\n${prefix}${text}\n`);
  },

  /**
   * Format a success message
   * @param {string} text - Success message
   * @returns {string} Formatted success message
   */
  success: (text) => chalk.green.bold(`✓ ${text}`),

  /**
   * Format an error message
   * @param {string} text - Error message
   * @returns {string} Formatted error message
   */
  error: (text) => chalk.red.bold(`✗ ${text}`),

  /**
   * Format a warning message
   * @param {string} text - Warning message
   * @returns {string} Formatted warning message
   */
  warning: (text) => chalk.yellow(`⚠ ${text}`),

  /**
   * Format an info message
   * @param {string} text - Info message
   * @returns {string} Formatted info message
   */
  info: (text) => chalk.blue(`ℹ ${text}`),

  /**
   * Format a label-value pair
   * @param {string} label - Label text
   * @param {string} value - Value text
   * @param {string} labelColor - Color for label (default: white)
   * @param {string} valueColor - Color for value (default: cyan)
   * @returns {string} Formatted label-value pair
   */
  labelValue: (label, value, labelColor = 'white', valueColor = 'primary') => {
    return `${COLORS[labelColor](label)} ${COLORS[valueColor](value)}`;
  },

  /**
   * Format a status indicator
   * @param {string} status - Status text
   * @returns {string} Formatted status with appropriate color
   */
  status: (status) => {
    const color = COLORS[status.toLowerCase()] || COLORS.muted;
    return color(status);
  },

  /**
   * Format a code/path reference
   * @param {string} text - Code or path text
   * @returns {string} Formatted code reference
   */
  code: (text) => chalk.cyan(`\`${text}\``),

  /**
   * Format a command example
   * @param {string} command - Command text
   * @returns {string} Formatted command
   */
  command: (text) => chalk.cyan(text),

  /**
   * Format a file path
   * @param {string} path - File path
   * @returns {string} Formatted file path
   */
  path: (path) => chalk.gray(path),

  /**
   * Format a number with consistent styling
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  number: (num) => chalk.yellow(num.toString()),

  /**
   * Format a list item
   * @param {string} text - List item text
   * @param {string} bullet - Bullet character (default: •)
   * @returns {string} Formatted list item
   */
  listItem: (text, bullet = '•') => `${chalk.gray(`  ${bullet} ${text}`)}`,

  /**
   * Format a section divider
   * @param {string} title - Section title (optional)
   * @returns {string} Formatted section divider
   */
  divider: (title = '') => {
    const line = '─'.repeat(50);
    if (title) {
      const padding = Math.max(0, (line.length - title.length - 2) / 2);
      const leftPad = '─'.repeat(Math.floor(padding));
      const rightPad = '─'.repeat(Math.ceil(padding));
      return chalk.gray(`\n${leftPad} ${title} ${rightPad}\n`);
    }
    return chalk.gray(`\n${line}\n`);
  },
};

/**
 * Get status color function
 * @param {string} status - Status string
 * @returns {Function} Chalk color function
 */
function getStatusColor(status) {
  return COLORS[status.toLowerCase()] || COLORS.muted;
}

/**
 * Create a styled table with consistent formatting
 * @param {Object} options - Table options
 * @param {string[]} options.head - Table headers
 * @param {number[]} options.colWidths - Column widths
 * @returns {Object} Configured table instance
 */
function createStyledTable(options = {}) {
  const Table = require('cli-table3');
  return new Table({
    head: options.head || [],
    colWidths: options.colWidths || [],
    style: {
      head: ['cyan', 'bold'],
      border: ['gray'],
    },
  });
}

module.exports = {
  COLORS,
  FORMAT,
  getStatusColor,
  createStyledTable,
};
