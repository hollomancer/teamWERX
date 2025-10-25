/**
 * File system utilities for teamWERX
 *
 * Provides consistent file I/O operations with proper error handling
 * and frontmatter support for markdown files.
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { handleFileError } = require('./errors');

/**
 * Check if a directory exists
 * @param {string} dirPath - Path to the directory to check
 * @returns {Promise<boolean>} True if directory exists, false otherwise
 */
async function dirExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      handleFileError(error, 'check', dirPath);
    }
    return false;
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file to check
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch (error) {
    if (error.code !== 'ENOENT') {
      handleFileError(error, 'check', filePath);
    }
    return false;
  }
}

/**
 * Ensure a directory exists, creating it recursively if necessary
 * @param {string} dirPath - Path to the directory to ensure exists
 * @returns {Promise<void>}
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      handleFileError(error, 'create', dirPath);
    }
  }
}

/**
 * Read a file and parse frontmatter if present
 * @param {string} filePath - Path to the file to read
 * @returns {Promise<Object>} Object with data (frontmatter) and content properties
 */
async function readFileWithFrontmatter(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return matter(content);
  } catch (error) {
    handleFileError(error, 'read', filePath);
  }
}

/**
 * Write a file with frontmatter
 * @param {string} filePath - Path to the file to write
 * @param {Object} data - Frontmatter data object
 * @param {string} content - File content (markdown body)
 * @returns {Promise<void>}
 */
async function writeFileWithFrontmatter(filePath, data, content) {
  try {
    const fileContent = matter.stringify(content, data);
    await fs.writeFile(filePath, fileContent, 'utf8');
  } catch (error) {
    handleFileError(error, 'write', filePath);
  }
}

/**
 * Convert a title to kebab-case for filenames
 * @param {string} str - String to convert
 * @returns {string} Kebab-case version of the input string
 */
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get the teamWERX root directory path
 * @returns {string} Absolute path to .teamwerx directory
 */
function getTeamwerxDir() {
  return path.join(process.cwd(), '.teamwerx');
}

/**
 * Get the current goal file path
 * @returns {string} Absolute path to .current-goal file
 */
function getCurrentGoalPath() {
  return path.join(getTeamwerxDir(), '.current-goal');
}

/**
 * Read the current goal name from the .current-goal file
 * @returns {Promise<string|null>} Current goal name or null if not set
 */
async function getCurrentGoal() {
  const currentGoalPath = getCurrentGoalPath();
  if (await fileExists(currentGoalPath)) {
    try {
      const goalName = await fs.readFile(currentGoalPath, 'utf8');
      return goalName.trim();
    } catch (error) {
      handleFileError(error, 'read', currentGoalPath);
    }
  }
  return null;
}

/**
 * Set the current goal by writing to .current-goal file
 * @param {string} goalName - Name of the goal to set as current
 * @returns {Promise<void>}
 */
async function setCurrentGoal(goalName) {
  const currentGoalPath = getCurrentGoalPath();
  try {
    await fs.writeFile(currentGoalPath, goalName, 'utf8');
  } catch (error) {
    handleFileError(error, 'write', currentGoalPath);
  }
}

/**
 * List all goal files in the goals directory
 * @returns {Promise<Array<Object>>} Array of goal objects with filename, frontmatter data, and content
 */
async function listGoals() {
  const goalsDir = path.join(getTeamwerxDir(), 'goals');

  if (!(await dirExists(goalsDir))) {
    return [];
  }

  try {
    const files = await fs.readdir(goalsDir);
    const goals = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const goalPath = path.join(goalsDir, file);
        const parsed = await readFileWithFrontmatter(goalPath);
        goals.push({
          filename: file.replace('.md', ''),
          ...parsed.data,
          content: parsed.content
        });
      }
    }

    return goals;
  } catch (error) {
    handleFileError(error, 'list', goalsDir);
  }
}

module.exports = {
  dirExists,
  fileExists,
  ensureDir,
  readFileWithFrontmatter,
  writeFileWithFrontmatter,
  toKebabCase,
  getTeamwerxDir,
  getCurrentGoalPath,
  getCurrentGoal,
  setCurrentGoal,
  listGoals
};
