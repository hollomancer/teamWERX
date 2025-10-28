/**
 * Spec management commands
 *
 * Commands:
 * - specs init - Initialize .teamwerx/specs directory
 * - specs create <domain> - Create a new spec domain
 * - specs list - List all spec domains with fingerprints
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const { SpecManager } = require('../core/spec-manager');

/**
 * Initialize specs directory
 */
async function initSpecs() {
  const specManager = new SpecManager();

  try {
    await specManager.initialize();
    console.log(chalk.green('✓ Initialized .teamwerx/specs directory'));
    console.log(
      chalk.dim('\nCreate your first spec with: teamwerx specs create <domain>')
    );
  } catch (err) {
    console.error(chalk.red(`✗ Failed to initialize specs: ${err.message}`));
    throw err;
  }
}

/**
 * Create a new spec domain
 * @param {string} domain - Domain name
 * @param {Object} options - Options
 * @param {string} options.title - Optional custom title
 */
async function createSpec(domain, options = {}) {
  const specManager = new SpecManager();

  try {
    const specPath = await specManager.createSpec(domain, {
      title: options.title,
    });

    console.log(chalk.green(`✓ Created spec: ${domain}`));
    console.log(chalk.dim(`  Path: ${specPath}`));
    console.log(
      chalk.dim('\nEdit the spec file to define requirements and scenarios.')
    );
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.error(chalk.red(`✗ Spec '${domain}' already exists`));
    } else {
      console.error(chalk.red(`✗ Failed to create spec: ${err.message}`));
    }
    throw err;
  }
}

/**
 * List all spec domains
 * @param {Object} options - Options
 * @param {boolean} options.verbose - Show detailed information
 */
async function listSpecs(options = {}) {
  const specManager = new SpecManager();

  try {
    const specs = await specManager.listSpecs();

    if (specs.length === 0) {
      console.log(chalk.yellow('No specs found.'));
      console.log(
        chalk.dim('\nCreate your first spec with: teamwerx specs create <domain>')
      );
      return;
    }

    if (options.verbose) {
      // Verbose table with all details
      const table = new Table({
        head: ['Domain', 'Updated', 'Fingerprint', 'Requirements'],
        colWidths: [20, 28, 18, 15],
      });

      for (const spec of specs) {
        table.push([
          chalk.cyan(spec.domain),
          spec.updated || 'N/A',
          chalk.dim(spec.fingerprint),
          spec.requirement_count,
        ]);
      }

      console.log('\n' + table.toString());
    } else {
      // Simple list
      console.log(chalk.bold('\nSpec Domains:\n'));
      for (const spec of specs) {
        console.log(
          `  ${chalk.cyan(spec.domain)} ${chalk.dim(
            `(${spec.requirement_count} requirements)`
          )}`
        );
      }
      console.log(
        chalk.dim('\nUse --verbose flag for detailed information.')
      );
    }
  } catch (err) {
    console.error(chalk.red(`✗ Failed to list specs: ${err.message}`));
    throw err;
  }
}

/**
 * Show details of a specific spec
 * @param {string} domain - Domain name
 */
async function showSpec(domain) {
  const specManager = new SpecManager();

  try {
    const spec = await specManager.readSpec(domain);

    console.log(chalk.bold.cyan(`\nSpec: ${spec.domain}`));
    console.log(chalk.dim('─'.repeat(60)));
    console.log(chalk.bold('Updated:'), spec.data.updated || 'N/A');
    console.log(chalk.bold('Fingerprint:'), chalk.dim(spec.fingerprint));
    console.log(
      chalk.bold('Requirements:'),
      spec.requirements.length
    );

    if (spec.requirements.length > 0) {
      console.log(chalk.bold('\nRequirements:'));
      for (const req of spec.requirements) {
        console.log(`  • ${chalk.cyan(req.title)} ${chalk.dim(`(${req.id})`)}`);
      }
    }

    console.log(chalk.dim('\n' + '─'.repeat(60)));
    console.log(chalk.dim(`Path: ${spec.path}`));
  } catch (err) {
    if (err.message.includes('not found')) {
      console.error(chalk.red(`✗ Spec '${domain}' not found`));
    } else {
      console.error(chalk.red(`✗ Failed to show spec: ${err.message}`));
    }
    throw err;
  }
}

module.exports = {
  initSpecs,
  createSpec,
  listSpecs,
  showSpec,
};
