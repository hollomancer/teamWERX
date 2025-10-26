const research = require("../../lib/commands/research");
const { createTestEnvironment } = require("../utils/test-helpers");

describe("Research Command", () => {
  let env;

  beforeEach(async () => {
    env = await createTestEnvironment("research-test");
  });

  afterEach(async () => {
    await env.cleanup();
  });

  test("should generate research report for current goal", async () => {
    // Create a test goal and set it as current
    await env.createGoal("test-goal", {
      title: "Test Goal",
      created: "2025-10-25",
    });
    await env.setCurrentGoal("test-goal");

    await research();

    // Check that research file was created
    const fs = require("fs").promises;
    const path = require("path");
    const researchPath = path.join(
      env.workspacesDir,
      "001-test-goal",
      "research.md"
    );
    const exists = await fs
      .access(researchPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);

    // Check console output
    expect(
      env.console.output.some((output) =>
        output.includes("Research report updated")
      )
    ).toBe(true);
  });

  test("should generate research report for specified goal", async () => {
    // Create a test goal
    await env.createGoal("specific-goal", {
      title: "Specific Goal",
      created: "2025-10-25",
    });

    await research("specific-goal");

    // Check that research file was created
    const fs = require("fs").promises;
    const path = require("path");
    const researchPath = path.join(
      env.workspacesDir,
      "001-specific-goal",
      "research.md"
    );
    const exists = await fs
      .access(researchPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  test("should error when no goal specified and no current goal", async () => {
    try {
      await research();
    } catch (err) {
      // Expected to throw due to process.exit
    }

    // Validation errors now use the standardized validation exit code.
    expect(env.exit.getExitCode()).toBe(5);
    expect(
      env.console.errors.some((error) => error.includes("No goal specified"))
    ).toBe(true);
  });

  test("should update existing research report", async () => {
    // Create a test goal and set it as current
    await env.createGoal("test-goal", {
      title: "Test Goal",
      created: "2025-10-25",
    });
    await env.setCurrentGoal("test-goal");

    // Run research once
    await research();

    // Clear console output
    env.console.clear();

    // Run research again - should update existing file
    await research();

    // Check that it still works (no errors)
    expect(
      env.console.output.some((output) =>
        output.includes("Research report updated")
      )
    ).toBe(true);
  });
});
