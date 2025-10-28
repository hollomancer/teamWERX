/**
 * SpecManager
 *
 * Manages project-level specifications with fingerprinting for delta tracking.
 *
 * Responsibilities:
 * - Read/write specs with frontmatter
 * - Parse requirement blocks from markdown
 * - Generate SHA-256 fingerprints for change detection
 * - List all project specs
 * - Initialize spec directory structure
 *
 * Spec Format:
 * ```markdown
 * ---
 * domain: auth
 * updated: 2025-10-28T12:00:00Z
 * ---
 *
 * # Authentication Specification
 *
 * ## Requirements
 *
 * ### Requirement: User Authentication
 *
 * #### Scenario: Valid credentials
 * - MUST authenticate user with valid email and password
 * ```
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const {
  getTeamwerxDir,
  ensureDir,
  dirExists,
  fileExists,
  readFileWithFrontmatter,
  writeFileWithFrontmatter,
  toKebabCase,
} = require('../utils/file');
const { handleFileError } = require('../utils/errors');

class SpecManager {
  constructor(baseDir = null) {
    this.baseDir = baseDir || path.join(getTeamwerxDir(), 'specs');
  }

  /**
   * Ensure specs directory exists
   * @returns {Promise<void>}
   */
  async ensureDirs() {
    await ensureDir(this.baseDir);
  }

  /**
   * Initialize specs directory with README
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.ensureDirs();

    const readmePath = path.join(this.baseDir, 'README.md');
    if (await fileExists(readmePath)) {
      return; // Already initialized
    }

    const readmeContent = `# Specifications

This directory contains project-level specifications organized by domain.

## Structure

Each domain has its own subdirectory:

\`\`\`
specs/
├── auth/
│   └── spec.md
├── api/
│   └── spec.md
└── database/
    └── spec.md
\`\`\`

## Spec Format

Specs use YAML frontmatter + markdown:

\`\`\`markdown
---
domain: auth
updated: 2025-10-28T12:00:00Z
---

# Authentication Specification

## Purpose

Define authentication requirements...

## Requirements

### Requirement: User Authentication

#### Scenario: Valid credentials
- MUST authenticate user with valid email and password
- MUST return session token on successful authentication
\`\`\`

## Creating Specs

Create a new spec domain:

\`\`\`bash
teamwerx specs create <domain>
\`\`\`

## Delta Tracking

When creating changes that affect specs, use the \`--specs\` flag:

\`\`\`bash
teamwerx propose "Add 2FA" --specs auth
\`\`\`

This captures spec fingerprints for conflict detection during merge.
`;

    await fs.writeFile(readmePath, readmeContent, 'utf8');
  }

  /**
   * Create a new spec domain
   * @param {string} domain - Domain name (e.g., 'auth', 'api')
   * @param {Object} opts - Options
   * @param {string} opts.title - Optional title (defaults to capitalized domain)
   * @returns {Promise<string>} Path to created spec file
   */
  async createSpec(domain, opts = {}) {
    await this.ensureDirs();

    const domainSlug = toKebabCase(domain);
    const domainDir = path.join(this.baseDir, domainSlug);
    await ensureDir(domainDir);

    const specPath = path.join(domainDir, 'spec.md');

    if (await fileExists(specPath)) {
      throw new Error(`Spec already exists: ${domainSlug}`);
    }

    const title = opts.title || domain.charAt(0).toUpperCase() + domain.slice(1);

    const metadata = {
      domain: domainSlug,
      updated: new Date().toISOString(),
    };

    const content = `# ${title} Specification

## Purpose

Define the purpose and scope of this specification domain.

## Requirements

### Requirement: Example Requirement

Replace this with your actual requirements.

#### Scenario: Example scenario
- MUST describe expected behavior
- MUST define acceptance criteria
- SHOULD provide implementation guidance

## Notes

Additional notes, references, or context.
`;

    await writeFileWithFrontmatter(specPath, metadata, content);
    return specPath;
  }

  /**
   * Read a spec by domain
   * @param {string} domain - Domain name
   * @returns {Promise<Object>} Spec object with domain, content, fingerprint, requirements
   */
  async readSpec(domain) {
    const domainSlug = toKebabCase(domain);
    const specPath = path.join(this.baseDir, domainSlug, 'spec.md');

    if (!(await fileExists(specPath))) {
      throw new Error(`Spec not found: ${domainSlug}`);
    }

    const parsed = await readFileWithFrontmatter(specPath);

    return {
      domain: domainSlug,
      path: specPath,
      data: parsed.data,
      content: parsed.content,
      fingerprint: this._generateFingerprint(parsed.content),
      requirements: this._parseRequirements(parsed.content),
    };
  }

  /**
   * Write/update a spec
   * @param {string} domain - Domain name
   * @param {string} content - Markdown content
   * @param {Object} data - Optional frontmatter data (will preserve existing if not provided)
   * @returns {Promise<void>}
   */
  async writeSpec(domain, content, data = null) {
    const domainSlug = toKebabCase(domain);
    const specPath = path.join(this.baseDir, domainSlug, 'spec.md');
    const domainDir = path.dirname(specPath);

    await ensureDir(domainDir);

    let metadata = data;
    if (!metadata) {
      // Try to preserve existing metadata
      if (await fileExists(specPath)) {
        const existing = await readFileWithFrontmatter(specPath);
        metadata = existing.data;
      } else {
        metadata = { domain: domainSlug };
      }
    }

    metadata.updated = new Date().toISOString();

    await writeFileWithFrontmatter(specPath, metadata, content);
  }

  /**
   * Check if a spec exists
   * @param {string} domain - Domain name
   * @returns {Promise<boolean>}
   */
  async specExists(domain) {
    const domainSlug = toKebabCase(domain);
    const specPath = path.join(this.baseDir, domainSlug, 'spec.md');
    return fileExists(specPath);
  }

  /**
   * List all spec domains
   * @returns {Promise<Array<Object>>} Array of spec metadata objects
   */
  async listSpecs() {
    if (!(await dirExists(this.baseDir))) {
      return [];
    }

    try {
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      const domains = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();

      const specs = [];
      for (const domain of domains) {
        const specPath = path.join(this.baseDir, domain, 'spec.md');
        if (await fileExists(specPath)) {
          try {
            const spec = await this.readSpec(domain);
            specs.push({
              domain: spec.domain,
              path: specPath,
              updated: spec.data.updated,
              fingerprint: spec.fingerprint,
              requirement_count: spec.requirements.length,
            });
          } catch (err) {
            // Skip malformed specs
            console.warn(`Skipping malformed spec: ${domain}`);
          }
        }
      }

      return specs;
    } catch (err) {
      handleFileError(err, 'list', this.baseDir);
      return [];
    }
  }

  /**
   * Get fingerprints for multiple domains
   * @param {Array<string>} domains - Array of domain names
   * @returns {Promise<Object>} Map of domain -> fingerprint data
   */
  async getFingerprints(domains) {
    const fingerprints = {};

    for (const domain of domains) {
      try {
        const spec = await this.readSpec(domain);
        fingerprints[domain] = {
          base_fingerprint: spec.fingerprint,
          base_timestamp: new Date().toISOString(),
          requirements: spec.requirements.map((req) => ({
            id: req.id,
            title: req.title,
            fingerprint: this._generateFingerprint(req.content),
          })),
        };
      } catch (err) {
        console.warn(`Warning: Could not read spec for domain '${domain}': ${err.message}`);
        fingerprints[domain] = null;
      }
    }

    return fingerprints;
  }

  /**
   * Generate SHA-256 fingerprint for content
   * @param {string} content - Content to fingerprint
   * @returns {string} First 16 characters of SHA-256 hash
   * @private
   */
  _generateFingerprint(content) {
    return crypto
      .createHash('sha256')
      .update(content.trim())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Parse requirements from spec content
   * @param {string} content - Markdown content
   * @returns {Array<Object>} Array of requirement objects
   * @private
   */
  _parseRequirements(content) {
    const requirements = [];
    const lines = content.split('\n');
    let currentRequirement = null;
    let currentContent = [];
    let inRequirementsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if we're entering Requirements section
      if (line.match(/^## Requirements$/i)) {
        inRequirementsSection = true;
        continue;
      }

      // Check if we're leaving Requirements section
      if (inRequirementsSection && line.match(/^## /)) {
        // Save current requirement if exists
        if (currentRequirement) {
          currentRequirement.content = currentContent.join('\n').trim();
          requirements.push(currentRequirement);
          currentRequirement = null;
          currentContent = [];
        }
        inRequirementsSection = false;
        continue;
      }

      if (!inRequirementsSection) continue;

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
   * Extract scenarios from requirement content
   * @param {string} content - Requirement content
   * @returns {Array<Object>} Array of scenario objects
   * @private
   */
  _extractScenarios(content) {
    const scenarios = [];
    const lines = content.split('\n');
    let currentScenario = null;
    let currentItems = [];

    for (const line of lines) {
      // Parse scenario header: #### Scenario: <title>
      const scenarioMatch = line.match(/^#### Scenario: (.+)$/);
      if (scenarioMatch) {
        // Save previous scenario
        if (currentScenario) {
          currentScenario.items = currentItems;
          scenarios.push(currentScenario);
        }

        // Start new scenario
        currentScenario = {
          title: scenarioMatch[1].trim(),
          items: [],
        };
        currentItems = [];
        continue;
      }

      // Parse scenario items (lines starting with -)
      if (currentScenario && line.trim().startsWith('-')) {
        currentItems.push(line.trim().substring(1).trim());
      }
    }

    // Don't forget the last scenario
    if (currentScenario) {
      currentScenario.items = currentItems;
      scenarios.push(currentScenario);
    }

    return scenarios;
  }
}

module.exports = { SpecManager };
