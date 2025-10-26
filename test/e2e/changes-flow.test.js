/**
 * End-to-end smoke test for the changes propose → apply → archive workflow.
 *
 * This test performs a minimal end-to-end flow:
 *  - Initialize a temp repo and run `teamwerx init`
 *  - Create a simple goal file to attach the change to
 *  - Run `teamwerx propose "<title>" --goal <goal>`
 *  - Parse the created change ID from the propose output (robust)
 *  - Run `teamwerx changes apply <id> --dry-run --goal <goal>`
 *  - Run `teamwerx changes apply <id> --goal <goal> --yes`
 *  - Run `teamwerx changes archive <id> --goal <goal> --yes`
 *  - Verify the change was moved to `.teamwerx/archive/changes/`
 *
 * This test is intentionally permissive about CLI message text (asserts
 * presence of expected artifacts and best-effort matches in output) so minor
 * message changes won't break the smoke test.
 */

const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

describe("Changes workflow end-to-end smoke test", () => {
  let testDir;
  let originalCwd;
  let cliPath;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = path.join(os.tmpdir(), `teamwerx-e2e-changes-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);

    // Minimal git repo for the CLI (teamwerx expects a repository)
    await execAsync("git init");
    await execAsync('git config user.name "E2E Test"');
    await execAsync('git config user.email "e2e@example.com"');

    // CLI entry in the repository root
    cliPath = path.join(originalCwd, "bin", "teamwerx.js");

    // Ensure teamwerx init has been run (ignore if it's already initialized)
    try {
      await execAsync(`node ${cliPath} init`);
    } catch (err) {
      // ignore init failures if already initialized
    }
  }, 20000);

  afterAll(async () => {
    process.chdir(originalCwd);
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // ignore cleanup errors
    }
  });

  test(
    "propose → apply (dry-run) → apply → archive results in archived change",
    async () => {
      const goalSlug = "e2e-change-goal";
      const goalFile = path.join(testDir, ".teamwerx", "goals", `${goalSlug}.md`);

      // Create a simple goal file so propose --goal can reference it
      await fs.mkdir(path.dirname(goalFile), { recursive: true });
      const goalContent = `---
title: "E2E Change Goal"
created: "${new Date().toISOString().split("T")[0]}"
success_criteria:
  - "Support changes e2e flow"
---

E2E goal for change workflow tests.
`;
      await fs.writeFile(goalFile, goalContent, "utf8");

      // 1) Propose a change for the goal
      const changeTitle = "Add sample change for e2e test";
      const proposeCmd = `node ${cliPath} propose "${changeTitle}" --goal ${goalSlug}`;
      const { stdout: proposeStdout } = await execAsync(proposeCmd);

      // Try to extract the created ID from the CLI output (robust)
      // CLI prints a line like: "ID: 001-add-sample-change-for-e2e-test"
      const idMatch = proposeStdout.match(/ID:\s*(\S+)/i);
      let changeDirName = idMatch ? idMatch[1].trim() : null;

      // After proposing, ensure changes directory exists
      const changesDir = path.join(testDir, ".teamwerx", "changes");
      const changesDirExists = await fs
        .stat(changesDir)
        .then(() => true)
        .catch(() => false);
      expect(changesDirExists).toBe(true);

      // Read change directories (expect at least one)
      const changeEntries = await fs.readdir(changesDir).catch(() => []);
      expect(changeEntries.length).toBeGreaterThan(0);

      // If we couldn't parse the ID from the output, fallback to the first entry
      if (!changeDirName) {
        changeDirName = changeEntries[0];
      }
      expect(changeDirName).toBeTruthy();

      // Basic sanity-check: expect the directory name to start with a 3-digit prefix
      expect(/^\d{3}[-_].+/.test(changeDirName)).toBe(true);
      const changeId = changeDirName.split(/[-_]/)[0];

      // Sanity: propose output should mention the title or id/directory name
      expect(
        proposeStdout.includes(changeTitle) ||
          proposeStdout.includes(changeId) ||
          proposeStdout.includes(changeDirName)
      ).toBeTruthy();

      // 2) Dry-run apply (use the full change directory name parsed from propose)
      const dryRunCmd = `node ${cliPath} changes apply ${changeDirName} --goal ${goalSlug} --dry-run`;
      const { stdout: dryRunStdout } = await execAsync(dryRunCmd);
      // Dry-run output should at least mention 'dry' or echo the change id/title
      expect(
        /dry/i.test(dryRunStdout) ||
          dryRunStdout.includes(changeTitle) ||
          dryRunStdout.includes(changeId) ||
          dryRunStdout.includes(changeDirName)
      ).toBeTruthy();

      // 3) Real apply (confirm with --yes)
      const applyCmd = `node ${cliPath} changes apply ${changeDirName} --goal ${goalSlug} --yes`;
      const { stdout: applyStdout } = await execAsync(applyCmd);
      // Apply should indicate success or include the change id/title
      expect(
        /apply|applied|import/i.test(applyStdout) ||
          applyStdout.includes(changeTitle) ||
          applyStdout.includes(changeId) ||
          applyStdout.includes(changeDirName)
      ).toBeTruthy();

      // 4) Archive the change (use full changeDirName)
      const archiveCmd = `node ${cliPath} changes archive ${changeDirName} --goal ${goalSlug} --yes`;
      const { stdout: archiveStdout } = await execAsync(archiveCmd);
      expect(
        /archive|archiv/i.test(archiveStdout) ||
          archiveStdout.includes(changeTitle) ||
          archiveStdout.includes(changeId) ||
          archiveStdout.includes(changeDirName)
      ).toBeTruthy();

      // After archive, ensure the change was moved into .teamwerx/archive/changes/
      const archiveChangesDir = path.join(testDir, ".teamwerx", "archive", "changes");
      const archiveDirExists = await fs
        .stat(archiveChangesDir)
        .then(() => true)
        .catch(() => false);
      expect(archiveDirExists).toBe(true);

      const archivedEntries = await fs.readdir(archiveChangesDir).catch(() => []);
      // Expect the archived folder list to include the exact directory name we used
      const foundExact = archivedEntries.includes(changeDirName);
      expect(foundExact).toBe(true);
      // Also accept archived names that preserve numeric prefix
      const foundByPrefix = archivedEntries.some((n) => n.startsWith(`${changeId}-`));
      expect(foundByPrefix).toBe(true);
    },
    30000
  );
});
