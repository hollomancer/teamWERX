/**
 * ChangeManager
 *
 * Lightweight orchestration for change proposals (inspired by OpenSpec)
 *
 * Responsibilities:
 * - scaffold change folders under .teamwerx/changes/
 * - list/show/validate changes
 * - apply changes: import tasks into the canonical plan (PlanManager) and create implementation stubs
 * - archive changes (move to .teamwerx/archive/changes)
 *
 * Design constraints:
 * - Do not duplicate PlanManager / DiscussionManager / ImplementationManager storage.
 *   Tasks are imported into the canonical `plan.md` only when `apply` is run.
 * - When creating a proposal we also append a `--proposal` discussion entry (linking to the change id)
 *   so the change is discoverable in the goal discussion log.
 */

const fs = require("fs").promises;
const path = require("path");
const chalk = require("chalk");

const {
  getTeamwerxDir,
  ensureDir,
  dirExists,
  fileExists,
  readFileWithFrontmatter,
  writeFileWithFrontmatter,
  toKebabCase,
} = require("../utils/file");

const { handleFileError } = require("../utils/errors");

const { GoalWorkspaceManager } = require("./goal-workspace-manager");
const { PlanManager } = require("./plan-manager");
const { DiscussionManager } = require("./discussion-manager");
const { ImplementationManager } = require("./implementation-manager");
const { SpecManager } = require("./spec-manager");
const { SpecDeltaParser } = require("./spec-delta-parser");
const { SpecMerger } = require("./spec-merger");

class ChangeManager {
  constructor() {
    this.changesDir = path.join(getTeamwerxDir(), "changes");
    this.archiveDir = path.join(getTeamwerxDir(), "archive", "changes");
  }

  async ensureDirs() {
    await ensureDir(this.changesDir);
    await ensureDir(this.archiveDir);
  }

  async _listChangeDirs() {
    try {
      if (!(await dirExists(this.changesDir))) return [];
      const entries = await fs.readdir(this.changesDir, {
        withFileTypes: true,
      });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
    } catch (err) {
      handleFileError(err, "list", this.changesDir);
      return [];
    }
  }

  async _nextChangeNumber() {
    const entries = await this._listChangeDirs();
    const numbers = entries
      .map((name) => {
        const m = name.match(/^(\d{3})-/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n) => n !== null);
    if (!numbers.length) return "001";
    const max = Math.max(...numbers);
    return String(max + 1).padStart(3, "0");
  }

  _changeDirName(number, slug) {
    return `${number}-${slug}`;
  }

  async createChange(title, opts = {}) {
    await this.ensureDirs();
    const slug = toKebabCase(title);
    const number = await this._nextChangeNumber();
    const dirName = this._changeDirName(number, slug);
    const changePath = path.join(this.changesDir, dirName);
    await ensureDir(changePath);

    // Capture spec fingerprints if specs provided
    let specFingerprints = null;
    if (opts.specs && opts.specs.length > 0) {
      const specManager = new SpecManager();
      specFingerprints = await specManager.getFingerprints(opts.specs);
    }

    // frontmatter metadata for proposal.md
    const meta = {
      id: dirName,
      title,
      slug,
      number,
      created_at: new Date().toISOString(),
      status: "draft",
      author: opts.author || null,
      goal_id: opts.goal || null,
      spec_fingerprints: specFingerprints,
    };

    const proposalBody = `# Proposal: ${title}

Describe the proposed change, motivation, acceptance criteria, and any notes.

- Goal: ${meta.goal_id || "_unspecified_"}
- Suggested by: ${meta.author || "_unknown_"}

## Summary

Provide a concise summary of the change.

## Motivation

Explain why this change is needed.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
`;

    const tasksBody = `## Tasks for ${meta.id}

- [ ] T01.1 Example task item (replace with real tasks)
`;

    const specBody = `# Spec Delta for ${title}

Document the spec changes or design notes here.
`;

    // Write files
    await writeFileWithFrontmatter(
      path.join(changePath, "proposal.md"),
      meta,
      proposalBody
    );
    await writeFileWithFrontmatter(
      path.join(changePath, "tasks.md"),
      { change: meta.id },
      tasksBody
    );
    await writeFileWithFrontmatter(
      path.join(changePath, "spec-delta.md"),
      { change: meta.id },
      specBody
    );

    // Create spec delta templates if specs provided
    if (opts.specs && opts.specs.length > 0) {
      const specsDir = path.join(changePath, "specs");
      await ensureDir(specsDir);

      const deltaParser = new SpecDeltaParser();
      for (const domain of opts.specs) {
        const domainDir = path.join(specsDir, domain);
        await ensureDir(domainDir);

        const deltaContent = deltaParser.generateTemplate(domain, meta.id);
        await fs.writeFile(
          path.join(domainDir, "spec.md"),
          deltaContent,
          "utf8"
        );
      }
    }

    // status.json simple machine state
    const status = {
      id: meta.id,
      status: "draft",
      created_at: meta.created_at,
    };
    await fs.writeFile(
      path.join(changePath, "status.json"),
      JSON.stringify(status, null, 2),
      "utf8"
    );

    // Create a proposal entry in the referenced goal discussion (if provided)
    if (meta.goal_id) {
      try {
        const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(
          meta.goal_id
        );
        const discussion = new DiscussionManager(workspace);
        await discussion.load();
        discussion.addEntry({
          type: "proposal",
          content: `Proposal ${meta.id} created: ${title}\n\nSee: .teamwerx/changes/${meta.id}/proposal.md`,
          metadata: { change_id: meta.id },
        });
        await discussion.save();
      } catch (err) {
        // Non-fatal: keep the change scaffold even if discussion write fails
        // Log to console for user visibility
        // Avoid throwing to keep operation non-destructive
        // eslint-disable-next-line no-console
        console.warn(
          chalk.yellow(
            `Warning: failed to add discussion entry for goal ${meta.goal_id}: ${err.message}`
          )
        );
      }
    }

    return {
      id: meta.id,
      path: changePath,
    };
  }

  async listChanges() {
    const dirs = await this._listChangeDirs();
    const changes = [];
    for (const d of dirs) {
      const changePath = path.join(this.changesDir, d);
      const proposalPath = path.join(changePath, "proposal.md");
      const statusPath = path.join(changePath, "status.json");
      let meta = { id: d, title: d, status: "unknown" };
      try {
        if (await fileExists(proposalPath)) {
          const parsed = await readFileWithFrontmatter(proposalPath);
          meta.title = parsed.data.title || meta.title;
          meta.slug = parsed.data.slug || null;
          meta.goal_id = parsed.data.goal_id || null;
        }
        if (await fileExists(statusPath)) {
          const content = await fs.readFile(statusPath, "utf8");
          const s = JSON.parse(content);
          meta.status = s.status || meta.status;
          meta.updated_at = s.updated_at || s.created_at || null;
        }
      } catch (err) {
        // Ignore per-change read errors, return what we can
      }
      changes.push(meta);
    }
    return changes;
  }

  async _findChangeDirByIdOrSlug(idOrSlug) {
    const dirs = await this._listChangeDirs();

    for (const d of dirs) {
      if (d === idOrSlug) return path.join(this.changesDir, d);
      const m = d.match(/^\d{3}-(.+)$/);
      if (m && m[1] === idOrSlug) return path.join(this.changesDir, d);
    }

    // Extra heuristic: if idOrSlug contains a leading ./ or similar, normalize and try again.
    try {
      const normalized = String(idOrSlug).replace(/^[./]+/, "");
      if (normalized !== idOrSlug) {
        for (const d of dirs) {
          if (d === normalized) return path.join(this.changesDir, d);
        }
      }
    } catch (err) {
      // ignore
    }

    return null;
  }

  async readChange(idOrSlug) {
    const changePath = await this._findChangeDirByIdOrSlug(idOrSlug);
    if (!changePath) throw new Error(`Change '${idOrSlug}' not found`);
    const proposalPath = path.join(changePath, "proposal.md");
    const tasksPath = path.join(changePath, "tasks.md");
    const specPath = path.join(changePath, "spec-delta.md");
    const statusPath = path.join(changePath, "status.json");

    const result = { id: path.basename(changePath), path: changePath };

    if (await fileExists(proposalPath)) {
      const parsed = await readFileWithFrontmatter(proposalPath);
      result.proposal = { frontmatter: parsed.data, body: parsed.content };
    }
    if (await fileExists(tasksPath)) {
      const parsed = await readFileWithFrontmatter(tasksPath);
      result.tasks = {
        frontmatter: parsed.data,
        body: parsed.content,
        parsed: this._parseTasksFromMarkdown(parsed.content),
      };
    }
    if (await fileExists(specPath)) {
      const parsed = await readFileWithFrontmatter(specPath);
      result.spec = { frontmatter: parsed.data, body: parsed.content };
    }
    if (await fileExists(statusPath)) {
      try {
        const s = JSON.parse(await fs.readFile(statusPath, "utf8"));
        result.status = s;
      } catch (err) {
        result.status = { status: "unknown" };
      }
    } else {
      result.status = { status: "draft" };
    }

    return result;
  }

  _parseTasksFromMarkdown(md) {
    // Basic parser: lines that start with "- [ ]" or "- [x]" or "- [ ] Txx"
    const lines = md.split(/\r?\n/);
    const tasks = [];
    for (const raw of lines) {
      const line = raw.trim();
      const match = line.match(
        /^- \[(?: |x)\]\s*(?:([A-Za-z0-9.-]+)\s+)?(.+)$/
      );
      if (match) {
        const idOrTag = match[1] || null;
        const title = match[2].trim();
        tasks.push({
          idHint: idOrTag,
          title,
          raw: line,
        });
      }
    }
    return tasks;
  }

  async validateChange(idOrSlug) {
    const change = await this.readChange(idOrSlug);
    const errors = [];
    if (!change.proposal) errors.push("Missing proposal.md");
    if (!change.tasks) errors.push("Missing tasks.md");
    if (change.tasks && change.tasks.parsed.length === 0)
      errors.push("No tasks parsed from tasks.md");
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async applyChange(idOrSlug, options = {}) {
    // options: { goal: 'slug', createImplementations: true, yes: boolean }
    const change = await this.readChange(idOrSlug);
    if (!change) throw new Error(`Change '${idOrSlug}' not found`);

    // Determine goal target
    const goalTarget =
      options.goal ||
      (change.proposal &&
        change.proposal.frontmatter &&
        change.proposal.frontmatter.goal_id);
    if (!goalTarget) {
      throw new Error(
        "No target goal specified. Provide --goal or add goal_id to proposal frontmatter."
      );
    }

    // Load workspace and plan
    const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(
      goalTarget
    );
    const planManager = new PlanManager(workspace);
    await planManager.load();

    const implManager = new ImplementationManager(workspace);

    const tasks = (change.tasks && change.tasks.parsed) || [];

    if (!tasks.length) {
      throw new Error("No tasks to apply from change.");
    }

    // Add each task to canonical plan using PlanManager (single source of truth)
    const addedTasks = [];
    for (const t of tasks) {
      const task = planManager.addTask({
        title: t.title,
        notes: `Imported from change ${change.id}`,
        source: `change:${change.id}`,
      });
      addedTasks.push(task);
    }

    await planManager.save();

    // Optionally create implementation stubs
    if (options.createImplementations !== false) {
      for (const task of addedTasks) {
        await implManager.createRecord(task.id, {
          title: `Implementation stub for ${task.id} (from change ${change.id})`,
          summary: `Task imported from change ${change.id}`,
          details: `This implementation record was created automatically when applying change ${change.id}.`,
          sources: [`change:${change.id}`],
        });
      }
    }

    // Update change status
    const statusPath = path.join(change.path, "status.json");
    const newStatus = {
      id: change.id,
      status: "applied",
      applied_at: new Date().toISOString(),
      applied_to_goal: goalTarget,
      tasks_added: addedTasks.map((t) => t.id),
    };
    await fs.writeFile(statusPath, JSON.stringify(newStatus, null, 2), "utf8");

    // Append a discussion entry to the goal for traceability
    try {
      const discussion = new DiscussionManager(workspace);
      await discussion.load();
      discussion.addEntry({
        type: "proposal-apply",
        content: `Change ${change.id} applied to ${workspace.number}-${
          workspace.slug
        } (${goalTarget}). Tasks added: ${addedTasks
          .map((t) => t.id)
          .join(", ")}.`,
        metadata: { change_id: change.id, applied_to: goalTarget },
      });
      await discussion.save();
    } catch (err) {
      // non-fatal
      // eslint-disable-next-line no-console
      console.warn(
        chalk.yellow(
          `Warning: failed to write discussion entry after applying change: ${err.message}`
        )
      );
    }

    return {
      applied: true,
      addedTasks: addedTasks.map((t) => t.id),
      changeId: change.id,
      goal: goalTarget,
    };
  }

  async _ensureUniqueTarget(targetPath) {
    if (!(await fileExists(targetPath))) return targetPath;
    const dir = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const base = path.basename(targetPath, ext);
    let counter = 1;
    let candidate = path.join(dir, `${base}-${counter}${ext}`);
    while (await fileExists(candidate)) {
      counter += 1;
      candidate = path.join(dir, `${base}-${counter}${ext}`);
    }
    return candidate;
  }

  async archiveChange(idOrSlug, options = {}) {
    const changePath = await this._findChangeDirByIdOrSlug(idOrSlug);
    if (!changePath) throw new Error(`Change '${idOrSlug}' not found`);

    // If --merge-specs requested, merge spec deltas before archiving
    let mergeResult = null;
    if (options.mergeSpecs) {
      const change = await this.readChange(idOrSlug);
      const baseFingerprints = change.proposal?.frontmatter?.spec_fingerprints;

      if (!baseFingerprints) {
        if (!options.force) {
          throw new Error(
            `Cannot merge specs: no base fingerprints found in proposal. Was this change created with --specs?`
          );
        }
      }

      const specMerger = new SpecMerger();
      mergeResult = await specMerger.mergeChange(
        change.id,
        changePath,
        baseFingerprints || {},
        {
          force: options.force || false,
          dryRun: options.dryRun || false,
        }
      );

      if (!mergeResult.success && !options.force) {
        throw new Error(
          `Spec merge failed: ${mergeResult.conflicts
            .map((c) => c.message)
            .join(", ")}`
        );
      }
    }

    await ensureDir(this.archiveDir);
    const target = path.join(this.archiveDir, path.basename(changePath));
    const finalTarget = await this._ensureUniqueTarget(target);

    if (!options.dryRun) {
      try {
        await fs.rename(changePath, finalTarget);
      } catch (err) {
        handleFileError(err, "move", changePath);
      }
    }

    // Optionally record an archive note in the related goal discussion
    if (options.notifyGoal && options.goal) {
      try {
        const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(
          options.goal
        );
        const discussion = new DiscussionManager(workspace);
        await discussion.load();
        discussion.addEntry({
          type: "archive",
          content: `Change ${path.basename(
            finalTarget
          )} archived to .teamwerx/archive/changes/${path.basename(
            finalTarget
          )}.`,
          metadata: { archived_change: path.basename(finalTarget) },
        });
        await discussion.save();
      } catch (err) {
        // non-fatal
        // eslint-disable-next-line no-console
        console.warn(
          chalk.yellow(
            `Warning: failed to notify goal about archive: ${err.message}`
          )
        );
      }
    }

    return {
      archived: !options.dryRun,
      from: changePath,
      to: finalTarget,
      mergeResult: mergeResult,
    };
  }

  /**
   * Sync spec fingerprints for a change (detect divergence)
   * @param {string} idOrSlug - Change ID or slug
   * @param {Object} options - Options
   * @param {boolean} options.update - Update fingerprints to current values
   * @returns {Promise<Object>} Sync result
   */
  async syncChange(idOrSlug, options = {}) {
    const change = await this.readChange(idOrSlug);
    const baseFingerprints = change.proposal?.frontmatter?.spec_fingerprints;

    if (!baseFingerprints) {
      return {
        hasSpecs: false,
        message: "This change has no spec fingerprints",
      };
    }

    const specManager = new SpecManager();
    const result = {
      hasSpecs: true,
      domains: [],
      diverged: false,
    };

    for (const [domain, baseFP] of Object.entries(baseFingerprints)) {
      if (!baseFP) continue; // Skip null fingerprints

      try {
        const currentSpec = await specManager.readSpec(domain);
        const diverged = currentSpec.fingerprint !== baseFP.base_fingerprint;

        result.domains.push({
          domain,
          base_fingerprint: baseFP.base_fingerprint,
          current_fingerprint: currentSpec.fingerprint,
          diverged,
        });

        if (diverged) {
          result.diverged = true;
        }
      } catch (err) {
        result.domains.push({
          domain,
          error: err.message,
        });
      }
    }

    // Update fingerprints if requested
    if (options.update && result.diverged) {
      const updatedFingerprints = await specManager.getFingerprints(
        Object.keys(baseFingerprints)
      );

      const proposalPath = path.join(change.path, "proposal.md");
      const proposal = await readFileWithFrontmatter(proposalPath);
      proposal.data.spec_fingerprints = updatedFingerprints;

      await writeFileWithFrontmatter(
        proposalPath,
        proposal.data,
        proposal.content
      );

      result.updated = true;
    }

    return result;
  }

  async resolveConflict(idOrSlug, options = {}) {
    const change = await this.readChange(idOrSlug);
    const baseFingerprints = change.proposal?.frontmatter?.spec_fingerprints;

    if (!baseFingerprints) {
      return {
        resolved: false,
        message: "No specs to resolve for this change.",
      };
    }

    const specManager = new SpecManager();
    const conflicts = [];

    for (const domain of Object.keys(baseFingerprints)) {
      try {
        const currentSpec = await specManager.readSpec(domain);
        const baseFingerprint = baseFingerprints[domain].base_fingerprint;

        if (currentSpec.fingerprint !== baseFingerprint) {
          conflicts.push(domain);
        }
      } catch (err) {
        // Ignore if spec does not exist, it will be handled as a conflict
        conflicts.push(domain);
      }
    }

    if (conflicts.length > 0) {
      const domain = conflicts[0];
      console.log(`Resolving conflict for domain: ${domain}`);

      // 1. Get Base Content
      const baseRequirements = baseFingerprints[domain].requirements;
      const baseContent = JSON.stringify(baseRequirements, null, 2);

      // 2. Get Current Content
      let currentContent = "";
      try {
        const currentSpec = await specManager.readSpec(domain);
        currentContent = currentSpec.content;
      } catch (e) {
        currentContent = "# Spec not found";
      }

      // 3. Get Delta Content
      const deltaPath = path.join(change.path, "specs", domain, "spec.md");
      const deltaParser = new SpecDeltaParser();
      const delta = await deltaParser.parseDeltaFile(deltaPath);
      const deltaContent = JSON.stringify(delta.operations, null, 2);

      const answer = await prompts.prompt([
        {
          type: "select",
          name: "action",
          message: "A conflict was detected. What would you like to do?",
          choices: [
            { title: "View Base Spec", value: "view_base" },
            { title: "View Current Spec", value: "view_current" },
            { title: "View Delta", value: "view_delta" },
            {
              title: "Accept Current (discard delta changes)",
              value: "accept_current",
            },
            { title: "Manually Resolve", value: "manual_resolve" },
            { title: "Exit", value: "exit" },
          ],
        },
      ]);

      switch (answer.action) {
        case "view_base":
          console.log(baseContent);
          break;
        case "view_current":
          console.log(currentContent);
          break;
        case "view_delta":
          console.log(deltaContent);
          break;
        case "accept_current":
          delta.operations = { ADDED: [], MODIFIED: [], REMOVED: [] };
          await this.deltaParser.writeDeltaFile(deltaPath, delta);
          console.log(`Delta for ${domain} has been cleared.`);
          return {
            resolved: true,
            message: `Accepted current spec for ${domain}.`,
          };
        case "manual_resolve":
          console.log(
            "Please manually edit the delta file to resolve the conflict:"
          );
          console.log(deltaPath);
          return { resolved: false, message: "Manual resolution required." };
        case "exit":
        default:
          return { resolved: false, message: "Conflict resolution cancelled." };
      }

      return { resolved: false, message: "Conflicts found" };
    }

    return { resolved: true, message: "All specs are in sync." };
  }
}

module.exports = {
  ChangeManager,
};
