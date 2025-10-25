/**
 * Reflect (wrapper)
 *
 * Lightweight wrapper that records a reflection entry in the discussion log.
 * This implementation delegates to the DiscussionManager and creates an entry
 * with `type: "reflection"`. It's intentionally small and non-interactive so
 * it can be used directly by scripts or when invoked programmatically.
 */

const chalk = require("chalk");
const { getCurrentGoal } = require("../utils/file");
const { GoalWorkspaceManager } = require("../core/goal-workspace-manager");
const { DiscussionManager } = require("../core/discussion-manager");

/**
 * Add a reflection entry.
 * @param {object|string} options - If a string is passed, it's used as notes.
 *                                  If an object, may contain { goal, notes, inspire, dryRun }.
 */
async function reflect(options = {}) {
  // Support calling reflect with a simple notes string
  if (typeof options === "string") {
    options = { notes: options };
  }

  const goal = options.goal || (await getCurrentGoal());

  if (!goal) {
    console.error(
      chalk.red("\n✗ Error: No goal specified and no current goal set.")
    );
    console.log(
      chalk.gray("Set a current goal with: ") +
        chalk.cyan("teamwerx use <goal-name>\n")
    );
    process.exit(1);
  }

  const workspace = await GoalWorkspaceManager.getWorkspaceForGoal(goal);
  const discussion = new DiscussionManager(workspace);
  await discussion.load();

  // If the caller requested inspiration, create an 'inspiration' entry instead.
  if (options.inspire) {
    const content = options.notes || "Auto-generated inspiration requested.";
    const entry = discussion.addEntry({ type: "inspiration", content });
    await discussion.save();
    console.log(
      chalk.green(
        `\n✓ Added inspiration entry ${entry.id} for ${workspace.title}.\n`
      )
    );
    return;
  }

  // Dry-run: record a dry-run note in the discussion log (non-interactive).
  if (options.dryRun) {
    const content =
      options.notes || "Dry-run reflection recorded (no changes applied).";
    const entry = discussion.addEntry({ type: "dry-run", content });
    await discussion.save();
    console.log(
      chalk.green(
        `\n✓ Added dry-run entry ${entry.id} for ${workspace.title}.\n`
      )
    );
    return;
  }

  // Default: add a reflection entry
  const reflectionTemplate =
    options.notes ||
    `**What Worked:**
<!-- Successful approaches, helpful patterns, effective strategies -->

**What Didn't Work:**
<!-- Challenges, blockers, unexpected complications -->

**Adaptations Made:**
<!-- Changes to approach, plan adjustments, lessons learned -->

**Next Steps:**
<!-- Action items, follow-up questions, areas needing attention -->`;

  const entry = discussion.addEntry({
    type: "reflection",
    content: reflectionTemplate,
  });

  await discussion.save();

  console.log(
    chalk.green(
      `\n✓ Added reflection entry ${entry.id} for ${workspace.title}.\n`
    )
  );
  console.log(
    chalk.gray("\nEdit the reflection in: ") + chalk.cyan(workspace.discussPath)
  );
  console.log(
    chalk.gray("Complete the reflection sections before continuing.\n")
  );
}

module.exports = reflect;
