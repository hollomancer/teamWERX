const fs = require('fs').promises;
const path = require('path');

async function fileExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function detectPackageJSON(root = process.cwd()) {
  const pkgPath = path.join(root, 'package.json');
  if (!(await fileExists(pkgPath))) {
    return null;
  }
  const raw = await fs.readFile(pkgPath, 'utf8');
  const json = JSON.parse(raw);
  return {
    path: pkgPath,
    json,
  };
}

async function detectTechnologyStack(root = process.cwd()) {
  const stack = [];
  const packageJson = await detectPackageJSON(root);
  if (packageJson) {
    stack.push({
      name: 'Node.js',
      details: Object.keys(packageJson.json.dependencies || {}),
      manifest: 'package.json',
    });
  }

  const files = [
    { name: 'Python', manifest: 'pyproject.toml' },
    { name: 'Python', manifest: 'requirements.txt' },
    { name: 'Go', manifest: 'go.mod' },
    { name: 'Rust', manifest: 'Cargo.toml' },
    { name: 'PHP', manifest: 'composer.json' },
  ];

  for (const entry of files) {
    if (await fileExists(path.join(root, entry.manifest))) {
      stack.push({
        name: entry.name,
        details: [],
        manifest: entry.manifest,
      });
    }
  }

  return stack;
}

async function listTopLevelDirs(root = process.cwd()) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        !['node_modules', '.git', '.teamwerx'].includes(entry.name),
    )
    .map((entry) => entry.name)
    .sort();
}

async function detectLanguages(root = process.cwd()) {
  const extensions = new Set();

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (
          ['node_modules', '.git', '.teamwerx', 'dist', 'build'].includes(
            entry.name,
          )
        ) {
          continue;
        }
        await walk(fullPath);
      } else {
        const ext = path.extname(entry.name);
        if (ext) {
          extensions.add(ext.toLowerCase());
        }
      }
    }
  }

  await walk(root);
  return Array.from(extensions).sort();
}

module.exports = {
  detectTechnologyStack,
  detectPackageJSON,
  listTopLevelDirs,
  detectLanguages,
};
