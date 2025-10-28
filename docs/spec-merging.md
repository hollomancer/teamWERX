# Spec Merging and Conflict Resolution

This document explains how `teamwerx` handles merging spec deltas and how to resolve conflicts when they arise.

## How Conflicts are Detected

A conflict occurs when a spec has been modified since a change proposal was created. This is called "divergence". `teamwerx` detects divergence by comparing fingerprints.

When a change is created with the `--specs` flag, `teamwerx` records a fingerprint of the current state of the specified specs. This includes a fingerprint for each requirement within the spec.

When you try to archive a change with `--merge-specs`, `teamwerx` compares the base fingerprints with the current fingerprints of the specs in your project. If they don't match, a conflict is reported.

## Conflict Resolution

When a conflict is detected, the merge is aborted. You can then use the `teamwerx changes resolve` command to handle the conflict.

```bash
teamwerx changes resolve <change-id>
```

This command will launch an interactive prompt to help you resolve the conflict.

### Resolution Options

The `resolve` command provides the following options:

-   **View Base Spec**: Shows the version of the spec as it was when the change was created.
-   **View Current Spec**: Shows the current version of the spec in your project.
-   **View Delta**: Shows the changes proposed in the delta.
-   **Accept Current (discard delta changes)**: This will discard the changes in the delta for the conflicting domain. The delta file will be updated with no operations.
-   **Manually Resolve**: This option will guide you to manually edit the delta file to resolve the conflict. You will need to open the file in your editor and make the necessary changes.
-   **Exit**: Cancels the resolution process.

## Auto-Merging

`teamwerx` can automatically merge non-overlapping changes. An auto-merge is possible when the changes in the delta do not conflict with the changes in the current spec.

For example, if your delta modifies requirement `A`, and the current spec has been modified to change requirement `B`, `teamwerx` can automatically merge your changes to requirement `A`.

If both the delta and the current spec modify the same requirement, it's a conflict that you need to resolve manually.

The auto-merge logic is run as part of the `teamwerx changes archive --merge-specs` command. If the auto-merge is successful, the merge proceeds without any manual intervention. If not, the command will fail and you will need to run `teamwerx changes resolve`.
