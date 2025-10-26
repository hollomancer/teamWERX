const path = require("path");
const { ensureDir, writeFileWithFrontmatter } = require("../utils/file");

class ImplementationManager {
  constructor(workspace) {
    this.workspace = workspace;
  }

  getRecordPath(taskId) {
    return path.join(this.workspace.implementationDir, `${taskId}.md`);
  }

  async createRecord(taskId, { title, summary, details, sources = [] }) {
    await ensureDir(this.workspace.implementationDir);
    const data = {
      goal: this.workspace.slug,
      goal_number: this.workspace.number,
      task: taskId,
      created: new Date().toISOString(),
      sources,
    };

    const content = `# Implementation Record (${taskId})

## Title
${title}

## Summary
${summary || "_No summary provided._"}

## Details
${details || "_No additional details recorded._"}
`;

    await writeFileWithFrontmatter(this.getRecordPath(taskId), data, content);
  }
}

module.exports = {
  ImplementationManager,
};
