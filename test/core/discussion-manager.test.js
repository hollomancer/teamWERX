const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { DiscussionManager } = require('../../lib/core/discussion-manager');

describe('DiscussionManager', () => {
  let testDir;
  let workspace;

  beforeEach(async () => {
    // Create a temporary directory for each test
    testDir = path.join(os.tmpdir(), `teamwerx-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Mock workspace object
    workspace = {
      slug: 'test-goal',
      number: '001',
      title: 'Test Goal',
      discussPath: path.join(testDir, 'discuss.md'),
    };
  });

  afterEach(async () => {
    // Clean up the temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore errors during cleanup
    }
  });

  describe('constructor', () => {
    test('should initialize with workspace', () => {
      const manager = new DiscussionManager(workspace);
      expect(manager.workspace).toBe(workspace);
      expect(manager.discussPath).toBe(workspace.discussPath);
      expect(manager.entries).toEqual([]);
      expect(manager.frontmatter).toEqual({});
    });
  });

  describe('load', () => {
    test('should initialize empty arrays when discuss file does not exist', async () => {
      const manager = new DiscussionManager(workspace);
      await manager.load();
      
      expect(manager.entries).toEqual([]);
      expect(manager.frontmatter).toEqual({});
    });

    test('should load entries from existing discussion file', async () => {
      const discussContent = `---
goal: test-goal
goal_number: '001'
updated: '2025-10-25T00:00:00.000Z'
entries:
  - id: D01
    type: discussion
    content: First discussion point
    metadata: {}
    timestamp: '2025-10-25T00:00:00.000Z'
  - id: R01
    type: reflection
    content: First reflection
    metadata: {}
    timestamp: '2025-10-25T01:00:00.000Z'
---

# Discussion Log for Test Goal

## D01 · 10/25/2025, 12:00:00 AM
**Type:** discussion

First discussion point

## R01 · 10/25/2025, 1:00:00 AM
**Type:** reflection

First reflection
`;
      await fs.writeFile(workspace.discussPath, discussContent);

      const manager = new DiscussionManager(workspace);
      await manager.load();

      expect(manager.entries).toHaveLength(2);
      expect(manager.entries[0].id).toBe('D01');
      expect(manager.entries[0].type).toBe('discussion');
      expect(manager.entries[1].id).toBe('R01');
      expect(manager.entries[1].type).toBe('reflection');
    });
  });

  describe('nextEntryId', () => {
    test('should return D01 for empty discussion list', () => {
      const manager = new DiscussionManager(workspace);
      expect(manager.nextEntryId('D')).toBe('D01');
    });

    test('should return R01 for empty reflection list', () => {
      const manager = new DiscussionManager(workspace);
      expect(manager.nextEntryId('R')).toBe('R01');
    });

    test('should return next sequential ID for discussions', () => {
      const manager = new DiscussionManager(workspace);
      manager.entries = [
        { id: 'D01', type: 'discussion', content: 'First' },
        { id: 'D02', type: 'discussion', content: 'Second' },
      ];
      expect(manager.nextEntryId('D')).toBe('D03');
    });

    test('should handle mixed discussion and reflection entries', () => {
      const manager = new DiscussionManager(workspace);
      manager.entries = [
        { id: 'D01', type: 'discussion', content: 'Discussion 1' },
        { id: 'R01', type: 'reflection', content: 'Reflection 1' },
        { id: 'D02', type: 'discussion', content: 'Discussion 2' },
      ];
      expect(manager.nextEntryId('D')).toBe('D03');
      expect(manager.nextEntryId('R')).toBe('R02');
    });

    test('should pad single digit numbers', () => {
      const manager = new DiscussionManager(workspace);
      manager.entries = [{ id: 'D05', type: 'discussion', content: 'Discussion 5' }];
      expect(manager.nextEntryId('D')).toBe('D06');
    });
  });

  describe('addEntry', () => {
    test('should add a discussion entry', () => {
      const manager = new DiscussionManager(workspace);
      const entry = manager.addEntry({
        type: 'discussion',
        content: 'New discussion point',
      });

      expect(entry.id).toBe('D01');
      expect(entry.type).toBe('discussion');
      expect(entry.content).toBe('New discussion point');
      expect(entry.metadata).toEqual({});
      expect(entry.timestamp).toBeDefined();
      expect(manager.entries).toHaveLength(1);
    });

    test('should add a reflection entry', () => {
      const manager = new DiscussionManager(workspace);
      const entry = manager.addEntry({
        type: 'reflection',
        content: 'New reflection',
      });

      expect(entry.id).toBe('R01');
      expect(entry.type).toBe('reflection');
      expect(entry.content).toBe('New reflection');
    });

    test('should add entry with metadata', () => {
      const manager = new DiscussionManager(workspace);
      const entry = manager.addEntry({
        type: 'discussion',
        content: 'Discussion with metadata',
        metadata: { proposal: true },
      });

      expect(entry.metadata).toEqual({ proposal: true });
    });

    test('should add multiple entries with sequential IDs', () => {
      const manager = new DiscussionManager(workspace);
      manager.addEntry({ type: 'discussion', content: 'First' });
      manager.addEntry({ type: 'reflection', content: 'Second' });
      manager.addEntry({ type: 'discussion', content: 'Third' });

      expect(manager.entries).toHaveLength(3);
      expect(manager.entries[0].id).toBe('D01');
      expect(manager.entries[1].id).toBe('R01');
      expect(manager.entries[2].id).toBe('D02');
    });
  });

  describe('buildBody', () => {
    test('should generate markdown body with entries', () => {
      const manager = new DiscussionManager(workspace);
      manager.addEntry({ type: 'discussion', content: 'First discussion' });
      manager.addEntry({ type: 'reflection', content: 'First reflection' });

      const body = manager.buildBody();

      expect(body).toContain('# Discussion Log for Test Goal');
      expect(body).toContain('## D01');
      expect(body).toContain('**Type:** discussion');
      expect(body).toContain('First discussion');
      expect(body).toContain('## R01');
      expect(body).toContain('**Type:** reflection');
      expect(body).toContain('First reflection');
    });

    test('should handle empty entries list', () => {
      const manager = new DiscussionManager(workspace);
      const body = manager.buildBody();

      expect(body).toContain('# Discussion Log for Test Goal');
    });
  });

  describe('save', () => {
    test('should save discussion to file', async () => {
      const manager = new DiscussionManager(workspace);
      manager.addEntry({ type: 'discussion', content: 'Test discussion' });
      manager.addEntry({ type: 'reflection', content: 'Test reflection' });

      await manager.save();

      const content = await fs.readFile(workspace.discussPath, 'utf8');
      expect(content).toContain('goal: test-goal');
      expect(content).toContain('goal_number: \'001\'');
      expect(content).toContain('# Discussion Log for Test Goal');
      expect(content).toContain('Test discussion');
      expect(content).toContain('Test reflection');
    });
  });
});
