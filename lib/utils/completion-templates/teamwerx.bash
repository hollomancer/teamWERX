#!/bin/bash

# teamWERX bash completion script

_teamwerx_complete() {
    local cur prev words cword
    # Use bash-completion initialization if available
    if type _init_completion >/dev/null 2>&1; then
        _init_completion || return
    else
        cur=${COMP_WORDS[COMP_CWORD]}
        prev=${COMP_WORDS[COMP_CWORD-1]}
    fi

    # Available commands
    local commands="init goal status use research discuss plan execute complete archive charter reflect summarize"

    case $prev in
        status|use|research|discuss|plan|execute|complete|archive)
            if [ -d ".teamwerx/goals" ]; then
                local goals
                goals=$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\.md$||')
                COMPREPLY=( $(compgen -W "$goals" -- "$cur") )
            fi
            return
            ;;
        --goal|-g)
            if [ -d ".teamwerx/goals" ]; then
                local goals
                goals=$(ls .teamwerx/goals/*.md 2>/dev/null | sed 's|.*/||' | sed 's|\.md$||')
                COMPREPLY=( $(compgen -W "$goals" -- "$cur") )
            fi
            return
            ;;
        --status)
            COMPREPLY=( $(compgen -W "draft open in-progress blocked completed cancelled" -- "$cur") )
            return
            ;;
        --source)
            COMPREPLY=( $(compgen -W "fix manual batch" -- "$cur") )
            return
            ;;
    esac

    case $cur in
        -*)
            COMPREPLY=( $(compgen -W "--help --version" -- "$cur") )
            return
            ;;
    esac

    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
}

complete -F _teamwerx_complete teamwerx
