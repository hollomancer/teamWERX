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
  if (await fileExists(charterPath)) {
    const existing = await readFileWithFrontmatter(charterPath);
    version = (existing.data.version || 1) + 1;
  }

  const data = {
    version,
    updated: new Date().toISOString(),
    stack,
    directories: dirs,
    languages,
  };

  const stackSection = stack.length
    ? stack.map((item) => `- ${item.name} (${item.manifest})`).join('\n')
    : '- Not detected';
  const dirSection = dirs.length
    ? dirs.map((dir) => `- ${dir}/`).join('\n')
    : '- No directories detected';
  const langSection = languages.length ? languages.join(', ') : 'Unknown';

  const content = `# Project Charter (v${version})

## Technology Stack
${stackSection}

## Coding Standards
- Follow project-specific ESLint/Prettier rules where available
- Keep documentation updated alongside code changes
- Prefer append-only edits to preserve historical context

## Testing Requirements
- Add or update automated tests alongside new functionality
- Use npm scripts (e.g., \"test\") where applicable before committing

## Security & Compliance
- Avoid committing secrets or credentials
- Keep dependencies up to date alongside their lockfiles
- Observe repository-specific governance rules

## Directory Overview
${dirSection}

## Languages Observed
${langSection}

## Governance Notes
- Regenerate this charter whenever the tech stack or governance rules change
- Use \`teamwerx charter\` to refresh these constraints
`;

  await writeFileWithFrontmatter(charterPath, data, content);
  console.log(
    chalk.green(`\n✓ Charter updated at ${path.relative(process.cwd(), charterPath)}\n`)
  );
}

module.exports = charter;
