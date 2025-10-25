const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const {
  dirExists,
  fileExists,
  ensureDir,
  toKebabCase,
  readFileWithFrontmatter,
  writeFileWithFrontmatter,
} = require('../../lib/utils/file');

describe('File Utils', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = path.join(os.tmpdir(), `teamwerx-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Restore original working directory
    if (originalCwd) {
      process.chdir(originalCwd);
    }
    
    // Clean up the temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors during cleanup
    }
  });

  describe('dirExists', () => {
    test('should return true for existing directory', async () => {
      const result = await dirExists(testDir);
      expect(result).toBe(true);
    });

    test('should return false for non-existing directory', async () => {
      const nonExistentDir = path.join(testDir, 'nonexistent');
      const result = await dirExists(nonExistentDir);
      expect(result).toBe(false);
    });

    test('should return false for a file path', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'content');
      const result = await dirExists(filePath);
      expect(result).toBe(false);
    });
  });

  describe('fileExists', () => {
    test('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'test.txt');
      await fs.writeFile(filePath, 'content');
      const result = await fileExists(filePath);
      expect(result).toBe(true);
    });

    test('should return false for non-existing file', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.txt');
      const result = await fileExists(nonExistentFile);
      expect(result).toBe(false);
    });

    test('should return false for a directory path', async () => {
      const result = await fileExists(testDir);
      expect(result).toBe(false);
    });
  });

  describe('ensureDir', () => {
    test('should create a new directory', async () => {
      const newDir = path.join(testDir, 'newdir');
      await ensureDir(newDir);
      const result = await dirExists(newDir);
      expect(result).toBe(true);
    });

    test('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');
      await ensureDir(nestedDir);
      const result = await dirExists(nestedDir);
      expect(result).toBe(true);
    });

    test('should not throw error if directory already exists', async () => {
      await expect(ensureDir(testDir)).resolves.not.toThrow();
    });
  });

  describe('toKebabCase', () => {
    test('should convert regular text to kebab-case', () => {
      expect(toKebabCase('Hello World')).toBe('hello-world');
    });

    test('should convert PascalCase to kebab-case', () => {
      expect(toKebabCase('Implement User Auth')).toBe('implement-user-auth');
    });

    test('should handle multiple spaces', () => {
      expect(toKebabCase('  multiple   spaces  ')).toBe('multiple-spaces');
    });

    test('should handle special characters', () => {
      expect(toKebabCase('Test@Feature#123')).toBe('test-feature-123');
    });

    test('should handle already kebab-cased strings', () => {
      expect(toKebabCase('already-kebab-case')).toBe('already-kebab-case');
    });

    test('should handle empty string', () => {
      expect(toKebabCase('')).toBe('');
    });

    test('should remove leading and trailing hyphens', () => {
      expect(toKebabCase('---test---')).toBe('test');
    });
  });

  describe('readFileWithFrontmatter', () => {
    test('should read file with frontmatter', async () => {
      const filePath = path.join(testDir, 'test.md');
      const content = `---
title: Test Goal
created: 2025-10-25
---

This is the content.`;
      await fs.writeFile(filePath, content);
      
      const result = await readFileWithFrontmatter(filePath);
      expect(result.data.title).toBe('Test Goal');
      expect(result.data.created).toEqual(new Date('2025-10-25'));
      expect(result.content.trim()).toBe('This is the content.');
    });

    test('should read file without frontmatter', async () => {
      const filePath = path.join(testDir, 'test.md');
      const content = 'Just plain content.';
      await fs.writeFile(filePath, content);
      
      const result = await readFileWithFrontmatter(filePath);
      expect(result.data).toEqual({});
      expect(result.content.trim()).toBe('Just plain content.');
    });
  });

  describe('writeFileWithFrontmatter', () => {
    test('should write file with frontmatter', async () => {
      const filePath = path.join(testDir, 'output.md');
      const data = { title: 'Test', created: '2025-10-25' };
      const content = 'Body content';
      
      await writeFileWithFrontmatter(filePath, data, content);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      expect(fileContent).toContain('title: Test');
      expect(fileContent).toContain('created: \'2025-10-25\'');
      expect(fileContent).toContain('Body content');
    });

    test('should write file with empty frontmatter', async () => {
      const filePath = path.join(testDir, 'output.md');
      const data = {};
      const content = 'Just content';
      
      await writeFileWithFrontmatter(filePath, data, content);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      expect(fileContent).toContain('Just content');
    });
  });

  describe('getCurrentGoal', () => {
    const { getCurrentGoal, setCurrentGoal } = require('../../lib/utils/file');
    
    test('should return null when no current goal is set', async () => {
      // Change to test directory for this test
      originalCwd = process.cwd();
      process.chdir(testDir);
      
      const result = await getCurrentGoal();
      expect(result).toBeNull();
    });

    test('should return current goal after setting it', async () => {
      originalCwd = process.cwd();
      process.chdir(testDir);
      
      await ensureDir(path.join(testDir, '.teamwerx'));
      await setCurrentGoal('my-goal');
      const result = await getCurrentGoal();
      expect(result).toBe('my-goal');
    });
  });

  describe('listGoals', () => {
    const { listGoals } = require('../../lib/utils/file');
    
    test('should return empty array when goals directory does not exist', async () => {
      originalCwd = process.cwd();
      process.chdir(testDir);
      
      const goals = await listGoals();
      expect(goals).toEqual([]);
    });

    test('should list all goal files', async () => {
      originalCwd = process.cwd();
      process.chdir(testDir);
      
      const goalsDir = path.join(testDir, '.teamwerx', 'goals');
      await ensureDir(goalsDir);
      
      await writeFileWithFrontmatter(
        path.join(goalsDir, 'goal1.md'),
        { title: 'Goal 1', created: '2025-10-25' },
        'Content 1'
      );
      
      await writeFileWithFrontmatter(
        path.join(goalsDir, 'goal2.md'),
        { title: 'Goal 2', created: '2025-10-26' },
        'Content 2'
      );

      const goals = await listGoals();
      expect(goals).toHaveLength(2);
      expect(goals.find(g => g.filename === 'goal1')).toBeDefined();
      expect(goals.find(g => g.filename === 'goal2')).toBeDefined();
    });
  });
});
