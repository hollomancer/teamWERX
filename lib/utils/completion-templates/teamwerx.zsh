#compdef teamwerx

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

    _arguments '1:command:->command' '*::args:->args'

    case $state in
        command)
            _describe 'command' commands
            ;;
        args)
            case $words[2] in
                status|use|research|discuss|plan|execute|complete|archive)
                    if [[ -d ".teamwerx/goals" ]]; then
                        local -a goals
                        goals=(${(f)"$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\.md$||')"})
                        _describe 'goal' goals
                    fi
                    ;;
                goal)
                    _arguments '--help[Show help]' '*:goal description'
                    ;;
                plan)
                    _arguments \
                        '--goal=[Specify goal]:goal:_teamwerx_goals' \
                        '--task=[Add task]:task' \
                        '--interactive[Interactive mode]' \
                        '--help[Show help]' \
                        '*:considerations'
                    ;;
                complete)
                    _arguments \
                        '--goal=[Specify goal]:goal:_teamwerx_goals' \
                        '--source=[Source type]:(fix manual batch)' \
                        '--notes=[Notes]:notes' \
                        '--limit=[Limit]:limit' \
                        '--help[Show help]' \
                        '*:issue or title'
                    ;;
            esac
            ;;
    esac
}

_teamwerx_goals() {
    if [[ -d ".teamwerx/goals" ]]; then
        local -a goals
        goals=(${(f)"$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\.md$||')"})
        _describe 'goal' goals
    fi
}

_teamwerx "$@"
