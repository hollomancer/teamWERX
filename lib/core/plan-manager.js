const {
  readFileWithFrontmatter,
  writeFileWithFrontmatter,
  fileExists,
} = require('../utils/file');

class PlanManager {
  constructor(workspace) {
    this.workspace = workspace;
    this.planPath = workspace.planPath;
    this.tasks = [];
    this.frontmatter = {};
  }

  async load() {
    if (await fileExists(this.planPath)) {
      const parsed = await readFileWithFrontmatter(this.planPath);
      this.frontmatter = parsed.data || {};
      this.tasks = Array.isArray(this.frontmatter.tasks)
        ? this.frontmatter.tasks
        : [];
    } else {
      this.frontmatter = {};
      this.tasks = [];
    }
    return this;
  }

  getNextTaskId() {
    const existingNumbers = this.tasks
      .map((task) => task.id)
      .filter(Boolean)
      .map((id) => parseInt(id.replace(/^T/i, ''), 10))
      .filter((n) => !Number.isNaN(n));
    const nextNumber = existingNumbers.length
      ? Math.max(...existingNumbers) + 1
      : 1;
    return `T${String(nextNumber).padStart(2, '0')}`;
  }

  addTask({ title, status = 'pending', notes = '', source = '' }) {
    const id = this.getNextTaskId();
    const task = {
      id,
      title,
      status,
      notes,
      source,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    this.tasks.push(task);
    return task;
  }

  updateTask(taskId, updates = {}) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found in plan.`);
    }
    Object.assign(task, updates, { updated: new Date().toISOString() });
    return task;
  }

  completeTask(taskId, notes = '', source = '') {
    return this.updateTask(taskId, {
      status: 'completed',
      notes: notes || undefined,
      source: source || undefined,
    });
  }

  getPendingTasks(limit = Infinity) {
    return this.tasks
      .filter(
        (task) => task.status === 'pending' || task.status === 'in-progress'
      )
      .slice(0, limit);
  }

  generateTable() {
    const rows = [
      '| Task | Description | Status |',
      '| --- | --- | --- |',
      ...this.tasks.map(
        (task) => `| ${task.id} | ${task.title} | ${task.status} |`
      ),
    ];
    return rows.join('\n');
  }

  async save() {
    const data = {
      goal: this.workspace.slug,
      goal_number: this.workspace.number,
      updated: new Date().toISOString(),
      tasks: this.tasks,
    };

    const content = `# Plan for ${this.workspace.title}

${this.generateTable()}
`;

    await writeFileWithFrontmatter(this.planPath, data, content);
  }
}

module.exports = {
  PlanManager,
};
