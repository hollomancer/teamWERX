# Spec Merging and Conflict Resolution

This document explains how `teamwerx` handles merging spec deltas and how to resolve conflicts when they arise.

## How Conflicts are Detected

A conflict occurs when a spec has been modified since a change proposal was created. This is called "divergence". `teamwerx` detects divergence by comparing fingerprints.

Changes record a base fingerprint of the current state of each target spec domain. This includes a fingerprint for each requirement within the spec.

When you apply a change (`teamwerx change apply --id <change-id>`), `teamwerx` compares the base fingerprints with the current fingerprints of the specs in your project. If they don't match, a conflict is reported.

## Conflict Resolution

When a conflict is detected during apply, the operation is aborted. You can then use the `teamwerx change resolve --id <change-id>` command to handle the conflict.

```bash
teamwerx change resolve --id <change-id>
```

This command will launch an interactive prompt to help you resolve the conflict.

### Resolution Options

The `resolve` command provides the following options:

-   Refresh base fingerprint from current spec and retry
-   Skip this domain and continue
-   Cancel

## Auto-Merging

`teamwerx` can automatically merge non-overlapping changes. An auto-merge is possible when the changes in the delta do not conflict with the changes in the current spec.

For example, if your delta modifies requirement `A`, and the current spec has been modified to change requirement `B`, `teamwerx` can automatically merge your changes to requirement `A`.

If both the delta and the current spec modify the same requirement, it's a conflict that you need to resolve manually.

The auto-merge logic runs as part of the `teamwerx change apply --id <change-id>` command. If the auto-merge is successful, the merge proceeds without any manual intervention. If not, the command will fail and you will need to run `teamwerx change resolve --id <change-id>`.
