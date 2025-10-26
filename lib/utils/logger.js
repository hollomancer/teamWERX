/**
 * Simple logger utility for teamWERX
 *
 * - Controlled by environment:
 *   - TEAMWERX_DEBUG=true -> enables debug-level logs
 *   - TEAMWERX_LOG_LEVEL=debug|info|warn|error -> sets explicit level
 *   - TEAMWERX_LOG_JSON=true -> emit JSON structured logs (good for CI)
 *   - TEAMWERX_SILENT=true -> disable all logging
 *
 * - Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('Started %s', name);
 *
 *   // Namespaced child logger
 *   const ns = logger.create('core.change-manager');
 *   ns.debug('something');
 */

const chalk = require('chalk');
const { format } = require('util');

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LEVEL = process.env.TEAMWERX_DEBUG ? 'debug' : 'info';

function resolveLevel() {
  const env = (process.env.TEAMWERX_LOG_LEVEL || DEFAULT_LEVEL).toString().toLowerCase();
  if (LEVELS[env]) return env;
  return DEFAULT_LEVEL;
}

const CURRENT_LEVEL = resolveLevel();
const IS_JSON = !!process.env.TEAMWERX_LOG_JSON;
const IS_SILENT = !!process.env.TEAMWERX_SILENT;

/**
 * Build timestamp in ISO format (short)
 */
function ts() {
  return new Date().toISOString();
}

/**
 * Decide if a message at `level` should be logged
 */
function shouldLog(level) {
  if (IS_SILENT) return false;
  const req = LEVELS[level] || LEVELS.info;
  const cur = LEVELS[CURRENT_LEVEL] || LEVELS.info;
  return req >= cur;
}

/**
 * Format a plain text message; color is optional.
 */
function formatText(level, namespace, args) {
  const message = format.apply(null, args);
  const prefix = `[teamWERX]${namespace ? ' ' + namespace : ''}`;
  const time = ts();
  let levelLabel = level.toUpperCase();

  // Small color mapping
  switch (level) {
    case 'debug':
      levelLabel = chalk.magenta(levelLabel);
      break;
    case 'info':
      levelLabel = chalk.cyan(levelLabel);
      break;
    case 'warn':
      levelLabel = chalk.yellow(levelLabel);
      break;
    case 'error':
      levelLabel = chalk.red(levelLabel);
      break;
    default:
      break;
  }

  return `${chalk.gray(time)} ${levelLabel} ${chalk.gray(prefix)} ${message}`;
}

/**
 * Format a JSON structured log
 */
function formatJSON(level, namespace, args) {
  const message = format.apply(null, args);
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    namespace: namespace || null,
    message,
    pid: process.pid,
  };
  return JSON.stringify(payload);
}

/**
 * Core logger implementation factory
 */
function createLogger(namespace) {
  function log(level, args) {
    if (!shouldLog(level)) return;
    try {
      const out = IS_JSON ? formatJSON(level, namespace, args) : formatText(level, namespace, args);

      // Route errors/warns to stderr, others to stdout
      if (level === 'error' || level === 'warn') {
        // Keep simple writing to console so tests can capture output
        console.error(out);
      } else {
        console.log(out);
      }
    } catch (err) {
      // If logger itself fails, fallback gracefully but do not throw
      // eslint-disable-next-line no-console
      console.error('[teamWERX][logger] logger failure:', err && err.message ? err.message : err);
    }
  }

  return {
    debug: (...args) => log('debug', args),
    info: (...args) => log('info', args),
    warn: (...args) => log('warn', args),
    error: (...args) => log('error', args),
    create: (subNs) => createLogger(namespace ? `${namespace}.${subNs}` : subNs),
    // Expose helpers for tests/consumers
    _shouldLog: shouldLog,
  };
}

// Export default root logger and factory
const rootLogger = createLogger('');
module.exports = rootLogger;
module.exports.create = (ns) => createLogger(ns);
module.exports.LEVELS = LEVELS;
