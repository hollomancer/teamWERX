const {
  readFileWithFrontmatter,
  writeFileWithFrontmatter,
  fileExists,
} = require('../utils/file');

class DiscussionManager {
  constructor(workspace) {
    this.workspace = workspace;
    this.discussPath = workspace.discussPath;
    this.entries = [];
    this.frontmatter = {};
  }

  async load() {
    if (await fileExists(this.discussPath)) {
      const parsed = await readFileWithFrontmatter(this.discussPath);
      this.frontmatter = parsed.data || {};
      this.entries = Array.isArray(this.frontmatter.entries)
        ? this.frontmatter.entries
        : [];
    } else {
      this.frontmatter = {};
      this.entries = [];
    }
    return this;
  }

  nextEntryId(prefix = 'D') {
    const numbers = this.entries
      .filter((entry) => typeof entry.id === 'string')
      .map((entry) => parseInt(entry.id.replace(/^D/i, ''), 10))
      .filter((n) => !Number.isNaN(n));
    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
    return `${prefix}${String(nextNumber).padStart(2, '0')}`;
  }

  addEntry({ type, content, metadata = {} }) {
    const id = this.nextEntryId();
    const entry = {
      id,
      type,
      content,
      metadata,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  buildBody() {
    const sections = [`# Discussion Log for ${this.workspace.title}`];
    for (const entry of this.entries) {
      sections.push(
        `## ${entry.id} · ${new Date(entry.timestamp).toLocaleString()}`,
        `**Type:** ${entry.type}`,
        '',
        `${entry.content}`,
        ''
      );
    }
    return sections.join('\n');
  }

  async save() {
    const data = {
      goal: this.workspace.slug,
      goal_number: this.workspace.number,
      updated: new Date().toISOString(),
      entries: this.entries,
    };
    await writeFileWithFrontmatter(this.discussPath, data, this.buildBody());
  }
}

module.exports = {
  DiscussionManager,
};
