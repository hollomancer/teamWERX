const path = require('path');
const chalk = require('chalk');
const {
  detectTechnologyStack,
  listTopLevelDirs,
  detectLanguages,
} = require('../core/project-insights');
const {
  getTeamwerxDir,
  ensureDir,
  fileExists,
  writeFileWithFrontmatter,
  readFileWithFrontmatter,
} = require('../utils/file');

async function charter() {
  const stack = await detectTechnologyStack(process.cwd());
  const dirs = await listTopLevelDirs(process.cwd());
  const languages = await detectLanguages(process.cwd());

  const goalsDir = path.join(getTeamwerxDir(), 'goals');
  await ensureDir(goalsDir);
  const charterPath = path.join(goalsDir, 'charter.md');

  let version = 1;
  let versionHistory = [];
  if (await fileExists(charterPath)) {
    const existing = await readFileWithFrontmatter(charterPath);
    version = (existing.data.version || 1) + 1;
    versionHistory = existing.data.version_history || [];
  }

  const updateDescription =
    version === 1
      ? 'Initial charter'
      : 'Updated technology stack and directory structure';

  versionHistory.push({
    version,
    date: new Date().toISOString().split('T')[0],
    description: updateDescription,
  });

  const data = {
    version,
    updated: new Date().toISOString(),
    stack,
    directories: dirs,
    languages,
    version_history: versionHistory,
  };

  const stackSection = stack.length
    ? stack.map((item) => `- ${item.name} (${item.manifest})`).join('\n')
    : '- Not detected';
  const dirSection = dirs.length
    ? dirs.map((dir) => `- ${dir}/`).join('\n')
    : '- No directories detected';
  const langSection = languages.length ? languages.join(', ') : 'Unknown';

  const versionHistorySection = versionHistory
    .map((v) => `- v${v.version} - ${v.date}: ${v.description}`)
    .join('\n');

  const content = `# Project Charter (v${version})

> **Purpose:** This charter establishes binding constraints and governance rules for the project.
> All goals, plans, research, and implementations must comply with these constitutional clauses.
> Use \`teamwerx charter\` to regenerate when the tech stack or governance rules change.

<!-- AI INSTRUCTION: When working on any goal or task, verify that your approach
  complies with all constitutional clauses below. If a constraint prevents your
  intended approach, discuss alternatives in the discussion log before proceeding.
-->

## General Principles

This charter defines the fundamental constraints and standards that govern this project. It serves as the binding reference for all development activities, ensuring consistency and quality across all goals and implementations.

## Constitutional Clauses

### Technical Constraints

**Technology Stack:**
${stackSection}

**Languages:**
${langSection}

**Directory Structure:**
${dirSection}

### Development Constraints

**Coding Standards:**
- Follow project-specific ESLint/Prettier rules where available
- Keep documentation updated alongside code changes
- Prefer append-only edits to preserve historical context
- Use consistent naming conventions across the codebase

**Testing Requirements:**
- Add or update automated tests alongside new functionality
- Use npm scripts (e.g., "test") where applicable before committing
- Maintain test coverage for critical paths
- Document test scenarios and edge cases

**Security & Compliance:**
- Avoid committing secrets or credentials
- Keep dependencies up to date alongside their lockfiles
- Observe repository-specific governance rules
- Follow principle of least privilege for access controls

### Process Constraints

**Goal Management:**
- All goals must have measurable success criteria
- Goals must be documented before implementation begins
- Success criteria must be independently verifiable

**Plan Development:**
- Plans must reference research and discussion artifacts
- Tasks must be atomic and testable
- Plan updates must preserve historical context

**Research & Discussion:**
- Research must be documented before planning
- Discussions must capture decision rationale
- All architectural decisions must be discussed before implementation

## Version History

${versionHistorySection}

---
**Note:** This charter is automatically updated with detected technology stack changes.
Manual edits to Constitutional Clauses should be tracked in the Version History above.
Last Updated: ${new Date().toISOString().split('T')[0]}
`;

  await writeFileWithFrontmatter(charterPath, data, content);
  console.log(
    chalk.green(
      `\n✓ Charter updated at ${path.relative(process.cwd(), charterPath)}\n`
    )
  );
}

module.exports = charter;
