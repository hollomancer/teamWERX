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
const inquirer = require("inquirer");
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

    const created = await changeManager.createChange(title.trim(), {
      goal,
      author,
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
      const answer = await inquirer.prompt([
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
      const answer = await inquirer.prompt([
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
      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "Archive change " +
            changeId +
            "? This will move it to .teamwerx/archive/changes/",
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
    });

    console.log(chalk.green("\n✓ Change archived.\n"));
    console.log(
      chalk.white("From: ") + chalk.cyan(path.relative(process.cwd(), res.from))
    );
    console.log(
      chalk.white("To:   ") + chalk.cyan(path.relative(process.cwd(), res.to))
    );
    console.log("");
  } catch (err) {
    console.error(
      chalk.red("Error archiving change:"),
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
};
