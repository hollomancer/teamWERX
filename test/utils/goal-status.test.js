const { getStatusColor } = require('../../lib/utils/goal-status');

describe('Goal Status Utils', () => {
  describe('getStatusColor', () => {
    test('should return correct color for draft status', () => {
      expect(getStatusColor('draft')).toBe('gray');
    });

    test('should return correct color for open status', () => {
      expect(getStatusColor('open')).toBe('blue');
    });

    test('should return correct color for in-progress status', () => {
      expect(getStatusColor('in-progress')).toBe('yellow');
    });

    test('should return correct color for blocked status', () => {
      expect(getStatusColor('blocked')).toBe('red');
    });

    test('should return correct color for completed status', () => {
      expect(getStatusColor('completed')).toBe('green');
    });

    test('should return correct color for cancelled status', () => {
      expect(getStatusColor('cancelled')).toBe('dim');
    });

    test('should return correct color for archived status', () => {
      expect(getStatusColor('archived')).toBe('dim');
    });

    test('should return white for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('white');
    });
  });
});
