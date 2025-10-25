# Contributing to teamWERX

Thank you for your interest in contributing to teamWERX! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- Git
- npm or yarn

### Setup Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/hollomancer/teamWERX.git
   cd teamWERX
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make the CLI executable:
   ```bash
   chmod +x bin/teamwerx.js
   ```

4. Test the CLI:
   ```bash
   node bin/teamwerx.js --help
   ```

### Project Structure

```
teamWERX/
├── bin/
│   └── teamwerx.js          # CLI entry point
├── lib/
│   ├── commands/            # Command implementations
│   │   ├── init.js
│   │   ├── goal.js
│   │   ├── list.js
│   │   └── ...
│   └── utils/               # Utility modules
│       ├── file.js          # File system utilities
│       └── git.js           # Git utilities
├── package.json
├── README.md
└── teamWERX_specification.md
```

## Development Guidelines

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Keep functions focused and small
- Add JSDoc comments for functions
- Use async/await for asynchronous code

### Commit Messages

Use the conventional commit format with `[teamWERX]` prefix:

```
[teamWERX] Add new command for listing goals
[teamWERX] Fix bug in goal creation
[teamWERX] Update documentation for init command
```

### Adding a New Command

1. Create a new file in `lib/commands/`:
   ```javascript
   // lib/commands/mycommand.js
   const chalk = require('chalk');
   const { getCurrentGoal } = require('../utils/file');

   async function mycommand(args) {
     // Implementation
   }

   module.exports = mycommand;
   ```

2. Register the command in `bin/teamwerx.js`:
   ```javascript
   const mycommand = require('../lib/commands/mycommand');
   
   program
     .command('mycommand [args]')
     .description('Description of my command')
     .action(mycommand);
   ```

3. Update AGENTS.md if the command is for AI agents

4. Add tests (when testing framework is added)

5. Update README.md with command documentation

### Adding Utilities

1. Create or update files in `lib/utils/`
2. Export functions using `module.exports`
3. Add JSDoc comments
4. Handle errors gracefully

### Testing Commands Locally

```bash
# Test a specific command
node bin/teamwerx.js init

# Test with a real project
cd /path/to/test/project
git init
/path/to/teamwerx/bin/teamwerx.js init
```

## Contribution Workflow

### Reporting Issues

- Check if the issue already exists
- Provide clear description of the problem
- Include steps to reproduce
- Include error messages and logs
- Specify your environment (OS, Node version, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

3. Make your changes following the guidelines

4. Test your changes thoroughly

5. Commit with descriptive messages:
   ```bash
   git commit -m "[teamWERX] Add feature X"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```

7. Create a pull request with:
   - Clear title and description
   - Reference to related issues
   - Screenshots if applicable
   - List of changes made

## Areas for Contribution

### High Priority

- [ ] Add automated tests (Jest or Mocha)
- [ ] Implement validation for AI-generated artifacts
- [ ] Add state transition validation
- [ ] Improve error handling and recovery
- [ ] Add more detailed examples

### Medium Priority

- [ ] Add dependency tracking between goals
- [ ] Implement archive functionality
- [ ] Add conflict detection for multi-goal workflows
- [ ] Create templates for AI-generated artifacts
- [ ] Add progress visualization

### Low Priority

- [ ] Add shell completions (bash, zsh, fish)
- [ ] Add export/import functionality
- [ ] Add analytics and metrics
- [ ] Create web dashboard
- [ ] Add integration with popular AI assistants

## Code Review Process

1. All submissions require review
2. Maintainers will review within 48 hours
3. Address review comments promptly
4. Once approved, maintainers will merge

## Questions?

- Read the [specification](teamWERX_specification.md)
- Check [existing issues](https://github.com/hollomancer/teamWERX/issues)
- Create a new issue for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

Thank you for contributing to teamWERX! 🚀
