const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { ensureDir, getTeamwerxDir } = require('../utils/file');

class ResearchSessionManager {
  constructor(goalName, { cwd = process.cwd() } = {}) {
    this.goalName = goalName;
    this.cwd = cwd;
    this.teamwerxDir = getTeamwerxDir();
  }

  formatSessionId(date = new Date()) {
    return date.toISOString().replace(/[:.]/g, '-');
  }

  async createSession() {
    this.sessionId = this.formatSessionId();
    this.sessionDir = path.join(this.teamwerxDir, 'research', this.goalName, `session-${this.sessionId}`);
    this.inputsDir = path.join(this.sessionDir, 'inputs');
    await ensureDir(this.inputsDir);
    return {
      sessionId: this.sessionId,
      sessionDir: this.sessionDir,
      inputsDir: this.inputsDir,
    };
  }

  async saveNotes(notes = []) {
    const timestamp = new Date().toISOString();
    const saved = [];
    let index = 1;

    for (const note of notes) {
      if (!note || !note.trim()) continue;
      const filename = `note-${this.sessionId}-${index}.md`;
      const content = `---\ntype: note\ncreated: ${timestamp}\n---\n\n${note.trim()}\n`;
      await fs.writeFile(path.join(this.inputsDir, filename), content, 'utf8');
      saved.push(filename);
      index += 1;
    }

    return saved;
  }

  async saveFiles(files = []) {
    const saved = [];

    for (const filePath of files) {
      if (!filePath) continue;
      const absolutePath = path.resolve(this.cwd, filePath);
      try {
        const stats = await fs.stat(absolutePath);
        if (!stats.isFile()) {
          console.warn(chalk.yellow(`⚠ Skipping attachment (not a file): ${filePath}`));
          continue;
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠ Unable to attach file "${filePath}": ${(error && error.message) || error}`));
        continue;
      }

      const filename = `file-${this.sessionId}-${path.basename(absolutePath)}`;
      await fs.copyFile(absolutePath, path.join(this.inputsDir, filename));
      saved.push(filename);
    }

    return saved;
  }

  async saveUrls(urls = []) {
    if (!urls.length) {
      return [];
    }

    const filename = `urls-${this.sessionId}.md`;
    const timestamp = new Date().toISOString();
    const body = urls.map((url) => `- ${url}`).join('\n');
    const content = `---\ntype: url-list\ncreated: ${timestamp}\n---\n\n${body}\n`;
    await fs.writeFile(path.join(this.inputsDir, filename), content, 'utf8');
    return [filename];
  }

  async captureSupplementalInputs(options = {}) {
    const normalize = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    const notes = await this.saveNotes(normalize(options.note));
    const files = await this.saveFiles(normalize(options.file));
    const urls = await this.saveUrls(normalize(options.url));

    return { notes, files, urls };
  }
}

module.exports = {
  ResearchSessionManager,
};
