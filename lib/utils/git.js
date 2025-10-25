/**
 * Git utilities for teamWERX
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Check if the current directory is a git repository
 */
async function isGitRepo() {
  try {
    await execAsync('git rev-parse --git-dir');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git diff between two versions for a specific file
 */
async function getDiff(artifactPath, version1, version2) {
  try {
    const { stdout } = await execAsync(
      `git diff ${version1} ${version2} -- ${artifactPath}`
    );
    return stdout;
  } catch (err) {
    throw new Error(`Failed to get diff: ${err.message}`);
  }
}

/**
 * Get git log for a specific file
 */
async function getFileLog(filePath, limit = 10) {
  try {
    const { stdout } = await execAsync(
      `git log --pretty=format:"%H|%ai|%s" -n ${limit} -- ${filePath}`
    );
    
    if (!stdout) {
      return [];
    }
    
    return stdout.split('\n').map(line => {
      const [hash, date, message] = line.split('|');
      return { hash, date, message };
    });
  } catch {
    return [];
  }
}

/**
 * Check if there are uncommitted changes
 */
async function hasUncommittedChanges() {
  try {
    const { stdout } = await execAsync('git status --porcelain');
    return stdout.length > 0;
  } catch {
    return false;
  }
}

module.exports = {
  isGitRepo,
  getDiff,
  getFileLog,
  hasUncommittedChanges
};
