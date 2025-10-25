/**
 * Test helpers for teamWERX
 *
 * Provides utilities for setting up test environments and mocking
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Create a temporary teamWERX workspace for testing
 * @param {string} prefix - Prefix for the temp directory name
 * @returns {Promise<Object>} Test workspace utilities
 */
async function createTestWorkspace(prefix = 'teamwerx-test') {
  const testDir = path.join(
    os.tmpdir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  await fs.mkdir(testDir, { recursive: true });

  const teamwerxDir = path.join(testDir, '.teamwerx');
  const goalsDir = path.join(teamwerxDir, 'goals');
  const plansDir = path.join(teamwerxDir, 'plans');
  const workspacesDir = path.join(teamwerxDir, 'workspaces');

  await fs.mkdir(goalsDir, { recursive: true });
  await fs.mkdir(plansDir, { recursive: true });
  await fs.mkdir(workspacesDir, { recursive: true });

  const originalCwd = process.cwd();

  return {
    testDir,
    teamwerxDir,
    goalsDir,
    plansDir,
    workspacesDir,

    /**
     * Change to the test directory
     */
    cd: () => process.chdir(testDir),

    /**
     * Restore original working directory
     */
    restore: () => process.chdir(originalCwd),

    /**
     * Create a test goal file
     * @param {string} name - Goal name (without .md extension)
     * @param {Object} data - Frontmatter data
     * @param {string} content - Markdown content
     */
    createGoal: async (name, data = {}, content = '') => {
      const frontmatter = [
        '---',
        ...Object.entries(data).map(
          ([key, value]) => `${key}: ${JSON.stringify(value)}`
        ),
        '---',
        '',
        content,
      ].join('\n');

      await fs.writeFile(path.join(goalsDir, `${name}.md`), frontmatter);
    },

    /**
     * Create a test plan file
     * @param {string} name - Plan name (without .md extension)
     * @param {Object} data - Frontmatter data
     * @param {string} content - Markdown content
     */
    createPlan: async (name, data = {}, content = '') => {
      const frontmatter = [
        '---',
        ...Object.entries(data).map(
          ([key, value]) => `${key}: ${JSON.stringify(value)}`
        ),
        '---',
        '',
        content,
      ].join('\n');

      await fs.writeFile(path.join(plansDir, `${name}.md`), frontmatter);
    },

    /**
     * Set the current goal
     * @param {string} goalName - Goal name to set as current
     */
    setCurrentGoal: async (goalName) => {
      await fs.writeFile(path.join(teamwerxDir, '.current-goal'), goalName);
    },

    /**
     * Clean up the test workspace
     */
    cleanup: async () => {
      try {
        process.chdir(originalCwd);
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (err) {
        // Ignore cleanup errors
      }
    },
  };
}

/**
 * Mock console methods for testing
 * @returns {Object} Console mock utilities
 */
function mockConsole() {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  const output = [];
  const errors = [];
  const warnings = [];

  console.log = (...args) => output.push(args.join(' '));
  console.error = (...args) => errors.push(args.join(' '));
  console.warn = (...args) => warnings.push(args.join(' '));

  return {
    output,
    errors,
    warnings,

    /**
     * Restore original console methods
     */
    restore: () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    },

    /**
     * Clear captured output
     */
    clear: () => {
      output.length = 0;
      errors.length = 0;
      warnings.length = 0;
    },
  };
}

/**
 * Mock process.exit for testing
 * @returns {Object} Process exit mock utilities
 */
function mockProcessExit() {
  const originalProcessExit = process.exit;
  let exitCode = null;

  process.exit = (code) => {
    exitCode = code;
    throw new Error('process.exit called');
  };

  return {
    getExitCode: () => exitCode,

    /**
     * Restore original process.exit
     */
    restore: () => {
      process.exit = originalProcessExit;
    },
  };
}

/**
 * Create a complete test environment with workspace and mocks
 * @param {string} prefix - Prefix for temp directory
 * @returns {Promise<Object>} Complete test environment
 */
async function createTestEnvironment(prefix = 'teamwerx-test') {
  const workspace = await createTestWorkspace(prefix);
  const consoleMock = mockConsole();
  const exitMock = mockProcessExit();

  workspace.cd();

  return {
    ...workspace,
    console: consoleMock,
    exit: exitMock,

    /**
     * Clean up everything
     */
    cleanup: async () => {
      consoleMock.restore();
      exitMock.restore();
      await workspace.cleanup();
    },
  };
}

module.exports = {
  createTestWorkspace,
  mockConsole,
  mockProcessExit,
  createTestEnvironment,
};
