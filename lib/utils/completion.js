#!/usr/bin/env node

/**
 * Generate shell completion scripts for teamWERX
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');

program
  .name('generate-completion')
  .description('Generate shell completion scripts')
  .option('--shell <shell>', 'Shell type (bash|zsh|fish)', 'bash')
  .option('--output <file>', 'Output file path')
  .action(async (options) => {
    const { shell, output } = options;

    let completionScript = '';

    switch (shell) {
      case 'bash':
        completionScript = generateBashCompletion();
        break;
      case 'zsh':
        completionScript = generateZshCompletion();
        break;
      case 'fish':
        completionScript = generateFishCompletion();
        break;
      default:
        console.error(chalk.red(`Unsupported shell: ${shell}`));
        process.exit(1);
    }

    const outputPath = output || `teamwerx-completion.${shell}`;

    try {
      await fs.writeFile(outputPath, completionScript);
      console.log(chalk.green(`✓ Completion script generated: ${outputPath}`));
      console.log(chalk.gray(`\nTo install:`));

      switch (shell) {
        case 'bash':
          console.log(chalk.cyan(`  source ${outputPath}`));
          console.log(chalk.gray(`  # Or add to ~/.bashrc`));
          break;
        case 'zsh':
          console.log(chalk.cyan(`  source ${outputPath}`));
          console.log(chalk.gray(`  # Or add to ~/.zshrc`));
          break;
        case 'fish':
          console.log(chalk.cyan(`  source ${outputPath}`));
          console.log(chalk.gray(`  # Or add to ~/.config/fish/config.fish`));
          break;
      }
    } catch (error) {
      console.error(chalk.red(`Failed to write completion script: ${error.message}`));
      process.exit(1);
    }
  });

function generateBashCompletion() {
  return `#!/bin/bash

# teamWERX bash completion script

_teamwerx_complete() {
    local cur prev words cword
    _init_completion || return

    # Available commands
    local commands="init goal status use research discuss plan execute complete archive charter reflect summarize"

    # Command-specific completions
    case $prev in
        status|use|research|discuss|plan|execute|complete|archive)
            # Goal names completion
            if [ -d ".teamwerx/goals" ]; then
                local goals=$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\.md$||')
                COMPREPLY=( $(compgen -W "$goals" -- "$cur") )
            fi
            return
            ;;
        --goal|-g)
            # Goal names for --goal option
            if [ -d ".teamwerx/goals" ]; then
                local goals=$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\.md$||')
                COMPREPLY=( $(compgen -W "$goals" -- "$cur") )
            fi
            return
            ;;
        --status)
            # Status values
            COMPREPLY=( $(compgen -W "draft open in-progress blocked completed cancelled" -- "$cur") )
            return
            ;;
        --source)
            # Source values for complete command
            COMPREPLY=( $(compgen -W "fix manual batch" -- "$cur") )
            return
            ;;
    esac

    # Global options
    case $cur in
        -*)
            COMPREPLY=( $(compgen -W "--help --version" -- "$cur") )
            return
            ;;
    esac

    # Complete commands
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
}

complete -F _teamwerx_complete teamwerx
`;
}

function generateZshCompletion() {
  return `#compdef teamwerx

# teamWERX zsh completion script

_teamwerx() {
    local -a commands
    commands=(
        'init:Initialize teamWERX in the current project'
        'goal:Create a new goal'
        'status:Show detailed status of goals'
        'use:Set the current working goal context'
        'research:Analyze codebase and generate research report'
        'discuss:Continue structured discussion'
        'plan:Generate or update task plan'
        'execute:Execute tasks in the plan'
        'complete:Complete tasks and record implementations'
        'archive:Archive a completed goal'
        'charter:Generate or update project charter'
        'reflect:Add reflection entry'
        'summarize:Generate knowledge summary'
    )

    _arguments \\
        '1: :->command' \\
        '*:: :->args'

    case \\$state in
        command)
            _describe 'command' commands
            ;;
        args)
            case \\$words[2] in
                status|use|research|discuss|plan|execute|complete|archive)
                    if [[ -d ".teamwerx/goals" ]]; then
                        local -a goals
                        goals=(\\$(f)"\\$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\\.md$||')"})
                        _describe 'goal' goals
                    fi
                    ;;
                goal)
                    _arguments \\
                        '--help[Show help]' \\
                        '*:goal description'
                    ;;
                plan)
                    _arguments \\
                        '--goal=[Specify goal]:goal:_teamwerx_goals' \\
                        '--task=[Add task]:task' \\
                        '--interactive[Interactive mode]' \\
                        '--help[Show help]' \\
                        '*:considerations'
                    ;;
                complete)
                    _arguments \\
                        '--goal=[Specify goal]:goal:_teamwerx_goals' \\
                        '--source=[Source type]:(fix manual batch)' \\
                        '--notes=[Notes]:notes' \\
                        '--limit=[Limit]:limit' \\
                        '--help[Show help]' \\
                        '*:issue or title'
                    ;;
            esac
            ;;
    esac
}

_teamwerx_goals() {
    if [[ -d ".teamwerx/goals" ]]; then
        local -a goals
        goals=(\\$(f)"\\$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\\.md$||')"})
        _describe 'goal' goals
    fi
}

_teamwerx "\\$@"
`;
}

function generateFishCompletion() {
  return `# teamWERX fish completion script

# Commands
complete -c teamwerx -f -n '__fish_use_subcommand' -a init -d 'Initialize teamWERX in the current project'
complete -c teamwerx -f -n '__fish_use_subcommand' -a goal -d 'Create a new goal'
complete -c teamwerx -f -n '__fish_use_subcommand' -a status -d 'Show detailed status of goals'
complete -c teamwerx -f -n '__fish_use_subcommand' -a use -d 'Set the current working goal context'
complete -c teamwerx -f -n '__fish_use_subcommand' -a research -d 'Analyze codebase and generate research report'
complete -c teamwerx -f -n '__fish_use_subcommand' -a discuss -d 'Continue structured discussion'
complete -c teamwerx -f -n '__fish_use_subcommand' -a plan -d 'Generate or update task plan'
complete -c teamwerx -f -n '__fish_use_subcommand' -a execute -d 'Execute tasks in the plan'
complete -c teamwerx -f -n '__fish_use_subcommand' -a complete -d 'Complete tasks and record implementations'
complete -c teamwerx -f -n '__fish_use_subcommand' -a archive -d 'Archive a completed goal'
complete -c teamwerx -f -n '__fish_use_subcommand' -a charter -d 'Generate or update project charter'
complete -c teamwerx -f -n '__fish_use_subcommand' -a reflect -d 'Add reflection entry'
complete -c teamwerx -f -n '__fish_use_subcommand' -a summarize -d 'Generate knowledge summary'

# Goal name completions for commands that take goal names
for cmd in status use research discuss plan execute complete archive
    complete -c teamwerx -f -n "__fish_seen_subcommand_from $cmd" -a '(__teamwerx_complete_goals)' -d 'Goal name'
end

# Status command options
complete -c teamwerx -f -n '__fish_seen_subcommand_from status' -l list -d 'Show table view of all goals'
complete -c teamwerx -f -n '__fish_seen_subcommand_from status' -l status -a 'draft open in-progress blocked completed cancelled' -d 'Filter by status'
complete -c teamwerx -f -n '__fish_seen_subcommand_from status' -l context -d 'Show project context'
complete -c teamwerx -f -n '__fish_seen_subcommand_from status' -l summary -d 'Show summary'
complete -c teamwerx -f -n '__fish_seen_subcommand_from status' -l json -d 'Output in JSON format'

# Plan command options
complete -c teamwerx -f -n '__fish_seen_subcommand_from plan' -l goal -a '(__teamwerx_complete_goals)' -d 'Specify goal'
complete -c teamwerx -f -n '__fish_seen_subcommand_from plan' -l task -d 'Add task'
complete -c teamwerx -f -n '__fish_seen_subcommand_from plan' -l interactive -d 'Interactive mode'

# Complete command options
complete -c teamwerx -f -n '__fish_seen_subcommand_from complete' -l goal -a '(__teamwerx_complete_goals)' -d 'Specify goal'
complete -c teamwerx -f -n '__fish_seen_subcommand_from complete' -l source -a 'fix manual batch' -d 'Source type'
complete -c teamwerx -f -n '__fish_seen_subcommand_from complete' -l notes -d 'Notes'
complete -c teamwerx -f -n '__fish_seen_subcommand_from complete' -l limit -d 'Number of tasks to complete'

# Global options
complete -c teamwerx -s h -l help -d 'Show help'
complete -c teamwerx -s V -l version -d 'Show version'

function __teamwerx_complete_goals
    if test -d .teamwerx/goals
        ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\.md$||'
    end
end
`;
}

// Run if called directly
if (require.main === module) {
  program.parse(process.argv);
}

module.exports = {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion
};
