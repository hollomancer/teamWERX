/**
 * File system utilities for teamWERX
 */

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

/**
 * Check if a directory exists
 */
async function dirExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Ensure a directory exists, create if it doesn't
 */
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

/**
 * Read a file and parse frontmatter if present
 */
async function readFileWithFrontmatter(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return matter(content);
}

/**
 * Write a file with frontmatter
 */
async function writeFileWithFrontmatter(filePath, data, content) {
  const fileContent = matter.stringify(content, data);
  await fs.writeFile(filePath, fileContent, 'utf8');
}

/**
 * Convert a title to kebab-case for filenames
 */
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get the teamWERX root directory path
 */
function getTeamwerxDir() {
  return path.join(process.cwd(), '.teamwerx');
}

/**
 * Get the current goal file path
 */
function getCurrentGoalPath() {
  return path.join(getTeamwerxDir(), '.current-goal');
}

/**
 * Read the current goal name
 */
async function getCurrentGoal() {
  const currentGoalPath = getCurrentGoalPath();
  if (await fileExists(currentGoalPath)) {
    const goalName = await fs.readFile(currentGoalPath, 'utf8');
    return goalName.trim();
  }
  return null;
}

/**
 * Set the current goal
 */
async function setCurrentGoal(goalName) {
  const currentGoalPath = getCurrentGoalPath();
  await fs.writeFile(currentGoalPath, goalName, 'utf8');
}

/**
 * List all goal files
 */
async function listGoals() {
  const goalsDir = path.join(getTeamwerxDir(), 'goals');
  
  if (!(await dirExists(goalsDir))) {
    return [];
  }
  
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
