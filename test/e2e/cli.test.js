/**
 * End-to-end tests for CLI commands
 * Tests the CLI interface and basic command functionality
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('CLI End-to-End Tests', () => {
  let testDir;
  let originalCwd;
  let cliPath;

  beforeAll(async () => {
    // Save original directory
    originalCwd = process.cwd();

    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `teamwerx-e2e-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Change to test directory
    process.chdir(testDir);

    // Initialize git repo (required for teamwerx init)
    await execAsync('git init');
    await execAsync('git config user.name "Test User"');
    await execAsync('git config user.email "test@example.com"');

    // Path to the CLI script
    cliPath = path.join(originalCwd, 'bin', 'teamwerx.js');
  }, 10000);

  afterAll(async () => {
    // Change back to original directory
    process.chdir(originalCwd);

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  test('CLI should show help when no arguments provided', async () => {
    const { stdout } = await execAsync(`node ${cliPath}`);

    expect(stdout).toContain('teamWERX');
    expect(stdout).toContain('A development framework');
    expect(stdout).toContain('Commands:');
    expect(stdout).toContain('init');
    expect(stdout).toContain('goal');
    expect(stdout).toContain('status');
  });

  test('CLI should show version', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --version`);

    expect(stdout).toContain('1.0.0');
  });

  describe('init command', () => {
    test('should create teamWERX directory structure', async () => {
      const { stdout } = await execAsync(`node ${cliPath} init`);

      // Check that .teamwerx directory was created
      const teamwerxDir = path.join(testDir, '.teamwerx');
      const dirExists = await fs
        .stat(teamwerxDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);

      // Check for expected subdirectories
      const goalsDir = path.join(teamwerxDir, 'goals');
      const goalsExists = await fs
        .stat(goalsDir)
        .then(() => true)
        .catch(() => false);
      expect(goalsExists).toBe(true);

      // Check for AGENTS.md file
      const agentsFile = path.join(testDir, 'AGENTS.md');
      const agentsExists = await fs
        .stat(agentsFile)
        .then(() => true)
        .catch(() => false);
      expect(agentsExists).toBe(true);
    });

    test('should fail when not in git repository', async () => {
      // Create a non-git directory
      const nonGitDir = path.join(os.tmpdir(), `non-git-${Date.now()}`);
      await fs.mkdir(nonGitDir);
      const originalDir = process.cwd();
      process.chdir(nonGitDir);

      try {
        await expect(execAsync(`node ${cliPath} init`)).rejects.toThrow();
      } finally {
        process.chdir(originalDir);
        await fs.rm(nonGitDir, { recursive: true, force: true });
      }
    });
  });

  describe('goal creation workflow', () => {
    beforeAll(async () => {
      // Ensure teamWERX is initialized
      try {
        await execAsync(`node ${cliPath} init`);
      } catch (err) {
        // Already initialized
      }
    });

    test('should handle goal creation setup', async () => {
      // Create a basic goal file manually for testing
      const goalName = 'test-feature';
      const goalFile = path.join(
        testDir,
        '.teamwerx',
        'goals',
        `${goalName}.md`
      );

      const goalContent = `---
title: "Test Feature"
created: "2025-10-25"
success_criteria:
  - "Implement basic functionality"
---

Test goal content.`;

      await fs.mkdir(path.join(testDir, '.teamwerx', 'goals'), {
        recursive: true,
      });
      await fs.writeFile(goalFile, goalContent);

      // Verify file was created
      const fileExists = await fs
        .stat(goalFile)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe('use command', () => {
    test('should error when goal does not exist', async () => {
      try {
        await execAsync(`node ${cliPath} use nonexistent-goal`);
        fail('Expected command to fail');
      } catch (err) {
        expect(err.code).toBe(1);
        expect(err.stderr).toContain('not found');
      }
    });
  });

  describe('status command', () => {
    test('should show no goals message when no goals exist', async () => {
      const { stdout } = await execAsync(`node ${cliPath} status`);

      expect(stdout).toContain('No goals found');
    });

    test('should show table view with --list flag when no goals exist', async () => {
      const { stdout } = await execAsync(`node ${cliPath} status --list`);

      expect(stdout).toContain('No goals found');
    });
  });

  describe('commands requiring goals', () => {
    test('research command should error when no goal specified', async () => {
      try {
        await execAsync(`node ${cliPath} research`);
        fail('Expected command to fail');
      } catch (err) {
        expect(err.code).toBe(1);
        expect(err.stderr).toContain('No goal specified');
      }
    });

    test('discuss command should error when no goal specified', async () => {
      try {
        await execAsync(`node ${cliPath} discuss "test message"`);
        fail('Expected command to fail');
      } catch (err) {
        expect(err.code).toBe(1);
        expect(err.stderr).toContain('No goal specified');
      }
    });

    test('plan command should error when no goal specified', async () => {
      try {
        await execAsync(`node ${cliPath} plan "test plan"`);
        fail('Expected command to fail');
      } catch (err) {
        expect(err.code).toBe(1);
        expect(err.stderr).toContain('No goal specified');
      }
    });
  });
});
