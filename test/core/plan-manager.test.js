const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { PlanManager } = require("../../lib/core/plan-manager");

describe("PlanManager", () => {
  let testDir;
  let workspace;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = path.join(os.tmpdir(), `teamwerx-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Mock workspace object
    workspace = {
      slug: "test-goal",
      number: "001",
      title: "Test Goal",
      planPath: path.join(testDir, "plan.md"),
    };
  });

  afterEach(async () => {
    // Clean up the temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors during cleanup
    }
  });

  describe("constructor", () => {
    test("should initialize with workspace", () => {
      const manager = new PlanManager(workspace);
      expect(manager.workspace).toBe(workspace);
      expect(manager.planPath).toBe(workspace.planPath);
      expect(manager.tasks).toEqual([]);
      expect(manager.frontmatter).toEqual({});
    });
  });

  describe("load", () => {
    test("should initialize empty arrays when plan file does not exist", async () => {
      const manager = new PlanManager(workspace);
      await manager.load();

      expect(manager.tasks).toEqual([]);
      expect(manager.frontmatter).toEqual({});
    });

    test("should load tasks from existing plan file", async () => {
      const planContent = `---
goal: test-goal
goal_number: '001'
updated: '2025-10-25T00:00:00.000Z'
tasks:
  - id: T01
    title: First task
    status: pending
    notes: ''
    source: ''
    created: '2025-10-25T00:00:00.000Z'
    updated: '2025-10-25T00:00:00.000Z'
  - id: T02
    title: Second task
    status: completed
    notes: Done
    source: manual
    created: '2025-10-25T00:00:00.000Z'
    updated: '2025-10-25T01:00:00.000Z'
---

# Plan for Test Goal

| Task | Description | Status |
| --- | --- | --- |
| T01 | First task | pending |
| T02 | Second task | completed |
`;
      await fs.writeFile(workspace.planPath, planContent);

      const manager = new PlanManager(workspace);
      await manager.load();

      expect(manager.tasks).toHaveLength(2);
      expect(manager.tasks[0].id).toBe("T01");
      expect(manager.tasks[0].title).toBe("First task");
      expect(manager.tasks[1].id).toBe("T02");
      expect(manager.tasks[1].status).toBe("completed");
    });
  });

  describe("getNextTaskId", () => {
    test("should return T01 for empty task list", () => {
      const manager = new PlanManager(workspace);
      expect(manager.getNextTaskId()).toBe("T01");
    });

    test("should return next sequential ID", () => {
      const manager = new PlanManager(workspace);
      manager.tasks = [
        { id: "T01", title: "Task 1" },
        { id: "T02", title: "Task 2" },
      ];
      expect(manager.getNextTaskId()).toBe("T03");
    });

    test("should handle non-sequential task IDs", () => {
      const manager = new PlanManager(workspace);
      manager.tasks = [
        { id: "T01", title: "Task 1" },
        { id: "T05", title: "Task 5" },
        { id: "T03", title: "Task 3" },
      ];
      expect(manager.getNextTaskId()).toBe("T06");
    });

    test("should pad single digit numbers", () => {
      const manager = new PlanManager(workspace);
      manager.tasks = [{ id: "T05", title: "Task 5" }];
      expect(manager.getNextTaskId()).toBe("T06");
    });
  });

  describe("addTask", () => {
    test("should add a task with default values", () => {
      const manager = new PlanManager(workspace);
      const task = manager.addTask({ title: "New task" });

      expect(task.id).toBe("T01");
      expect(task.title).toBe("New task");
      expect(task.status).toBe("pending");
      expect(task.notes).toBe("");
      expect(task.source).toBe("");
      expect(task.created).toBeDefined();
      expect(task.updated).toBeDefined();
      expect(manager.tasks).toHaveLength(1);
    });

    test("should add a task with custom values", () => {
      const manager = new PlanManager(workspace);
      const task = manager.addTask({
        title: "Custom task",
        status: "in-progress",
        notes: "Some notes",
        source: "manual",
      });

      expect(task.status).toBe("in-progress");
      expect(task.notes).toBe("Some notes");
      expect(task.source).toBe("manual");
    });

    test("should add multiple tasks with sequential IDs", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task 1" });
      manager.addTask({ title: "Task 2" });
      manager.addTask({ title: "Task 3" });

      expect(manager.tasks).toHaveLength(3);
      expect(manager.tasks[0].id).toBe("T01");
      expect(manager.tasks[1].id).toBe("T02");
      expect(manager.tasks[2].id).toBe("T03");
    });
  });

  describe("updateTask", () => {
    test("should update an existing task", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Original task" });

      const updated = manager.updateTask("T01", {
        status: "in-progress",
        notes: "Updated notes",
      });

      expect(updated.status).toBe("in-progress");
      expect(updated.notes).toBe("Updated notes");
      expect(updated.title).toBe("Original task");
      expect(updated.updated).toBeDefined();
    });

    test("should throw error for non-existent task", () => {
      const manager = new PlanManager(workspace);

      expect(() => {
        manager.updateTask("T99", { status: "completed" });
      }).toThrow("Task T99 not found in plan.");
    });
  });

  describe("completeTask", () => {
    test("should mark a task as completed", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task to complete" });

      const completed = manager.completeTask("T01");

      expect(completed.status).toBe("completed");
    });

    test("should complete task with notes and source", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task to complete" });

      const completed = manager.completeTask("T01", "Finished!", "manual");

      expect(completed.status).toBe("completed");
      expect(completed.notes).toBe("Finished!");
      expect(completed.source).toBe("manual");
    });
  });

  describe("getPendingTasks", () => {
    test("should return pending and in-progress tasks", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task 1", status: "pending" });
      manager.addTask({ title: "Task 2", status: "in-progress" });
      manager.addTask({ title: "Task 3", status: "completed" });
      manager.addTask({ title: "Task 4", status: "pending" });

      const pending = manager.getPendingTasks();

      expect(pending).toHaveLength(3);
      expect(pending[0].title).toBe("Task 1");
      expect(pending[1].title).toBe("Task 2");
      expect(pending[2].title).toBe("Task 4");
    });

    test("should respect limit parameter", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task 1", status: "pending" });
      manager.addTask({ title: "Task 2", status: "pending" });
      manager.addTask({ title: "Task 3", status: "pending" });

      const pending = manager.getPendingTasks(2);

      expect(pending).toHaveLength(2);
    });

    test("should return empty array when no pending tasks", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task 1", status: "completed" });

      const pending = manager.getPendingTasks();

      expect(pending).toEqual([]);
    });
  });

  describe("generateTable", () => {
    test("should generate markdown table", () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task 1", status: "pending" });
      manager.addTask({ title: "Task 2", status: "completed" });

      const table = manager.generateTable();

      expect(table).toContain("| Task | Description | Status |");
      expect(table).toContain("| --- | --- | --- |");
      expect(table).toContain("| T01 | Task 1 | pending |");
      expect(table).toContain("| T02 | Task 2 | completed |");
    });

    test("should handle empty task list", () => {
      const manager = new PlanManager(workspace);
      const table = manager.generateTable();

      expect(table).toContain("| Task | Description | Status |");
      expect(table).toContain("| --- | --- | --- |");
    });
  });

  describe("save", () => {
    test("should save plan to file", async () => {
      const manager = new PlanManager(workspace);
      manager.addTask({ title: "Task 1", status: "pending" });
      manager.addTask({ title: "Task 2", status: "completed" });

      await manager.save();

      const content = await fs.readFile(workspace.planPath, "utf8");
      expect(content).toContain("goal: test-goal");
      expect(content).toContain("goal_number: '001'");
      expect(content).toContain("# Plan for Test Goal");
      expect(content).toContain("| T01 | Task 1 | pending |");
      expect(content).toContain("| T02 | Task 2 | completed |");
    });
  });
});
