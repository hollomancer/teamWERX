# teamWERX fish completion script

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
complete -c teamwerx -f -n '__fish_use_subcommand' -l interactive -d 'Interactive mode'

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
