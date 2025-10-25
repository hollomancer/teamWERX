/**
 * Analyze the codebase and generate a research report
 * 
 * This command is designed to be executed by an AI agent.
 * Each invocation creates a session directory so prior research is never overwritten.
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { getCurrentGoal, getTeamwerxDir, ensureDir } = require('../utils/file');

const formatSessionId = () => new Date().toISOString().replace(/[:.]/g, '-');

async function saveNotes(notes = [], inputsDir, sessionId, timestamp) {
  const saved = [];
  let index = 1;
  for (const note of notes) {
    if (!note?.trim()) continue;
    const filename = `note-${sessionId}-${index}.md`;
    const content = `---\ntype: note\ncreated: ${timestamp}\n---\n\n${note.trim()}\n`;
    await fs.writeFile(path.join(inputsDir, filename), content, 'utf8');
    saved.push(filename);
    index += 1;
  }
  return saved;
}

async function saveFiles(files = [], inputsDir, sessionId) {
  const saved = [];
  for (const filePath of files) {
    if (!filePath) continue;
    const absolutePath = path.resolve(process.cwd(), filePath);
    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        console.warn(chalk.yellow(`⚠ Skipping attachment (not a file): ${filePath}`));
        continue;
      }
    } catch (err) {
      console.warn(chalk.yellow(`⚠ Unable to attach file "${filePath}": ${err.message}`));
      continue;
    }
    const filename = `file-${sessionId}-${path.basename(absolutePath)}`;
    await fs.copyFile(absolutePath, path.join(inputsDir, filename));
    saved.push(filename);
  }
  return saved;
}

async function saveUrls(urls = [], inputsDir, sessionId, timestamp) {
  if (!urls.length) {
    return [];
  }
  const filename = `urls-${sessionId}.md`;
  const content = `---\ntype: url-list\ncreated: ${timestamp}\n---\n\n${urls.map((url) => `- ${url}`).join('\n')}\n`;
  await fs.writeFile(path.join(inputsDir, filename), content, 'utf8');
  return [filename];
}

async function persistSupplementalInputs(options, inputsDir, sessionId) {
  const timestamp = new Date().toISOString();
  const notes = Array.isArray(options.note) ? options.note : (options.note ? [options.note] : []);
  const files = Array.isArray(options.file) ? options.file : (options.file ? [options.file] : []);
  const urls = Array.isArray(options.url) ? options.url : (options.url ? [options.url] : []);
  
  const savedNotes = await saveNotes(notes, inputsDir, sessionId, timestamp);
  const savedFiles = await saveFiles(files, inputsDir, sessionId);
  const savedUrls = await saveUrls(urls, inputsDir, sessionId, timestamp);
  
  return {
    notes: savedNotes,
    files: savedFiles,
    urls: savedUrls
  };
}

async function research(goalName, options = {}) {
  const goal = goalName || await getCurrentGoal();
  
  if (!goal) {
    console.error(chalk.red('\n✗ Error: No goal specified and no current goal set.'));
    console.log(chalk.gray('Set a current goal with: ') + chalk.cyan('teamwerx use <goal-name>\n'));
    process.exit(1);
  }
  
  const sessionId = formatSessionId();
  const researchRoot = path.join(getTeamwerxDir(), 'research', goal);
  const sessionDir = path.join(researchRoot, `session-${sessionId}`);
  const inputsDir = path.join(sessionDir, 'inputs');
  
  await ensureDir(inputsDir);
  const supplemental = await persistSupplementalInputs(options, inputsDir, sessionId);
  const relativeSessionDir = path.relative(process.cwd(), sessionDir);
  
  console.log(chalk.blue.bold('\n🔍 Research Mode\n'));
  console.log(chalk.white('Goal: ') + chalk.cyan(goal));
  console.log(chalk.white('Session: ') + chalk.cyan(`session-${sessionId}`));
  console.log(chalk.white('Session folder: ') + chalk.cyan(relativeSessionDir));
  console.log(chalk.yellow('\nThis command should be executed by an AI agent.'));
  console.log(chalk.gray('The AI agent should:'));
  console.log(chalk.gray('  1. Read the goal file: ') + chalk.cyan(`.teamwerx/goals/${goal}.md`));
  console.log(chalk.gray('  2. Review prior research sessions (do not delete them) and any supplemental inputs provided below.'));
  console.log(chalk.gray('  3. Analyze the codebase and, when allowed, search the web for up-to-date references.'));
  console.log(chalk.gray(`  4. Incorporate any attached files/notes/URLs stored in: `) + chalk.cyan(path.join(relativeSessionDir, 'inputs')));
  console.log(chalk.gray(`  5. Save new findings to: `) + chalk.cyan(path.join(relativeSessionDir, 'report.md')));
  console.log(chalk.gray('  6. Append or cross-reference summaries instead of overwriting earlier sessions.'));
  console.log(chalk.gray('\nSee AGENTS.md for detailed instructions.\n'));
  
  const { notes, files, urls } = supplemental;
  if (notes.length || files.length || urls.length) {
    console.log(chalk.white('Supplemental context captured for this session:'));
    if (notes.length) {
      console.log(chalk.gray(`  • Notes: ${notes.join(', ')}`));
    }
    if (files.length) {
      console.log(chalk.gray(`  • Files: ${files.join(', ')}`));
    }
    if (urls.length) {
      console.log(chalk.gray(`  • URLs: ${urls.join(', ')}`));
    }
    console.log();
  }
}

module.exports = research;
