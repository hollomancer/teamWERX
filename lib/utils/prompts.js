/**
 * prompts.js
 *
 * Lightweight prompts wrapper for teamWERX that delegates to `inquirer`.
 * Provides:
 *  - `prompt(questions)` -> calls `inquirer.prompt(questions)` (normal flow)
 *  - `install()` -> when `TEAMWERX_CI` is set, installs a CI shim (delegates
 *                   to `lib/utils/ci-prompt.js` when available) so prompts
 *                   become non-interactive in CI/test environments.
 *  - `restore()` -> attempts to restore the original `inquirer.prompt`
 *  - `autoAnswersForQuestions(questions)` -> helper to compute auto-answers
 *                                            (delegates to ci-prompt if present,
 *                                             otherwise uses a conservative fallback)
 *
 * The wrapper keeps the surface area small so commands import `../utils/prompts`
 * and call `await prompts.prompt([...])` rather than requiring `inquirer`
 * directly. This makes it simpler to control prompting behavior in tests/CI.
 */

const util = require('util');

let inquirer;
let originalPrompt = null;
let shimInstalled = false;

/**
 * Try to require inquirer lazily.
 * Throws a helpful error if inquirer is not available.
 */
function ensureInquirer() {
  if (inquirer) return inquirer;
  try {
    // require inquirer at runtime so light-weight invocations of CLI avoid loading it
    // until actually needed.
    // eslint-disable-next-line global-require
    inquirer = require('inquirer');
    return inquirer;
  } catch (err) {
    const message =
      'inquirer is required for interactive prompts. Install it with: npm install inquirer';
    const e = new Error(message);
    e.cause = err;
    throw e;
  }
}

/**
 * Fallback auto-answer implementation (conservative).
 * Mirrors the behavior in lib/utils/ci-prompt when that module is not available.
 * @param {Object|Array} questions
 * @returns {Object} answers mapping
 */
function fallbackAutoAnswersForQuestions(questions) {
  const qlist = Array.isArray(questions) ? questions : questions && typeof questions === 'object' ? [questions] : [];
  const answers = {};
  for (const q of qlist) {
    if (!q || typeof q !== 'object') continue;
    const name = q.name || q.key || null;
    if (!name) continue;
    let def = q.default;
    if (typeof def === 'function') {
      try {
        def = def(answers);
      } catch (e) {
        def = undefined;
      }
    }
    const type = (q.type || 'input').toString().toLowerCase();
    switch (type) {
      case 'confirm':
        answers[name] = typeof def !== 'undefined' ? Boolean(def) : true;
        break;
      case 'checkbox':
        if (typeof def !== 'undefined') {
          answers[name] = def;
        } else if (Array.isArray(q.choices) && q.choices.length > 0) {
          const choice = q.choices[0];
          if (choice && typeof choice === 'object') {
            answers[name] = [choice.value !== undefined ? choice.value : choice.name];
          } else {
            answers[name] = [choice];
          }
        } else {
          answers[name] = [];
        }
        break;
      case 'list':
      case 'rawlist':
      case 'expand':
        if (typeof def !== 'undefined') answers[name] = def;
        else if (Array.isArray(q.choices) && q.choices.length > 0) {
          const choice = q.choices[0];
          answers[name] = choice && typeof choice === 'object' ? (choice.value !== undefined ? choice.value : choice.name) : choice;
        } else {
          answers[name] = null;
        }
        break;
      case 'number':
        answers[name] = typeof def !== 'undefined' ? def : 0;
        break;
      case 'input':
      case 'editor':
      default:
        answers[name] = typeof def !== 'undefined' ? def : '';
        break;
    }
  }
  return answers;
}

/**
 * Compute auto-answers for questions. If the ci-prompt module exists, prefer its implementation.
 * @param {Object|Array} questions
 * @returns {Object}
 */
function autoAnswersForQuestions(questions) {
  try {
    // eslint-disable-next-line global-require
    const ciPrompt = require('./ci-prompt');
    if (ciPrompt && typeof ciPrompt.autoAnswersForQuestions === 'function') {
      return ciPrompt.autoAnswersForQuestions(questions);
    }
  } catch (err) {
    // ignore and fall back
  }
  return fallbackAutoAnswersForQuestions(questions);
}

/**
 * Prompt function that delegates to inquirer.prompt.
 * If TEAMWERX_CI is set and install() was called, inquirer.prompt may already be patched.
 * @param {Object|Array} questions
 * @returns {Promise<Object>}
 */
async function prompt(questions) {
  const iq = ensureInquirer();
  if (!iq || typeof iq.prompt !== 'function') {
    throw new Error('inquirer.prompt is not available');
  }
  // Return whatever inquirer returns (usually a Promise resolving to answers)
  return iq.prompt(questions);
}

/**
 * Install CI shim for prompts.
 *
 * If TEAMWERX_CI is set, attempt to require the local `lib/utils/ci-prompt` module
 * (which computes auto-answers). If present, call its `install()` to patch inquirer.
 *
 * Returns the original prompt function if one was patched, otherwise null.
 */
function install() {
  const ciEnabled = !!process.env.TEAMWERX_CI;
  if (!ciEnabled) return null;

  try {
    ensureInquirer();
  } catch (err) {
    // If inquirer isn't available yet, we still attempt to install shim via ci-prompt
    // because ci-prompt may itself require inquirer when it runs.
  }

  let ciPromptModule = null;
  try {
    // eslint-disable-next-line global-require
    ciPromptModule = require('./ci-prompt');
  } catch (err) {
    // If our local ci shim is not present, we still can try to patch inquirer directly
    ciPromptModule = null;
  }

  try {
    const iq = ensureInquirer();
    if (!iq || typeof iq.prompt !== 'function') return null;

    // Save original prompt for restore()
    if (!originalPrompt) originalPrompt = iq.prompt;

    if (ciPromptModule && typeof ciPromptModule.install === 'function') {
      // Let the ci-prompt module manage the patch and logging (preferred)
      const orig = ciPromptModule.install();
      shimInstalled = true;
      // If the ciPrompt returned the original prompt, record it for restore
      if (orig && typeof orig === 'function' && !originalPrompt) originalPrompt = orig;
      return orig || originalPrompt;
    }

    // Fallback: patch inquirer.prompt to return auto-answers computed here
    iq.prompt = async (questions) => {
      try {
        const answers = autoAnswersForQuestions(questions);
        // Keep behavior consistent: return an object mapping
        return answers;
      } catch (err) {
        // If fallback fails, call original prompt
        if (originalPrompt && typeof originalPrompt === 'function') {
          return originalPrompt.call(iq, questions);
        }
        // As last resort, throw
        throw err;
      }
    };

    shimInstalled = true;
    return originalPrompt;
  } catch (err) {
    // Installation failed; do not throw — commands should still be usable interactively.
    return null;
  }
}

/**
 * Restore original inquirer.prompt if we patched it.
 */
function restore() {
  try {
    if (!originalPrompt) return null;
    // eslint-disable-next-line global-require
    const iq = require('inquirer');
    if (iq && typeof iq.prompt === 'function' && iq.prompt !== originalPrompt) {
      iq.prompt = originalPrompt;
    }
    shimInstalled = false;
    const orig = originalPrompt;
    originalPrompt = null;
    return orig;
  } catch (err) {
    return null;
  }
}

module.exports = {
  prompt,
  install,
  restore,
  autoAnswersForQuestions,
  // expose fallback for tests
  _fallbackAutoAnswersForQuestions: fallbackAutoAnswersForQuestions,
  _shimInstalled: () => shimInstalled,
};
