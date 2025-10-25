const fs = require('fs').promises;
const path = require('path');

const TEMPLATE_ROOT = path.join(__dirname, '..', '..', 'assets', 'templates');

async function renderTemplate(filename, replacements = {}) {
  const templatePath = path.join(TEMPLATE_ROOT, filename);
  const content = await fs.readFile(templatePath, 'utf8');
  return Object.entries(replacements).reduce((acc, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    return acc.replace(pattern, value);
  }, content);
}

class TemplateManager {
  static async getAgentsTemplate(data = {}) {
    return renderTemplate('agents.md', {
      INITIALIZED_DATE: data.initializedDate ?? new Date().toISOString().split('T')[0],
    });
  }
}

module.exports = {
  TemplateManager,
};
