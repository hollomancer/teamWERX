const fs = require("fs").promises;
const path = require("path");
const { ensureDir, fileExists } = require("../utils/file");

class ProjectContext {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.teamwerxPath = path.join(this.rootPath, ".teamwerx");
  }

  getPath(...segments) {
    return path.join(this.rootPath, ...segments);
  }

  getTeamwerxPath(...segments) {
    return path.join(this.teamwerxPath, ...segments);
  }

  async ensureStructure() {
    const directories = [
      "",
      "goals",
      "research",
      "plans",
      "proposals",
      "specify",
      "archive",
      path.join("archive", "goals"),
      path.join("archive", "research"),
      path.join("archive", "plans"),
      path.join("archive", "proposals"),
    ];

    await Promise.all(
      directories.map((dir) => ensureDir(this.getTeamwerxPath(dir)))
    );
  }

  async writeRootFile(filename, content, { overwrite = false } = {}) {
    const filePath = this.getPath(filename);
    const existed = await fileExists(filePath);
    if (!overwrite && existed) {
      return "skipped";
    }
    await fs.writeFile(filePath, content, "utf8");
    return existed ? "updated" : "created";
  }
}

module.exports = {
  ProjectContext,
};
