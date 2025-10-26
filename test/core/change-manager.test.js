const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const { ChangeManager } = require('../../lib/core/change-manager');
const { readFileWithFrontmatter } = require('../../lib/utils/file');

const TMP_PREFIX = `teamwerx-change-manager-test-`;

describe('ChangeManager (core)', () => {
  let tmpDir;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    tmpDir = path.join(os.tmpdir(), `${TMP_PREFIX}${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    process.chdir(tmpDir);
  });

  afterAll(async () => {
    try {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      // ignore cleanup errors
    }
  });

  test('createChange scaffolds proposal, tasks, spec, and status', async () => {
    const cm = new ChangeManager();

    const res = await cm.createChange('Add profile filters', {
      goal: 'test-goal',
      author: 'tester@example.com',
    });

    expect(res).toBeDefined();
    expect(res.id).toMatch(/^\d{3}-add-profile-filters$/);

    const changeDir = path.join('.teamwerx', 'changes', res.id);
    const proposalPath = path.join(changeDir, 'proposal.md');
    const tasksPath = path.join(changeDir, 'tasks.md');
    const specPath = path.join(changeDir, 'spec-delta.md');
    const statusPath = path.join(changeDir, 'status.json');

    // Ensure files exist
    const statProposal = await fs.stat(proposalPath).then(() => true).catch(() => false);
    const statTasks = await fs.stat(tasksPath).then(() => true).catch(() => false);
    const statSpec = await fs.stat(specPath).then(() => true).catch(() => false);
    const statStatus = await fs.stat(statusPath).then(() => true).catch(() => false);

    expect(statProposal).toBe(true);
    expect(statTasks).toBe(true);
    expect(statSpec).toBe(true);
    expect(statStatus).toBe(true);

    // Read proposal frontmatter
    const proposal = await readFileWithFrontmatter(proposalPath);
    expect(proposal.data).toBeDefined();
    expect(proposal.data.title).toBe('Add profile filters');

    // Status should be draft
    const statusRaw = await fs.readFile(statusPath, 'utf8');
    const status = JSON.parse(statusRaw);
    expect(status.status).toBe('draft');
  }, 20000);

  test('applyChange imports tasks into plan and creates implementation stub', async () => {
    const cm = new ChangeManager();

    // Create a change to apply
    const res = await cm.createChange('Implement X feature', {
      goal: 'alpha-goal',
      author: 'tester',
    });

    const changeDir = path.join('.teamwerx', 'changes', res.id);

    // Create the corresponding goal file so GoalWorkspaceManager can create workspace
    const goalsDir = path.join('.teamwerx', 'goals');
    await fs.mkdir(goalsDir, { recursive: true });
    const goalFilePath = path.join(goalsDir, 'alpha-goal.md');
    const goalContent = `---
title: "Alpha Goal"
created: "${new Date().toISOString()}"
---
Alpha goal description.
`;
    await fs.writeFile(goalFilePath, goalContent, 'utf8');

    // Ensure tasks.md contains at least one checklist (createChange already does)
    const tasksFile = path.join(changeDir, 'tasks.md');
    const tasksExists = await fs.stat(tasksFile).then(() => true).catch(() => false);
    expect(tasksExists).toBe(true);

    // Apply the change to the goal (should create workspace, plan, and implementation stub)
    const result = await cm.applyChange(res.id, { goal: 'alpha-goal', createImplementations: true });
    expect(result).toBeDefined();
    expect(result.applied).toBe(true);
    expect(Array.isArray(result.addedTasks)).toBe(true);
    expect(result.addedTasks.length).toBeGreaterThan(0);

    // The workspace will be created as .teamwerx/goals/001-alpha-goal
    const workspaceDir = path.join('.teamwerx', 'goals', '001-alpha-goal');
    const planPath = path.join(workspaceDir, 'plan.md');
    const implDir = path.join(workspaceDir, 'implementation');

    const planExists = await fs.stat(planPath).then(() => true).catch(() => false);
    expect(planExists).toBe(true);

    const planContent = await fs.readFile(planPath, 'utf8');
    // Plan should include at least one Txx entry added by PlanManager
    expect(planContent).toMatch(/T0?\d+/);

    // Check that implementation stub(s) exist
    const added = result.addedTasks;
    for (const taskId of added) {
      const implPath = path.join(implDir, `${taskId}.md`);
      const implExists = await fs.stat(implPath).then(() => true).catch(() => false);
      expect(implExists).toBe(true);

      const implContent = await fs.readFile(implPath, 'utf8');
      expect(implContent).toContain(`Implementation Record (${taskId})`);
    }

    // Change status updated to applied
    const statusPath = path.join(changeDir, 'status.json');
    const statusRaw = await fs.readFile(statusPath, 'utf8');
    const status = JSON.parse(statusRaw);
    expect(status.status).toBe('applied');
    expect(status.tasks_added).toBeDefined();
    expect(Array.isArray(status.tasks_added)).toBe(true);
  }, 30000);
});
