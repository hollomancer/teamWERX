const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const use = require("../../lib/commands/use");
const { getCurrentGoal } = require("../../lib/utils/file");

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalProcessExit = process.exit;
const originalCwd = process.cwd;

describe("Use Command", () => {
  let testDir;
  let originalDir;
  let consoleOutput;
  let consoleErrorOutput;
  let exitCode;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = path.join(os.tmpdir(), `teamwerx-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Create .teamwerx structure
    const teamwerxDir = path.join(testDir, ".teamwerx");
    const goalsDir = path.join(teamwerxDir, "goals");
    await fs.mkdir(goalsDir, { recursive: true });

    // Create a test goal file
    const goalContent = `---
title: Test Goal
created: 2025-10-25
success_criteria:
  - Complete feature implementation
---

This is a test goal.`;
    await fs.writeFile(path.join(goalsDir, "test-goal.md"), goalContent);

    // Save original directory and change to test directory
    originalDir = process.cwd();
    process.chdir(testDir);

    // Mock console and process
    consoleOutput = [];
    consoleErrorOutput = [];
    exitCode = null;

    console.log = (...args) => consoleOutput.push(args.join(" "));
    console.error = (...args) => consoleErrorOutput.push(args.join(" "));
    process.exit = (code) => {
      exitCode = code;
      throw new Error("process.exit");
    };
  });

  afterEach(async () => {
    // Restore mocks
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    process.cwd = originalCwd;

    // Change back to original directory
    if (originalDir) {
      process.chdir(originalDir);
    }

    // Clean up the temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors during cleanup
    }
  });

  test("should set current goal when goal exists", async () => {
    await use("test-goal");

    const currentGoal = await getCurrentGoal();
    expect(currentGoal).toBe("test-goal");
    expect(
      consoleOutput.some((output) => output.includes("Current goal set to"))
    ).toBe(true);
  });

  test("should error when goal does not exist", async () => {
    try {
      await use("nonexistent-goal");
    } catch (err) {
      // Expected to throw due to process.exit
    }

    expect(exitCode).toBe(3);
    expect(
      consoleErrorOutput.some((output) => output.includes("not found"))
    ).toBe(true);
  });
});
