"use strict";

/**
 * Manage change proposals (propose / list / show / apply / archive)
 *
 * This CLI module provides user-facing commands that orchestrate the
 * ChangeManager (scaffolding, listing, validating, applying and archiving).
 *
 * Each exported function is intended to be used as a commander action handler.
 */

const chalk = require("chalk");
const prompts = require("../utils/prompts");
const path = require("path");

const { ChangeManager } = require("../core/change-manager");
const { getCurrentGoal } = require("../utils/file");

async function propose(title, opts = {}) {
  try {
    if (!title || !String(title).trim()) {
      console.error(chalk.red("\n✗ Proposal title is required.\n"));
      process.exit(1);
    }

    const changeManager = new ChangeManager();
    const goal = opts.goal || (await getCurrentGoal());
    const author = opts.author || null;

    // Parse --specs flag (comma-separated domains)
    let specs = [];
    if (opts.specs) {
      specs = opts.specs
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const created = await changeManager.createChange(title.trim(), {
      goal,
      author,
      specs,
    });

    console.log(chalk.green("\n✓ Proposal scaffold created.\n"));
    console.log(chalk.cyan("ID: " + created.id));
    console.log(
      chalk.gray("Path: " + path.relative(process.cwd(), created.path))
    );
    console.log("");
    console.log(chalk.white("Next steps:"));
    console.log(
      chalk.white("  • Edit: ") +
        chalk.cyan(".teamwerx/changes/" + created.id + "/proposal.md")
    );
    console.log(
      chalk.white("  • Edit: ") +
        chalk.cyan(".teamwerx/changes/" + created.id + "/tasks.md")
    );

    if (specs.length > 0) {
      console.log(chalk.white("  • Edit spec deltas:"));
      specs.forEach((domain) => {
        console.log(
          chalk.white("    - ") +
            chalk.cyan(
              `.teamwerx/changes/${created.id}/specs/${domain}/spec.md`
            )
        );
      });
    }

    console.log(
      chalk.white("  • Review: ") +
        chalk.cyan("teamwerx changes show " + created.id)
    );
    console.log("");
  } catch (err) {
    console.error(
      chalk.red("Error creating proposal:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

async function listChanges() {
  try {
    const changeManager = new ChangeManager();
    const changes = await changeManager.listChanges();

    if (!changes.length) {
      console.log(chalk.yellow("\nNo changes found in .teamwerx/changes/\n"));
      return;
    }

    console.log("");
    for (const ch of changes) {
      const status = ch.status ? chalk.green(ch.status) : chalk.gray("unknown");
      const goal = ch.goal_id ? chalk.cyan(ch.goal_id) : chalk.gray("—");
      process.stdout.write(
        chalk.cyan(ch.id) +
          " " +
          chalk.white("-") +
          " " +
          chalk.bold(ch.title || "") +
          "\n"
      );
      process.stdout.write(
        "    Status: " + status + "    Goal: " + goal + "\n"
      );
    }
    console.log("");
  } catch (err) {
    console.error(
      chalk.red("Error listing changes:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

async function show(changeId) {
  try {
    if (!changeId || !String(changeId).trim()) {
      console.error(
        chalk.red(
          "\n✗ Change id (or slug) is required. Example: 001-add-feature\n"
        )
      );
      process.exit(1);
    }

    const changeManager = new ChangeManager();
    const change = await changeManager.readChange(changeId);

    console.log("");
    console.log(chalk.bold.cyan("Change: " + change.id));
    const title =
      change.proposal &&
      change.proposal.frontmatter &&
      change.proposal.frontmatter.title;
    const status =
      change.status && change.status.status ? change.status.status : "draft";
    console.log(
      chalk.white("Title: ") + (title ? chalk.green(title) : chalk.gray("—"))
    );
    console.log(chalk.white("Status: ") + chalk.yellow(status));
    if (
      change.proposal &&
      change.proposal.frontmatter &&
      change.proposal.frontmatter.goal_id
    ) {
      console.log(
        chalk.white("Goal: ") + chalk.cyan(change.proposal.frontmatter.goal_id)
      );
    }
    console.log("");

    if (change.proposal && change.proposal.body) {
      console.log(chalk.white("Proposal (excerpt):"));
      const excerpt = change.proposal.body.split(/\n/).slice(0, 10).join("\n");
      console.log(chalk.gray(excerpt));
      console.log("");
    }

    if (change.tasks) {
      console.log(chalk.white("Tasks:"));
      if (change.tasks.parsed && change.tasks.parsed.length) {
        for (const t of change.tasks.parsed) {
          process.stdout.write("  - ");
          process.stdout.write(chalk.white(t.title));
          if (t.idHint)
            process.stdout.write(chalk.gray(" (hint: " + t.idHint + ")"));
          process.stdout.write("\n");
        }
      } else if (change.tasks.body) {
        console.log(
          chalk.gray("(No structured tasks parsed, raw tasks.md follows)")
        );
        console.log(chalk.gray(change.tasks.body));
      } else {
        console.log(chalk.gray("(No tasks.md found)"));
      }
      console.log("");
    }

    if (change.spec && change.spec.body) {
      console.log(chalk.white("Spec delta (excerpt):"));
      const excerpt = change.spec.body.split(/\n/).slice(0, 8).join("\n");
      console.log(chalk.gray(excerpt));
      console.log("");
    }

    console.log(chalk.white("Files:"));
    console.log(
      "  " +
        chalk.cyan(
          path.relative(process.cwd(), path.join(change.path, "proposal.md"))
        )
    );
    console.log(
      "  " +
        chalk.cyan(
          path.relative(process.cwd(), path.join(change.path, "tasks.md"))
        )
    );
    console.log(
      "  " +
        chalk.cyan(
          path.relative(process.cwd(), path.join(change.path, "spec-delta.md"))
        )
    );
    console.log("");
  } catch (err) {
    console.error(
      chalk.red("Error showing change:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

async function apply(changeId, opts = {}) {
  try {
    if (!changeId || !String(changeId).trim()) {
      console.error(chalk.red("\n✗ Change id (or slug) is required.\n"));
      process.exit(1);
    }

    // Minimal diagnostics to help debug e2e failures: log the incoming args and cwd.
    // These messages are intentionally written to stderr so they appear in CI/test logs.
    // eslint-disable-next-line no-console
    console.error(
      chalk.magenta(
        `[changes.apply] cwd=${process.cwd()} changeId=${String(
          changeId
        )} opts=${JSON.stringify(opts || {})}`
      )
    );

    const changeManager = new ChangeManager();

    const goal = opts.goal || (await getCurrentGoal());
    const dryRun = !!opts.dryRun;
    const createImplementations = opts.createImplementations !== false; // default true

    // Validate change first
    const validation = await changeManager.validateChange(changeId);
    if (!validation.valid) {
      console.log(
        chalk.yellow("\nWarning: change validation reported issues:")
      );
      validation.errors.forEach((e) => console.log(chalk.yellow("  • " + e)));
      console.log("");
      const answer = await prompts.prompt([
        {
          type: "confirm",
          name: "proceed",
          message: "Proceed to apply despite validation issues?",
          default: false,
        },
      ]);
      if (!answer.proceed) {
        console.log(chalk.yellow("\nApply cancelled.\n"));
        return;
      }
    }

    if (dryRun) {
      const preview = await changeManager.readChange(changeId);
      const taskTitles =
        (preview.tasks &&
          preview.tasks.parsed &&
          preview.tasks.parsed.map((t) => t.title)) ||
        [];
      console.log(chalk.blue("\nDry run: tasks that would be added:"));
      taskTitles.forEach((t) => console.log(chalk.white("  - " + t)));
      console.log("");
      return;
    }

    // Confirm unless --yes provided
    if (!opts.yes) {
      const answer = await prompts.prompt([
        {
          type: "confirm",
          name: "confirmApply",
          message:
            "Apply change " +
            changeId +
            " to goal " +
            (goal || "<unspecified>") +
            "?",
          default: false,
        },
      ]);
      if (!answer.confirmApply) {
        console.log(chalk.yellow("\nApply cancelled.\n"));
        return;
      }
    }

    const result = await changeManager.applyChange(changeId, {
      goal,
      createImplementations,
    });

    console.log(chalk.green("\n✓ Change applied successfully.\n"));
    console.log(chalk.white("Summary:"));
    console.log(chalk.white("  • Change: ") + chalk.cyan(result.changeId));
    console.log(chalk.white("  • Goal:   ") + chalk.cyan(result.goal));
    console.log(
      chalk.white("  • Tasks added: ") +
        chalk.green(result.addedTasks.join(", "))
    );
    console.log("");
  } catch (err) {
    console.error(
      chalk.red("Error applying change:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

async function archive(changeId, opts = {}) {
  try {
    if (!changeId || !String(changeId).trim()) {
      console.error(
        chalk.red("\n✗ Change id (or slug) is required to archive.\n")
      );
      process.exit(1);
    }

    const changeManager = new ChangeManager();

    // Confirm unless --yes
    if (!opts.yes) {
      let message = "Archive change " + changeId + "?";
      if (opts.mergeSpecs) {
        message += " (will merge spec deltas into project specs)";
      }

      const answer = await prompts.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: message,
          default: false,
        },
      ]);
      if (!answer.confirm) {
        console.log(chalk.yellow("\nArchive cancelled.\n"));
        return;
      }
    }

    const res = await changeManager.archiveChange(changeId, {
      notifyGoal: !!opts.notify,
      goal: opts.goal,
      mergeSpecs: !!opts.mergeSpecs,
      force: !!opts.force,
      dryRun: !!opts.dryRun,
    });

    if (opts.dryRun) {
      console.log(chalk.blue("\n✓ Dry run completed.\n"));
      if (res.mergeResult) {
        console.log(chalk.white("Spec merge preview:"));
        console.log(
          chalk.white("  • Domains: ") +
            chalk.cyan(
              res.mergeResult.domains_merged.map((d) => d.domain).join(", ")
            )
        );

        res.mergeResult.domains_merged.forEach((dm) => {
          const ops = dm.operations_applied;
          const total = ops.ADDED + ops.MODIFIED + ops.REMOVED;
          console.log(
            chalk.white(`  • ${dm.domain}: `) +
              chalk.green(`${ops.ADDED} added, `) +
              chalk.yellow(`${ops.MODIFIED} modified, `) +
              chalk.red(`${ops.REMOVED} removed`)
          );
        });

        if (res.mergeResult.conflicts.length > 0) {
          console.log(chalk.yellow("\n  Conflicts detected:"));
          res.mergeResult.conflicts.forEach((c) => {
            console.log(chalk.yellow(`    • ${c.message}`));
          });
        }
      }
      console.log(chalk.dim("\nNo files were modified (dry-run mode).\n"));
      return;
    }

    console.log(chalk.green("\n✓ Change archived.\n"));
    console.log(
      chalk.white("From: ") + chalk.cyan(path.relative(process.cwd(), res.from))
    );
    console.log(
      chalk.white("To:   ") + chalk.cyan(path.relative(process.cwd(), res.to))
    );

    if (res.mergeResult) {
      console.log(chalk.white("\nSpec merge results:"));
      console.log(
        chalk.white("  • Domains merged: ") +
          chalk.cyan(
            res.mergeResult.domains_merged.map((d) => d.domain).join(", ")
          )
      );

      res.mergeResult.domains_merged.forEach((dm) => {
        const ops = dm.operations_applied;
        console.log(
          chalk.white(`  • ${dm.domain}: `) +
            chalk.green(`${ops.ADDED} added, `) +
            chalk.yellow(`${ops.MODIFIED} modified, `) +
            chalk.red(`${ops.REMOVED} removed`)
        );

        if (dm.diverged) {
          console.log(chalk.yellow(`    ⚠ Spec had diverged (used --force)`));
        }
      });

      if (res.mergeResult.warnings.length > 0) {
        console.log(chalk.yellow("\nWarnings:"));
        res.mergeResult.warnings.forEach((w) => {
          console.log(chalk.yellow(`  • ${w}`));
        });
      }
    }

    console.log("");
  } catch (err) {
    console.error(
      chalk.red("Error archiving change:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

async function sync(changeId, opts = {}) {
  try {
    if (!changeId || !String(changeId).trim()) {
      console.error(chalk.red("\n✗ Change id (or slug) is required.\n"));
      process.exit(1);
    }

    const changeManager = new ChangeManager();
    const result = await changeManager.syncChange(changeId, {
      update: !!opts.update,
    });

    if (!result.hasSpecs) {
      console.log(chalk.yellow("\n⚠ This change has no spec fingerprints.\n"));
      console.log(
        chalk.dim(
          "Spec tracking is only available for changes created with --specs flag.\n"
        )
      );
      return;
    }

    console.log(chalk.bold.cyan(`\nSpec Sync: ${changeId}\n`));
    console.log(chalk.dim("─".repeat(60)));

    for (const domain of result.domains) {
      if (domain.error) {
        console.log(
          chalk.red(`✗ ${domain.domain}: `) + chalk.dim(domain.error)
        );
        continue;
      }

      const status = domain.diverged
        ? chalk.yellow("DIVERGED")
        : chalk.green("OK");

      console.log(chalk.white(`${domain.domain}: ${status}`));

      if (domain.diverged) {
        console.log(chalk.dim(`  Base:    ${domain.base_fingerprint}`));
        console.log(chalk.dim(`  Current: ${domain.current_fingerprint}`));
      }
    }

    console.log(chalk.dim("─".repeat(60)));

    if (result.diverged) {
      console.log(
        chalk.yellow("\n⚠ Specs have diverged since this change was created.\n")
      );

      if (result.updated) {
        console.log(chalk.green("✓ Fingerprints updated to current values.\n"));
      } else {
        console.log(chalk.white("Options:"));
        console.log(
          chalk.white("  1. Update fingerprints: ") +
            chalk.cyan(`teamwerx changes sync ${changeId} --update`)
        );
        console.log(
          chalk.white("  2. Force merge on archive: ") +
            chalk.cyan(
              `teamwerx changes archive ${changeId} --merge-specs --force`
            )
        );
        console.log(
          chalk.white("  3. Manually resolve conflicts in spec delta files\n")
        );
      }
    } else {
      console.log(chalk.green("\n✓ All specs are in sync.\n"));
    }
  } catch (err) {
    console.error(
      chalk.red("Error syncing change:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

async function validate(changeId, opts = {}) {
  try {
    if (!changeId || !String(changeId).trim()) {
      console.error(chalk.red("\n✗ Change id (or slug) is required.\n"));
      process.exit(1);
    }

    const changeManager = new ChangeManager();
    const change = await changeManager.readChange(changeId);

    console.log(chalk.bold.cyan(`\nValidating Change: ${changeId}\n`));
    console.log(chalk.dim("─".repeat(60)));

    // 1. Validate basic change structure
    const basicValidation = await changeManager.validateChange(changeId);

    console.log(chalk.bold("Basic Structure:"));
    if (basicValidation.valid) {
      console.log(chalk.green("  ✓ Proposal exists"));
      console.log(chalk.green("  ✓ Tasks exist"));
      console.log(
        chalk.green(`  ✓ ${change.tasks.parsed.length} task(s) found`)
      );
    } else {
      console.log(chalk.red("  ✗ Validation failed:"));
      basicValidation.errors.forEach((e) => {
        console.log(chalk.red(`    • ${e}`));
      });
    }

    console.log("");

    // 2. Validate spec deltas if present
    const hasSpecFingerprints = change.proposal?.frontmatter?.spec_fingerprints;

    if (!hasSpecFingerprints) {
      console.log(
        chalk.dim(
          "No spec deltas to validate (change created without --specs flag)"
        )
      );
      console.log("");

      if (basicValidation.valid) {
        console.log(chalk.green("✓ Change is valid\n"));
      } else {
        console.log(chalk.red("✗ Change has validation errors\n"));
        process.exit(1);
      }
      return;
    }

    console.log(chalk.bold("Spec Deltas:"));

    const { SpecDeltaParser } = require("../core/spec-delta-parser");
    const { SpecManager } = require("../core/spec-manager");
    const deltaParser = new SpecDeltaParser();
    const specManager = new SpecManager();

    const fs = require("fs").promises;
    const specsDir = path.join(change.path, "specs");

    let specValidationPassed = true;

    try {
      const entries = await fs.readdir(specsDir, { withFileTypes: true });
      const domains = entries.filter((e) => e.isDirectory()).map((e) => e.name);

      if (domains.length === 0) {
        console.log(chalk.yellow("  ⚠ No spec domains found in change"));
        specValidationPassed = false;
      }

      for (const domain of domains) {
        const deltaPath = path.join(specsDir, domain, "spec.md");

        try {
          // Parse delta
          const delta = await deltaParser.parseDeltaFile(deltaPath);

          // Validate delta structure
          const validation = deltaParser.validateDelta(delta);

          if (validation.valid) {
            const totalOps =
              delta.operations.ADDED.length +
              delta.operations.MODIFIED.length +
              delta.operations.REMOVED.length;

            console.log(
              chalk.green(`  ✓ ${domain}: `) +
                chalk.dim(`${totalOps} operation(s) - `) +
                chalk.green(`${delta.operations.ADDED.length} added, `) +
                chalk.yellow(`${delta.operations.MODIFIED.length} modified, `) +
                chalk.red(`${delta.operations.REMOVED.length} removed`)
            );

            // Check for internal conflicts
            const conflicts = deltaParser.findConflicts(delta);
            if (conflicts.length > 0) {
              console.log(chalk.red(`    ✗ Internal conflicts found:`));
              conflicts.forEach((c) => {
                console.log(chalk.red(`      • ${c.message}`));
              });
              specValidationPassed = false;
            }
          } else {
            console.log(chalk.red(`  ✗ ${domain}: Invalid delta`));
            validation.errors.forEach((e) => {
              console.log(chalk.red(`    • ${e}`));
            });
            specValidationPassed = false;
          }

          // Check if base spec still exists
          const baseSpecExists = await specManager.specExists(domain);
          if (!baseSpecExists) {
            console.log(
              chalk.yellow(`    ⚠ Base spec '${domain}' not found in project`)
            );
          }
        } catch (err) {
          console.log(chalk.red(`  ✗ ${domain}: ${err.message}`));
          specValidationPassed = false;
        }
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log(chalk.yellow("  ⚠ No specs directory found in change"));
        specValidationPassed = false;
      } else {
        throw err;
      }
    }

    console.log("");

    // 3. Check for spec divergence
    const syncResult = await changeManager.syncChange(changeId);

    if (syncResult.hasSpecs && syncResult.diverged) {
      console.log(chalk.bold("Spec Divergence:"));
      console.log(
        chalk.yellow("  ⚠ Specs have diverged since change was created")
      );

      syncResult.domains.forEach((d) => {
        if (d.diverged) {
          console.log(chalk.yellow(`    • ${d.domain}: fingerprint mismatch`));
        }
      });

      console.log(
        chalk.dim("\n  Run: ") + chalk.cyan(`teamwerx changes sync ${changeId}`)
      );
      console.log("");
    }

    // Final verdict
    console.log(chalk.dim("─".repeat(60)));

    if (basicValidation.valid && specValidationPassed) {
      console.log(chalk.green("\n✓ Change validation passed\n"));

      if (syncResult.diverged) {
        console.log(
          chalk.yellow(
            "Note: Specs have diverged. Consider running sync before archiving.\n"
          )
        );
      }
    } else {
      console.log(chalk.red("\n✗ Change validation failed\n"));
      process.exit(1);
    }
  } catch (err) {
    console.error(
      chalk.red("Error validating change:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

async function resolve(changeId, opts = {}) {
  try {
    if (!changeId || !String(changeId).trim()) {
      console.error(chalk.red("\n✗ Change id (or slug) is required.\n"));
      process.exit(1);
    }

    const changeManager = new ChangeManager();
    const result = await changeManager.resolveConflict(changeId, opts);

    console.log(result);
  } catch (err) {
    console.error(
      chalk.red("Error resolving conflicts:"),
      err && err.message ? err.message : err
    );
    process.exit(1);
  }
}

module.exports = {
  propose,
  list: listChanges,
  show,
  apply,
  archive,
  sync,
  validate,
  resolve,
};
