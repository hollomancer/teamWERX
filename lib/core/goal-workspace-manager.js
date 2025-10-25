const fs = require('fs').promises;
const path = require('path');
const {
  getTeamwerxDir,
  ensureDir,
  fileExists,
  readFileWithFrontmatter,
  writeFileWithFrontmatter,
  toKebabCase,
} = require('../utils/file');

const REGISTRY_FILE = path.join(getTeamwerxDir(), 'goals', 'registry.json');

async function readGoalTitle(slug) {
  const goalPath = path.join(getTeamwerxDir(), 'goals', `${slug}.md`);
  if (!(await fileExists(goalPath))) {
    throw new Error(`Goal "${slug}" does not exist. Create it first with "teamwerx goal".`);
  }
  const parsed = await readFileWithFrontmatter(goalPath);
  return parsed.data.title || slug;
}

async function loadRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {
      nextNumber: 1,
      goals: {},
    };
  }
}

async function saveRegistry(registry) {
  await ensureDir(path.dirname(REGISTRY_FILE));
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf8');
}

class GoalWorkspace {
  constructor(meta) {
    this.meta = meta;
    this.rootDir = path.join(
      getTeamwerxDir(),
      'goals',
      `${meta.number}-${meta.slug}`
    );
  }

  get slug() {
    return this.meta.slug;
  }

  get number() {
    return this.meta.number;
  }

  get title() {
    return this.meta.title;
  }

  get discussPath() {
    return path.join(this.rootDir, 'discuss.md');
  }

  get planPath() {
    return path.join(this.rootDir, 'plan.md');
  }

  get researchPath() {
    return path.join(this.rootDir, 'research.md');
  }

  get implementationDir() {
    return path.join(this.rootDir, 'implementation');
  }

  async ensureStructure() {
    await ensureDir(this.rootDir);
    await ensureDir(this.implementationDir);
    await this.ensureDiscussFile();
    await this.ensurePlanFile();
    await this.ensureResearchFile();
  }

  async ensureDiscussFile() {
    if (await fileExists(this.discussPath)) {
      return;
    }

    const frontmatter = {
      goal: this.slug,
      goal_number: this.number,
      entries: [],
      updated: new Date().toISOString(),
    };

    const content = `# Discussion Log for ${this.title}

> Use \`teamwerx discuss "<message>"\` to append entries.

## Validation Checklist

Before moving to planning phase:
- [ ] Decision aligns with project charter/constraints
- [ ] Dependencies identified and documented
- [ ] Technical feasibility confirmed
- [ ] Edge cases and risks discussed
- [ ] Success criteria are clear and measurable
`;

    await writeFileWithFrontmatter(this.discussPath, frontmatter, content);
  }

  async ensurePlanFile() {
    if (await fileExists(this.planPath)) {
      return;
    }

    const frontmatter = {
      goal: this.slug,
      goal_number: this.number,
      updated: new Date().toISOString(),
      tasks: [],
    };

    const content = `# Plan for ${this.title}

|| Task | Description | Status |
|| --- | --- | --- |

## Plan Validation

Before execution:
- [ ] All tasks are independently executable
- [ ] Task order respects dependencies
- [ ] Each task has clear acceptance criteria
- [ ] Resource requirements identified
- [ ] Risks and mitigation strategies documented
`;

    await writeFileWithFrontmatter(this.planPath, frontmatter, content);
  }

  async ensureResearchFile() {
    if (await fileExists(this.researchPath)) {
      return;
    }

    const frontmatter = {
      goal: this.slug,
      goal_number: this.number,
      updated: new Date().toISOString(),
    };

    const content = `# Research Report for ${this.title}

_Use "teamwerx research" to update this report with project findings._

## Technology Stack
<!-- Programming languages, frameworks, libraries, tools used -->

## Code Style & Architecture
<!-- Code organization, naming conventions, patterns, architectural style -->

## Directory Structure
<!--
Relevant folders and files for this goal
Example:
\`\`\`
src/
├── components/
│   └── UserAuth.js
├── services/
│   └── authService.js
\`\`\`
-->

## Business Context
<!-- Domain concepts, user workflows, business rules relevant to this goal -->

## Data Flow
<!-- How data moves through the system for this feature/goal -->

## Integration Points
<!-- External services, APIs, third-party dependencies -->

## Research Validation
- [ ] Tech stack accurately documented
- [ ] Business context clearly understood
- [ ] Data flow mapped completely
- [ ] Integration dependencies identified
`;

    await writeFileWithFrontmatter(this.researchPath, frontmatter, content);
  }
}

class GoalWorkspaceManager {
  static async getRegistry() {
    return loadRegistry();
  }

  static async getWorkspaceMeta(slug) {
    const registry = await loadRegistry();
    return registry.goals[slug] || null;
  }

  static async listWorkspaces() {
    const registry = await loadRegistry();
    return Object.values(registry.goals).sort((a, b) =>
      a.number.localeCompare(b.number)
    );
  }

  static async ensureWorkspace(slug) {
    let meta = await this.getWorkspaceMeta(slug);
    if (!meta) {
      const title = await readGoalTitle(slug);
      meta = await this.registerWorkspace(slug, title);
    }
    const workspace = new GoalWorkspace(meta);
    await workspace.ensureStructure();
    return workspace;
  }

  static async registerWorkspace(slugInput, title) {
    const slug = toKebabCase(slugInput);
    const registry = await loadRegistry();
    if (registry.goals[slug]) {
      return registry.goals[slug];
    }
    const number = String(registry.nextNumber).padStart(3, '0');
    registry.nextNumber += 1;
    registry.goals[slug] = {
      slug,
      number,
      title: title || slug,
      created: new Date().toISOString(),
    };
    await saveRegistry(registry);
    return registry.goals[slug];
  }

  static async getWorkspace(slug) {
    const meta = await this.getWorkspaceMeta(slug);
    if (!meta) {
      throw new Error(
        `Goal "${slug}" does not have a workspace yet. Run "teamwerx goal" to create a goal with workspace.`
      );
    }
    const workspace = new GoalWorkspace(meta);
    await workspace.ensureStructure();
    return workspace;
  }

  static async getWorkspaceForGoal(slug) {
    try {
      return await this.getWorkspace(slug);
    } catch {
      return this.ensureWorkspace(slug);
    }
  }
}

module.exports = {
  GoalWorkspace,
  GoalWorkspaceManager,
};
