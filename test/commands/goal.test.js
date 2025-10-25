const goal = require('../../lib/commands/goal');
const { createTestEnvironment } = require('../utils/test-helpers');

describe('Goal Command', () => {
  let env;

  beforeEach(async () => {
    env = await createTestEnvironment('goal-test');
  });

  afterEach(async () => {
    await env.cleanup();
  });

  test('should create a goal with provided description', async () => {
    // Mock inquirer to avoid interactive prompts
    const inquirer = require('inquirer');
    const originalPrompt = inquirer.prompt;
    inquirer.prompt = jest.fn().mockResolvedValue({ criterion: '' });

    try {
      const result = await goal('Test goal description');

      expect(result.slug).toBe('test-goal-description');
      expect(result.title).toBe('Test goal description');
      expect(result.successCriteria).toEqual(['P1: Test goal description']);

      // Check that goal file was created
      const fs = require('fs').promises;
      const path = require('path');
      const goalPath = path.join(env.goalsDir, 'test-goal-description.md');
      const exists = await fs
        .access(goalPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      // Check console output
      expect(
        env.console.output.some((output) =>
          output.includes('Goal created successfully')
        )
      ).toBe(true);
    } finally {
      inquirer.prompt = originalPrompt;
    }
  });

  test('should prompt for description when none provided', async () => {
    // Mock inquirer for both title and criteria prompts
    const inquirer = require('inquirer');
    const originalPrompt = inquirer.prompt;
    inquirer.prompt = jest
      .fn()
      .mockResolvedValueOnce({ title: 'Interactive Goal' })
      .mockResolvedValue({ criterion: '' });

    try {
      const result = await goal();

      expect(result.slug).toBe('interactive-goal');
      expect(result.title).toBe('Interactive Goal');
      expect(
        env.console.output.some((output) =>
          output.includes('Goal created successfully')
        )
      ).toBe(true);
    } finally {
      inquirer.prompt = originalPrompt;
    }
  });

  test('should require at least one success criterion', async () => {
    // Mock inquirer to provide empty criteria
    const inquirer = require('inquirer');
    const originalPrompt = inquirer.prompt;
    inquirer.prompt = jest
      .fn()
      .mockResolvedValueOnce({ title: 'Test Goal' })
      .mockResolvedValue({ criterion: '' });

    try {
      await goal();
    } catch (err) {
      // Should throw due to validation
    }

    expect(env.exit.getExitCode()).toBe(1);
    expect(
      env.console.errors.some((error) =>
        error.includes('success criterion is required')
      )
    ).toBe(true);

    inquirer.prompt = originalPrompt;
  });

  test('should error when teamWERX is not initialized', async () => {
    // Change to a directory without .teamwerx
    const originalCwd = process.cwd();
    const fs = require('fs').promises;
    const os = require('os');
    const tempDir = require('path').join(
      os.tmpdir(),
      `no-teamwerx-${Date.now()}`
    );
    await fs.mkdir(tempDir);
    process.chdir(tempDir);

    try {
      await goal('Test goal');
    } catch (err) {
      // Expected to throw due to process.exit
    }

    expect(env.exit.getExitCode()).toBe(1);
    expect(
      env.console.errors.some((error) => error.includes('not initialized'))
    ).toBe(true);

    // Cleanup
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
