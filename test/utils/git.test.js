const { isGitRepo, hasUncommittedChanges } = require('../../lib/utils/git');

// Note: These tests assume they're running in a git repository
describe('Git Utils', () => {
  describe('isGitRepo', () => {
    test('should return true when in a git repository', async () => {
      const result = await isGitRepo();
      expect(result).toBe(true);
    });
  });

  describe('hasUncommittedChanges', () => {
    test('should return a boolean value', async () => {
      const result = await hasUncommittedChanges();
      expect(typeof result).toBe('boolean');
    });
  });
});
