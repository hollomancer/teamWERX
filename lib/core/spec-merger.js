/**
 * SpecMerger
 *
 * Applies spec deltas to project specs with conflict detection.
 *
 * Responsibilities:
 * - Apply ADDED/MODIFIED/REMOVED operations to specs
 * - Detect fingerprint divergence (spec changed since delta created)
 * - Handle conflicts and provide resolution guidance
 * - Generate merge reports
 *
 * Merge Strategy:
 * 1. Check base fingerprint against current spec
 *    - Match: Fast-forward merge (safe)
 *    - Mismatch: Conflict (spec has diverged)
 * 2. Apply operations in order: REMOVED → MODIFIED → ADDED
 * 3. Update spec file with merged content
 */

const crypto = require("crypto");
const { SpecManager } = require("./spec-manager");
const { SpecDeltaParser } = require("./spec-delta-parser");

class SpecMerger {
  constructor(specManager = null) {
    this.specManager = specManager || new SpecManager();
    this.deltaParser = new SpecDeltaParser();
  }

  /**
   * Merge a change's spec deltas into project specs
   * @param {string} changeId - Change ID (e.g., '001-add-2fa')
   * @param {string} changePath - Path to change directory
   * @param {Object} baseFingerprints - Base fingerprints from proposal
   * @param {Object} opts - Options
   * @param {boolean} opts.force - Force merge even if divergence detected
   * @param {boolean} opts.dryRun - Preview merge without applying
   * @returns {Promise<Object>} Merge result
   */
  async mergeChange(changeId, changePath, baseFingerprints, opts = {}) {
    const path = require("path");
    const { fileExists } = require("../utils/file");
    const ora = require("ora");

    const result = {
      change_id: changeId,
      domains_merged: [],
      conflicts: [],
      warnings: [],
      success: true,
    };

    // Get list of spec domains in change
    const specsDir = path.join(changePath, "specs");
    const fs = require("fs").promises;

    if (!(await fileExists(specsDir))) {
      result.warnings.push("No specs directory in change");
      return result;
    }

    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const domains = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    if (domains.length === 0) {
      result.warnings.push("No spec domains found in change");
      return result;
    }

    // Show progress if not in dry-run mode and not silent
    const showProgress = !opts.dryRun && !opts.silent;
    let spinner;

    // Process each domain
    for (const domain of domains) {
      if (showProgress) {
        spinner = ora(`Merging spec domain: ${domain}`).start();
      }

      const deltaPath = path.join(specsDir, domain, "spec.md");

      if (!(await fileExists(deltaPath))) {
        if (spinner) spinner.warn(`No spec.md found for domain '${domain}'`);
        result.warnings.push(`No spec.md found for domain '${domain}'`);
        continue;
      }

      try {
        const domainResult = await this._mergeDomain(
          domain,
          deltaPath,
          baseFingerprints[domain],
          opts
        );

        result.domains_merged.push(domainResult);

        if (domainResult.conflicts.length > 0) {
          result.conflicts.push(...domainResult.conflicts);
          if (spinner) spinner.fail(`Conflicts found in ${domain}`);
        } else if (domainResult.diverged && opts.force) {
          if (spinner) spinner.warn(`Merged ${domain} (forced, had diverged)`);
        } else {
          if (spinner) spinner.succeed(`Merged ${domain}`);
        }

        if (domainResult.diverged && !opts.force) {
          result.success = false;
        }
      } catch (err) {
        if (spinner) spinner.fail(`Error merging ${domain}: ${err.message}`);
        result.conflicts.push({
          domain,
          type: "MERGE_ERROR",
          message: err.message,
        });
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Merge a single domain's spec delta
   * @param {string} domain - Domain name
   * @param {string} deltaPath - Path to delta file
   * @param {Object} baseFingerprint - Base fingerprint data
   * @param {Object} opts - Options
   * @returns {Promise<Object>} Domain merge result
   * @private
   */
  async _mergeDomain(domain, deltaPath, baseFingerprint, opts = {}) {
    const result = {
      domain,
      diverged: false,
      conflicts: [],
      operations_applied: {
        ADDED: 0,
        MODIFIED: 0,
        REMOVED: 0,
      },
    };

    // Parse delta
    const delta = await this.deltaParser.parseDeltaFile(deltaPath);

    // Validate delta
    const validation = this.deltaParser.validateDelta(delta);
    if (!validation.valid) {
      throw new Error(`Invalid delta: ${validation.errors.join(", ")}`);
    }

    // Check for internal conflicts
    const internalConflicts = this.deltaParser.findConflicts(delta);
    if (internalConflicts.length > 0) {
      result.conflicts.push(...internalConflicts);
      throw new Error(
        `Delta has internal conflicts: ${internalConflicts
          .map((c) => c.message)
          .join(", ")}`
      );
    }

    // Read current spec
    const currentSpec = await this.specManager.readSpec(domain);

    // Check for divergence
    if (baseFingerprint) {
      const diverged =
        currentSpec.fingerprint !== baseFingerprint.base_fingerprint;

      if (diverged) {
        result.diverged = true;

        // Detailed divergence analysis
        const divergenceDetails = this._analyzeDivergence(
          baseFingerprint.requirements || [],
          currentSpec.requirements
        );

        result.conflicts.push({
          type: "DIVERGENCE",
          domain,
          message: `Spec has changed since change was created`,
          base_fingerprint: baseFingerprint.base_fingerprint,
          current_fingerprint: currentSpec.fingerprint,
          details: divergenceDetails,
        });

        if (!opts.force) {
          const detailsMsg =
            divergenceDetails.length > 0
              ? `\n  Changed requirements: ${divergenceDetails
                  .map((d) => d.requirement)
                  .join(", ")}`
              : "";

          throw new Error(
            `Spec divergence detected for domain '${domain}'.${detailsMsg}\n  Use --force to override or run 'teamwerx changes sync ${domain}' to update fingerprints.`
          );
        }
      }
    }

    // Apply operations (dry-run or real)
    const mergedContent = this._applyOperations(
      currentSpec.content,
      currentSpec.requirements,
      delta.operations,
      result
    );

    // Write merged spec (unless dry-run)
    if (!opts.dryRun) {
      await this.specManager.writeSpec(domain, mergedContent);
    }

    return result;
  }

  /**
   * Apply delta operations to spec content
   * @param {string} content - Current spec content
   * @param {Array<Object>} requirements - Current requirements
   * @param {Object} operations - Delta operations (ADDED/MODIFIED/REMOVED)
   * @param {Object} result - Result object to update with operation counts
   * @returns {string} Merged content
   * @private
   */
  _applyOperations(content, requirements, operations, result) {
    // Create a map of current requirements by ID
    const requirementMap = new Map();
    for (const req of requirements) {
      requirementMap.set(req.id, req);
    }

    // Track which requirements to keep/remove
    const toRemove = new Set();
    const toModify = new Map(); // id -> new content
    const toAdd = [];

    // Process REMOVED operations first
    for (const req of operations.REMOVED || []) {
      if (!requirementMap.has(req.id)) {
        result.conflicts.push({
          type: "REMOVE_NONEXISTENT",
          requirement_id: req.id,
          message: `Cannot remove requirement '${req.id}' - not found in spec`,
        });
        continue;
      }

      toRemove.add(req.id);
      result.operations_applied.REMOVED++;
    }

    // Process MODIFIED operations
    for (const req of operations.MODIFIED || []) {
      if (!requirementMap.has(req.id)) {
        result.conflicts.push({
          type: "MODIFY_NONEXISTENT",
          requirement_id: req.id,
          message: `Cannot modify requirement '${req.id}' - not found in spec`,
        });
        continue;
      }

      if (toRemove.has(req.id)) {
        result.conflicts.push({
          type: "MODIFY_REMOVED",
          requirement_id: req.id,
          message: `Cannot modify requirement '${req.id}' - marked for removal`,
        });
        continue;
      }

      toModify.set(req.id, req.content);
      result.operations_applied.MODIFIED++;
    }

    // Process ADDED operations
    for (const req of operations.ADDED || []) {
      if (requirementMap.has(req.id) && !toRemove.has(req.id)) {
        result.conflicts.push({
          type: "ADD_EXISTING",
          requirement_id: req.id,
          message: `Cannot add requirement '${req.id}' - already exists in spec`,
        });
        continue;
      }

      toAdd.push(req);
      result.operations_applied.ADDED++;
    }

    // Reconstruct spec content
    return this._reconstructSpec(
      content,
      requirements,
      toRemove,
      toModify,
      toAdd
    );
  }

  /**
   * Reconstruct spec content with operations applied
   * @param {string} originalContent - Original spec content
   * @param {Array<Object>} originalRequirements - Original requirements
   * @param {Set<string>} toRemove - Requirement IDs to remove
   * @param {Map<string, string>} toModify - Requirement ID -> new content
   * @param {Array<Object>} toAdd - Requirements to add
   * @returns {string} Reconstructed content
   * @private
   */
  _reconstructSpec(
    originalContent,
    originalRequirements,
    toRemove,
    toModify,
    toAdd
  ) {
    const lines = originalContent.split("\n");
    const result = [];
    let inRequirementsSection = false;
    let inRequirement = null;
    let skipUntilNextRequirement = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect Requirements section start
      if (line.match(/^## Requirements$/i)) {
        inRequirementsSection = true;
        result.push(line);
        continue;
      }

      // Detect Requirements section end
      if (inRequirementsSection && line.match(/^## /)) {
        // Before leaving Requirements section, add new requirements
        if (toAdd.length > 0) {
          result.push(""); // Blank line before new requirements
          for (const req of toAdd) {
            result.push(req.content);
            result.push(""); // Blank line after each requirement
          }
        }

        inRequirementsSection = false;
        inRequirement = null;
        result.push(line);
        continue;
      }

      if (!inRequirementsSection) {
        result.push(line);
        continue;
      }

      // Parse requirement header
      const reqMatch = line.match(/^### Requirement: (.+)$/);
      if (reqMatch) {
        const title = reqMatch[1].trim();
        const id = this._titleToId(title);

        // Check if this requirement should be removed
        if (toRemove.has(id)) {
          skipUntilNextRequirement = true;
          inRequirement = id;
          continue;
        }

        // Check if this requirement should be modified
        if (toModify.has(id)) {
          result.push(toModify.get(id));
          skipUntilNextRequirement = true;
          inRequirement = id;
          continue;
        }

        // Keep requirement as-is
        skipUntilNextRequirement = false;
        inRequirement = id;
        result.push(line);
        continue;
      }

      // Handle content within requirements
      if (inRequirement) {
        if (!skipUntilNextRequirement) {
          result.push(line);
        }
        continue;
      }

      // Outside of any requirement (e.g., section intro text)
      result.push(line);
    }

    // If we reached the end and still in Requirements section, add new requirements
    if (inRequirementsSection && toAdd.length > 0) {
      result.push(""); // Blank line before new requirements
      for (const req of toAdd) {
        result.push(req.content);
        result.push(""); // Blank line after each requirement
      }
    }

    return result.join("\n");
  }

  /**
   * Convert requirement title to ID
   * @param {string} title - Requirement title
   * @returns {string} Kebab-case ID
   * @private
   */
  _titleToId(title) {
    const { toKebabCase } = require("../utils/file");
    return toKebabCase(title);
  }

  /**
   * Analyze divergence between base and current requirements
   * @param {Array<Object>} baseRequirements - Base requirements from fingerprint
   * @param {Array<Object>} currentRequirements - Current requirements from spec
   * @returns {Array<Object>} Array of divergence details
   * @private
   */
  _analyzeDivergence(baseRequirements, currentRequirements) {
    const diverged = [];

    // Create maps for quick lookup
    const baseMap = new Map();
    baseRequirements.forEach((req) => {
      baseMap.set(req.id, req.fingerprint);
    });

    const currentMap = new Map();
    currentRequirements.forEach((req) => {
      const fp = this._generateFingerprint(req.content);
      currentMap.set(req.id, fp);
    });

    // Check for modified requirements
    for (const [id, baseFP] of baseMap.entries()) {
      const currentFP = currentMap.get(id);

      if (!currentFP) {
        diverged.push({
          requirement: id,
          change: "REMOVED",
          message: `Requirement '${id}' was removed from spec`,
        });
      } else if (currentFP !== baseFP) {
        diverged.push({
          requirement: id,
          change: "MODIFIED",
          message: `Requirement '${id}' was modified in spec`,
        });
      }
    }

    // Check for added requirements
    for (const [id, currentFP] of currentMap.entries()) {
      if (!baseMap.has(id)) {
        diverged.push({
          requirement: id,
          change: "ADDED",
          message: `Requirement '${id}' was added to spec`,
        });
      }
    }

    return diverged;
  }

  /**
   * Generate fingerprint for content
   * @param {string} content - Content to fingerprint
   * @returns {string} SHA-256 fingerprint (first 16 chars)
   * @private
   */
  _generateFingerprint(content) {
    return crypto
      .createHash("sha256")
      .update(content.trim())
      .digest("hex")
      .substring(0, 16);
  }
}

module.exports = { SpecMerger };
