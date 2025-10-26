/**
 * CI Prompt Shim
 *
 * This module provides a small shim to make `inquirer.prompt` non-interactive
 * when running under CI/test environments. If the environment variable
 * `TEAMWERX_CI` is truthy, the module will patch `inquirer.prompt` so that
 * prompts are automatically answered using sensible defaults.
 *
 * Usage:
 *   // require and install early in startup (e.g., in bin/teamwerx.js or test setup)
 *   require('../lib/utils/ci-prompt').install();
 *
 * Behavior:
 * - For `input` prompts: returns the `default` if provided, otherwise `''`.
 * - For `confirm` prompts: returns the `default` if provided, otherwise `true`.
 * - For `list`/`rawlist`/`expand` prompts: returns the value of the first choice.
 * - For `checkbox` prompts: returns the `default` if provided, otherwise an array
 *   containing the first choice value.
 * - If a question `default` is a function it will be invoked with the current
 *   answers as input (mirroring inquirer behavior).
 *
 * The shim is intentionally conservative: it returns sensible defaults rather
 * than trying to be clever. This keeps CLI code unchanged while allowing tests
 * and CI to exercise flows that would otherwise prompt interactively.
 */

function _choiceValue(choice) {
  // choice may be a primitive or an object: { name, value, short }
  if (choice && typeof choice === "object") {
    if ("value" in choice) return choice.value;
    if ("name" in choice) return choice.name;
    // fallback to stringified form
    return String(choice);
  }
  return choice;
}

function _normalizeQuestions(questions) {
  if (Array.isArray(questions)) return questions;
  if (questions && typeof questions === "object") return [questions];
  // unknown shape: return empty array
  return [];
}

function autoAnswersForQuestions(questions) {
  const qlist = _normalizeQuestions(questions);
  const answers = {};

  for (const q of qlist) {
    // Skip any malformed question objects
    if (!q || typeof q !== "object") continue;

    const name = q.name || q.key || null;
    // If no name, we can't return a useful mapping for inquirer-consumers;
    // skip these (rare).
    if (!name) continue;

    // Determine default value (may be function)
    let def = q.default;
    if (typeof def === "function") {
      try {
        def = def(answers);
      } catch (err) {
        // If default function throws, ignore and fall back later.
        def = undefined;
      }
    }

    const type = (q.type || "input").toString().toLowerCase();

    switch (type) {
      case "confirm":
        if (typeof def !== "undefined") {
          answers[name] = Boolean(def);
        } else {
          // Default to true in CI for ease of automation
          answers[name] = true;
        }
        break;

      case "checkbox": {
        if (typeof def !== "undefined") {
          answers[name] = def;
        } else if (Array.isArray(q.choices) && q.choices.length > 0) {
          // choose the first choice's value as a single-element array
          answers[name] = [_choiceValue(q.choices[0])];
        } else {
          answers[name] = [];
        }
        break;
      }

      case "list":
      case "rawlist":
      case "expand": {
        if (typeof def !== "undefined") {
          answers[name] = def;
        } else if (Array.isArray(q.choices) && q.choices.length > 0) {
          answers[name] = _choiceValue(q.choices[0]);
        } else {
          answers[name] = null;
        }
        break;
      }

      case "input":
      case "number":
      case "editor":
      default:
        // For input-like prompts prefer explicit default, else sensible empty value
        if (typeof def !== "undefined") {
          answers[name] = def;
        } else {
          if (type === "number") answers[name] = 0;
          else answers[name] = "";
        }
        break;
    }
  }

  return answers;
}

/**
 * Install the CI prompt shim.
 *
 * When TEAMWERX_CI is set (any truthy value), attempt to require `inquirer`
 * and replace `inquirer.prompt` with a function that returns auto-answers
 * for the supplied questions. If `inquirer` is not available, this function
 * is a no-op.
 *
 * Returns the original `inquirer.prompt` if installed, otherwise null.
 */
function install() {
  const ciEnabled = !!process.env.TEAMWERX_CI;
  if (!ciEnabled) return null;

  let inquirer;
  try {
    // require inquirer dynamically; if not present, bail quietly.
    // Consumers of this module should ensure inquirer is a dependency.
    // eslint-disable-next-line global-require
    inquirer = require("inquirer");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[teamWERX][ci-prompt] TEAMWERX_CI set but inquirer not available: ${err.message}`
    );
    return null;
  }

  if (!inquirer || typeof inquirer.prompt !== "function") {
    // eslint-disable-next-line no-console
    console.error(
      "[teamWERX][ci-prompt] inquirer.prompt is not a function - skipping CI shim"
    );
    return null;
  }

  const originalPrompt = inquirer.prompt;

  // Patch prompt
  inquirer.prompt = async (questions) => {
    try {
      // Compute answers synchronously (so no hairy async default functions)
      const answers = autoAnswersForQuestions(questions);

      // Return answers in the same shape as inquirer (an object mapping)
      return answers;
    } catch (err) {
      // If anything goes wrong, fall back to the original prompt (safer).
      return originalPrompt.call(inquirer, questions);
    }
  };

  // Return the original to allow restoring if necessary
  return originalPrompt;
}

module.exports = {
  install,
  autoAnswersForQuestions,
};
