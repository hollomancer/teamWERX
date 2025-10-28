/**
 * SpecDeltaParser
 *
 * Parses spec deltas using OpenSpec-inspired format.
 *
 * Responsibilities:
 * - Parse ADDED/MODIFIED/REMOVED sections from delta files
 * - Extract requirement blocks from each section
 * - Validate delta structure
 * - Generate operation lists for merging
 *
 * Delta Format:
 * ```markdown
 * ---
 * change: 001-add-2fa
 * domain: auth
 * delta_type: spec
 * ---
 *
 * # Spec Delta: auth
 *
 * ## ADDED Requirements
 *
 * ### Requirement: Two-Factor Authentication
 * ...
 *
 * ## MODIFIED Requirements
 *
 * ### Requirement: User Authentication
 * ...
 *
 * ## REMOVED Requirements
 *
 * ### Requirement: Old Feature
 * ...
 * ```
 */

const {
  readFileWithFrontmatter,
  toKebabCase,
} = require('../utils/file');

class SpecDeltaParser {
  constructor() {
    this.validOperations = ['ADDED', 'MODIFIED', 'REMOVED'];
  }

  /**
   * Parse a spec delta file
   * @param {string} deltaPath - Path to delta file
   * @returns {Promise<Object>} Parsed delta with operations
   */
  async parseDeltaFile(deltaPath) {
    const parsed = await readFileWithFrontmatter(deltaPath);
    return this.parseDelta(parsed.content, parsed.data);
  }

  /**
   * Parse delta content
   * @param {string} content - Delta markdown content
   * @param {Object} metadata - Frontmatter metadata
   * @returns {Object} Parsed delta object
   */
  parseDelta(content, metadata = {}) {
    const delta = {
      domain: metadata.domain || null,
      change: metadata.change || null,
      operations: {
        ADDED: [],
        MODIFIED: [],
        REMOVED: [],
      },
    };

    const sections = this._splitIntoSections(content);

    for (const section of sections) {
      if (section.operation && this.validOperations.includes(section.operation)) {
        const requirements = this._parseRequirementsFromSection(section.content);
        delta.operations[section.operation] = requirements;
      }
    }

    return delta;
  }

  /**
   * Validate a delta structure
   * @param {Object} delta - Parsed delta object
   * @returns {Object} Validation result { valid: boolean, errors: Array<string> }
   */
  validateDelta(delta) {
    const errors = [];

    if (!delta.domain) {
      errors.push('Delta missing domain in frontmatter');
    }

    // Check that at least one operation has content
    const hasOperations = Object.values(delta.operations).some(
      (reqs) => reqs.length > 0
    );

    if (!hasOperations) {
      errors.push('Delta has no operations (ADDED/MODIFIED/REMOVED)');
    }

    // Validate requirement structure
    for (const [operation, requirements] of Object.entries(delta.operations)) {
      for (const req of requirements) {
        if (!req.title) {
          errors.push(`${operation} requirement missing title`);
        }
        if (!req.content || req.content.trim().length === 0) {
          errors.push(`${operation} requirement '${req.title}' has no content`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for conflicting operations
   * @param {Object} delta - Parsed delta
   * @returns {Array<Object>} Array of conflicts
   */
  findConflicts(delta) {
    const conflicts = [];
    const requirementIds = {
      ADDED: new Set(),
      MODIFIED: new Set(),
      REMOVED: new Set(),
    };

    // Build sets of requirement IDs per operation
    for (const [operation, requirements] of Object.entries(delta.operations)) {
      for (const req of requirements) {
        requirementIds[operation].add(req.id);
      }
    }

    // Check for conflicts
    // 1. Cannot ADD and MODIFY same requirement
    for (const id of requirementIds.ADDED) {
      if (requirementIds.MODIFIED.has(id)) {
        conflicts.push({
          type: 'ADDED_AND_MODIFIED',
          requirement_id: id,
          message: `Requirement '${id}' appears in both ADDED and MODIFIED`,
        });
      }
      if (requirementIds.REMOVED.has(id)) {
        conflicts.push({
          type: 'ADDED_AND_REMOVED',
          requirement_id: id,
          message: `Requirement '${id}' appears in both ADDED and REMOVED`,
        });
      }
    }

    // 2. Cannot MODIFY and REMOVE same requirement
    for (const id of requirementIds.MODIFIED) {
      if (requirementIds.REMOVED.has(id)) {
        conflicts.push({
          type: 'MODIFIED_AND_REMOVED',
          requirement_id: id,
          message: `Requirement '${id}' appears in both MODIFIED and REMOVED`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Split content into operation sections
   * @param {string} content - Markdown content
   * @returns {Array<Object>} Array of section objects
   * @private
   */
  _splitIntoSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      // Match: ## ADDED Requirements, ## MODIFIED Requirements, ## REMOVED Requirements
      const sectionMatch = line.match(/^## (ADDED|MODIFIED|REMOVED) Requirements$/i);

      if (sectionMatch) {
        // Save previous section
        if (currentSection) {
          sections.push({
            operation: currentSection,
            content: currentContent.join('\n'),
          });
        }

        // Start new section
        currentSection = sectionMatch[1].toUpperCase();
        currentContent = [];
        continue;
      }

      // Check if we've hit another ## heading (end of operations section)
      if (currentSection && line.match(/^## /) && !line.match(/^## (ADDED|MODIFIED|REMOVED)/i)) {
        // Save current section and stop
        sections.push({
          operation: currentSection,
          content: currentContent.join('\n'),
        });
        currentSection = null;
        currentContent = [];
        continue;
      }

      // Accumulate content
      if (currentSection) {
        currentContent.push(line);
      }
    }

    // Don't forget the last section
    if (currentSection) {
      sections.push({
        operation: currentSection,
        content: currentContent.join('\n'),
      });
    }

    return sections;
  }

  /**
   * Parse requirements from a section's content
   * @param {string} content - Section content
   * @returns {Array<Object>} Array of requirement objects
   * @private
   */
  _parseRequirementsFromSection(content) {
    const requirements = [];
    const lines = content.split('\n');
    let currentRequirement = null;
    let currentContent = [];

    for (const line of lines) {
      // Parse requirement header: ### Requirement: <title>
      const reqMatch = line.match(/^### Requirement: (.+)$/);

      if (reqMatch) {
        // Save previous requirement
        if (currentRequirement) {
          currentRequirement.content = currentContent.join('\n').trim();
          requirements.push(currentRequirement);
        }

        // Start new requirement
        const title = reqMatch[1].trim();
        currentRequirement = {
          id: this._titleToId(title),
          title: title,
          content: '',
        };
        currentContent = [line];
        continue;
      }

      // Accumulate content for current requirement
      if (currentRequirement) {
        currentContent.push(line);
      }
    }

    // Don't forget the last requirement
    if (currentRequirement) {
      currentRequirement.content = currentContent.join('\n').trim();
      requirements.push(currentRequirement);
    }

    return requirements;
  }

  /**
   * Convert requirement title to ID
   * @param {string} title - Requirement title
   * @returns {string} Kebab-case ID
   * @private
   */
  _titleToId(title) {
    return toKebabCase(title);
  }

  /**
   * Generate a delta template
   * @param {string} domain - Domain name
   * @param {string} changeId - Change ID
   * @returns {string} Delta template markdown
   */
  generateTemplate(domain, changeId) {
    return `---
change: ${changeId}
domain: ${domain}
delta_type: spec
---

# Spec Delta: ${domain}

## ADDED Requirements

### Requirement: New Feature
Replace this with requirements you're adding.

#### Scenario: Example scenario
- MUST describe the new behavior
- MUST define acceptance criteria

## MODIFIED Requirements

### Requirement: Existing Feature
Replace this with requirements you're modifying.

#### Scenario: Updated scenario
- MUST describe the changed behavior
- MUST maintain backward compatibility (if applicable)

## REMOVED Requirements

### Requirement: Deprecated Feature
List requirements being removed (if any).

## Notes

Add any additional context about these spec changes.
`;
  }
}

module.exports = { SpecDeltaParser };
