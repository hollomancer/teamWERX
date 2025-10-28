# Hybrid Model Transition Guide
## Delta Tracking & Spec Merging Integration

**Version**: 2.0.0  
**Status**: Planning  
**Last Updated**: 2025-10-28

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What's Changing](#whats-changing)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Migration Path](#migration-path)
6. [Technical Specifications](#technical-specifications)
7. [Developer Guide](#developer-guide)
8. [Testing Strategy](#testing-strategy)
9. [Rollout Plan](#rollout-plan)
10. [FAQ](#faq)

---

## Executive Summary

### Vision

The Hybrid Model integrates OpenSpec-style specification delta tracking and merging into TeamWERX while preserving the existing goal-oriented, task-based workflow. This provides **specification versioning** capabilities alongside **implementation tracking**, creating a unified system for managing both "what to build" (specs) and "how to build it" (tasks).

### Key Benefits

✅ **Specification Versioning** - Track and merge spec changes with delta format (`ADDED`, `MODIFIED`, `REMOVED`)  
✅ **Conflict Detection** - Fingerprinting prevents silent overwrites when specs diverge  
✅ **Backward Compatible** - Existing task workflow unchanged; spec management is opt-in  
✅ **Non-Breaking** - Current users can continue without specs; new users can adopt gradually  
✅ **OpenSpec Alignment** - Shares concepts with OpenSpec for cross-tool compatibility

### Timeline

**Fast Track (JavaScript)**: 6-7 weeks  
**Recommended (TypeScript)**: 8-10 weeks

---

## What's Changing

### Before (Current State)

```
.teamwerx/
└── changes/
    └── 001-add-2fa/
        ├── proposal.md      # Why & what
        ├── tasks.md         # Tasks to import
        └── spec-delta.md    # Free-form notes
```

**Flow**:
1. Create change → Edit tasks → Apply (imports tasks to plan) → Archive (moves to archive)
2. `spec-delta.md` is **descriptive only** (not executable)
3. No automatic spec merging

### After (Hybrid Model)

```
.teamwerx/
├── specs/                   # NEW: Project-level specs (source of truth)
│   └── auth/
│       └── spec.md
├── changes/
│   └── 001-add-2fa/
│       ├── proposal.md
│       ├── tasks.md
│       └── specs/           # NEW: Executable spec deltas
│           └── auth/
│               └── spec.md  # Delta: ADDED/MODIFIED/REMOVED
└── goals/
    └── 001-implement-auth/
        └── specs/           # NEW: Goal-specific spec views
            └── auth/
                └── spec.md
```

**New Flow**:
1. Create change → Edit tasks & spec deltas → Apply (imports tasks) → Archive (merges specs)
2. Spec deltas use OpenSpec format: `## ADDED`, `## MODIFIED`, `## REMOVED`
3. Fingerprinting detects divergence
4. 3-way merge on archive

### What Stays the Same

✅ Task management (`plan.md` remains canonical)  
✅ Discussion logs (`discuss.md`)  
✅ Implementation tracking (`implementation/`)  
✅ All existing commands work identically  
✅ Git-based versioning

### What's New

🆕 `.teamwerx/specs/` - Project-level specifications  
🆕 Spec delta format in changes  
🆕 Fingerprinting for conflict detection  
🆕 `teamwerx specs` command group  
🆕 `teamwerx changes sync` for conflict resolution  
🆕 `--merge-specs` flag on archive

---

## Architecture Overview

### Directory Structure

```
.teamwerx/
├── specs/                           # NEW: Source of truth for specifications
│   ├── auth/
│   │   ├── spec.md                  # Current authentication specification
│   │   └── .history/                # (Future) Historical versions
│   ├── api/
│   │   └── spec.md
│   ├── database/
│   │   └── spec.md
│   └── README.md                    # Spec organization guide
│
├── goals/
│   ├── <goal-name>.md               # Goal definition (existing)
│   └── 00X-<goal-slug>/             # Workspace (existing)
│       ├── plan.md                  # Tasks (existing - unchanged)
│       ├── discuss.md               # Discussions (existing)
│       ├── research.md              # Research (existing)
│       ├── implementation/          # Implementation records (existing)
│       └── specs/                   # NEW: Goal-specific spec overrides
│           └── auth/
│               └── spec.md          # Goal's view of auth (inherits from project)
│
└── changes/
    └── 00X-<change-slug>/           # Change proposal (existing)
        ├── proposal.md              # (existing - enhanced with fingerprints)
        ├── tasks.md                 # (existing - unchanged)
        ├── status.json              # (existing - unchanged)
        └── specs/                   # NEW: Spec deltas
            └── auth/
                └── spec.md          # Delta: ADDED/MODIFIED/REMOVED
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. CREATE CHANGE                                        │
│    $ teamwerx propose "Add 2FA" --specs auth            │
│                                                         │
│    Actions:                                             │
│    - Capture base spec fingerprints from .teamwerx/specs/│
│    - Create change workspace                            │
│    - Generate spec delta template                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. EDIT CHANGE                                          │
│    Edit: changes/001-add-2fa/specs/auth/spec.md         │
│                                                         │
│    Actions:                                             │
│    - Write spec deltas using OpenSpec format            │
│    - Edit tasks.md as before                            │
│    - Validate: teamwerx changes validate 001            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. APPLY CHANGE                                         │
│    $ teamwerx changes apply 001 --goal auth             │
│                                                         │
│    Actions:                                             │
│    - Import tasks → plan.md (existing behavior)         │
│    - Create implementation stubs (existing behavior)    │
│    - NO spec merging (deferred to archive)              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 4. IMPLEMENT TASKS                                      │
│    $ teamwerx execute                                   │
│                                                         │
│    Actions:                                             │
│    - Execute tasks from plan.md (existing workflow)     │
│    - Mark complete (existing workflow)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 5. CHECK FOR DIVERGENCE (optional)                     │
│    $ teamwerx changes sync 001                          │
│                                                         │
│    Actions:                                             │
│    - Compare current spec fingerprints to base          │
│    - Warn if specs have diverged                        │
│    - Option to update fingerprints or force merge       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 6. ARCHIVE & MERGE                                     │
│    $ teamwerx changes archive 001 --merge-specs         │
│                                                         │
│    Actions:                                             │
│    - Validate no divergence (or use --force)            │
│    - Parse spec deltas (ADDED/MODIFIED/REMOVED)         │
│    - Apply operations to .teamwerx/specs/               │
│    - Move change to archive/ (existing behavior)        │
└─────────────────────────────────────────────────────────┘
```

### Core Components

```
lib/
├── core/
│   ├── spec-manager.js          # NEW: Spec CRUD with fingerprinting
│   ├── spec-delta-parser.js     # NEW: Parse ADDED/MODIFIED/REMOVED
│   ├── spec-merger.js           # NEW: 3-way merge logic
│   ├── change-manager.js        # MODIFIED: Add fingerprinting & merge
│   ├── plan-manager.js          # UNCHANGED
│   ├── discussion-manager.js    # UNCHANGED
│   └── implementation-manager.js # UNCHANGED
│
├── commands/
│   ├── specs.js                 # NEW: specs init/create/list
│   ├── changes.js               # MODIFIED: Add sync/validate
│   └── ...                      # UNCHANGED
│
└── utils/
    └── ...                      # UNCHANGED
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

#### Goals
- Set up spec management infrastructure
- Create core classes for spec CRUD and fingerprinting
- Enable spec initialization

#### Tasks

**T1.1: Create SpecManager class**
- **File**: `lib/core/spec-manager.js`
- **Responsibilities**:
  - Read/write specs with frontmatter
  - Parse requirement blocks
  - Generate SHA-256 fingerprints
  - List all project specs
- **Dependencies**: None
- **Estimate**: 8 hours

**T1.2: Create SpecDeltaParser class**
- **File**: `lib/core/spec-delta-parser.js`
- **Responsibilities**:
  - Parse `## ADDED/MODIFIED/REMOVED` sections
  - Extract requirement blocks
  - Validate deltas against base specs
- **Dependencies**: SpecManager
- **Estimate**: 6 hours

**T1.3: Add specs CLI commands**
- **File**: `lib/commands/specs.js`
- **Commands**:
  - `teamwerx specs init` - Create .teamwerx/specs/ with README
  - `teamwerx specs create <domain>` - Create new spec domain
  - `teamwerx specs list` - List all specs with fingerprints
- **Dependencies**: SpecManager
- **Estimate**: 6 hours

**T1.4: Update ChangeManager for fingerprinting**
- **File**: `lib/core/change-manager.js` (modify)
- **Changes**:
  - Capture base fingerprints in `createChange()`
  - Add `--specs <domains>` option to `teamwerx propose`
  - Generate spec delta templates
- **Dependencies**: SpecManager
- **Estimate**: 8 hours

**T1.5: Update CLI entry point**
- **File**: `bin/teamwerx.js` (modify)
- **Changes**: Add `specs` command group
- **Dependencies**: specs.js
- **Estimate**: 2 hours

#### Deliverables
- ✅ SpecManager with fingerprinting
- ✅ SpecDeltaParser for parsing deltas
- ✅ `teamwerx specs init/create/list`
- ✅ Updated `teamwerx propose --specs <domains>`
- ✅ Unit tests for new modules

#### Success Criteria
- Can create `.teamwerx/specs/` directory
- Can create spec domains with templates
- Can list specs with fingerprints
- Change proposals capture base fingerprints
- All existing tests pass

---

### Phase 2: Merge Logic (Weeks 3-4)

#### Goals
- Implement delta-to-spec merging
- Add conflict detection
- Enable archive-time spec merging

#### Tasks

**T2.1: Create SpecMerger class**
- **File**: `lib/core/spec-merger.js`
- **Responsibilities**:
  - Apply delta operations to specs
  - Detect fingerprint divergence
  - Handle ADDED/MODIFIED/REMOVED operations
  - Generate conflict reports
- **Dependencies**: SpecManager, SpecDeltaParser
- **Estimate**: 12 hours

**T2.2: Update ChangeManager archive flow**
- **File**: `lib/core/change-manager.js` (modify)
- **Changes**:
  - Add `--merge-specs` flag to `archiveChange()`
  - Check fingerprint divergence
  - Apply deltas via SpecMerger
  - Handle conflicts (block or force)
- **Dependencies**: SpecMerger
- **Estimate**: 10 hours

**T2.3: Add validation command**
- **File**: `lib/commands/changes.js` (modify)
- **Command**: `teamwerx changes validate <id>`
- **Purpose**: Validate spec deltas before apply/archive
- **Dependencies**: SpecDeltaParser, SpecManager
- **Estimate**: 4 hours

**T2.4: Error handling & user feedback**
- Graceful error messages
- Progress indicators for merge
- Clear conflict reporting
- **Estimate**: 4 hours

#### Deliverables
- ✅ SpecMerger with delta application
- ✅ Updated `teamwerx changes archive --merge-specs`
- ✅ `teamwerx changes validate <id>`
- ✅ Integration tests for merge scenarios

#### Success Criteria
- Deltas merge correctly into specs
- Fingerprint divergence detected
- Conflicts prevent merge (unless --force)
- Clear error messages for users
- All existing tests pass

---

### Phase 3: Conflict Resolution (Week 5)

#### Goals
- Enable manual conflict resolution
- Provide sync workflow for diverged specs
- Add developer tools for troubleshooting

#### Tasks

**T3.1: Add sync command**
- **File**: `lib/commands/changes.js` (modify)
- **Command**: `teamwerx changes sync <id>`
- **Features**:
  - Compare current fingerprints to base
  - Report divergence with details
  - Option to update fingerprints: `--update`
- **Dependencies**: SpecManager
- **Estimate**: 6 hours

**T3.2: Improve conflict reporting**
- Show which requirements conflicted
- Suggest resolution strategies
- Link to documentation
- **Estimate**: 4 hours

**T3.3: Create conflict resolution docs**
- **File**: `docs/CONFLICT_RESOLUTION.md`
- Content:
  - What causes conflicts
  - How to resolve manually
  - When to use --force
  - Examples
- **Estimate**: 4 hours

**T3.4: Add dry-run mode**
- `teamwerx changes archive <id> --merge-specs --dry-run`
- Preview merge without applying
- **Estimate**: 3 hours

#### Deliverables
- ✅ `teamwerx changes sync <id>`
- ✅ Enhanced conflict reporting
- ✅ `docs/CONFLICT_RESOLUTION.md`
- ✅ Dry-run mode for archive

#### Success Criteria
- Sync detects divergence accurately
- Users can update fingerprints
- Dry-run shows preview without changes
- Documentation covers common scenarios

---

### Phase 4: Documentation & Polish (Week 6)

#### Goals
- Comprehensive user documentation
- Developer contribution guide
- Examples and tutorials

#### Tasks

**T4.1: Update README**
- **File**: `README.md` (modify)
- Add spec management section
- Update workflow diagram
- Add examples
- **Estimate**: 4 hours

**T4.2: Create spec management guide**
- **File**: `docs/SPEC_MANAGEMENT.md`
- Topics:
  - When to use specs
  - Spec format (requirements/scenarios)
  - Delta format (ADDED/MODIFIED/REMOVED)
  - Workflow examples
  - Best practices
- **Estimate**: 6 hours

**T4.3: Create migration guide**
- **File**: `docs/MIGRATION_TO_HYBRID.md`
- For existing users
- Optional adoption path
- FAQ
- **Estimate**: 4 hours

**T4.4: Add examples**
- **Directory**: `docs/examples/`
- Example specs for auth, api, database
- Example change with spec deltas
- **Estimate**: 4 hours

**T4.5: Update AGENTS.md**
- Add spec management instructions for AI agents
- **Estimate**: 2 hours

#### Deliverables
- ✅ Updated README.md
- ✅ `docs/SPEC_MANAGEMENT.md`
- ✅ `docs/MIGRATION_TO_HYBRID.md`
- ✅ `docs/examples/`
- ✅ Updated AGENTS.md

---

### Phase 5: Testing & Quality (Week 7)

#### Goals
- Comprehensive test coverage
- Integration testing
- Performance validation

#### Tasks

**T5.1: Unit tests**
- `test/core/spec-manager.test.js`
- `test/core/spec-delta-parser.test.js`
- `test/core/spec-merger.test.js`
- Target: 80%+ coverage
- **Estimate**: 12 hours

**T5.2: Integration tests**
- End-to-end spec workflow
- Conflict scenarios
- Fingerprint tracking
- **Estimate**: 8 hours

**T5.3: Performance testing**
- Large spec merges (100+ requirements)
- Fingerprint generation speed
- **Estimate**: 4 hours

**T5.4: User acceptance testing**
- Real-world scenario testing
- Bug fixes
- **Estimate**: 6 hours

#### Deliverables
- ✅ 80%+ test coverage
- ✅ Integration test suite
- ✅ Performance benchmarks
- ✅ Bug-free release candidate

---

### Phase 6: Release (Week 8)

#### Goals
- Beta release
- Gather feedback
- Final polish

#### Tasks

**T6.1: Beta release**
- Version 2.0.0-beta.1
- Announce to early adopters
- **Estimate**: 2 hours

**T6.2: Feedback incorporation**
- Address beta user feedback
- Bug fixes
- **Estimate**: 12 hours

**T6.3: Final release**
- Version 2.0.0
- Changelog
- Release notes
- **Estimate**: 4 hours

#### Deliverables
- ✅ Version 2.0.0 released
- ✅ CHANGELOG.md updated
- ✅ Release notes published

---

## Migration Path

### For Existing Users

#### Step 1: Update to v2.0.0

```bash
npm install -g teamwerx@2.0.0
```

#### Step 2: Initialize Specs (Optional)

```bash
cd your-project
teamwerx specs init
```

**Note**: This is **completely optional**. Your existing workflow will continue to work without any changes.

#### Step 3: Create Your First Spec (Optional)

```bash
teamwerx specs create auth
# Edit .teamwerx/specs/auth/spec.md
```

#### Step 4: Use Specs in Changes (Optional)

```bash
# Create change with spec tracking
teamwerx propose "Add 2FA" --specs auth

# Edit the spec delta
# .teamwerx/changes/001-add-2fa/specs/auth/spec.md

# Archive with merge
teamwerx changes archive 001-add-2fa --merge-specs
```

### For New Users

New users can adopt specs from day one:

```bash
# Initialize project
teamwerx init
teamwerx specs init

# Create specs for your domains
teamwerx specs create auth
teamwerx specs create api
teamwerx specs create database

# Create goals with spec tracking
teamwerx goal "Implement authentication"
teamwerx propose "Add OAuth" --specs auth --goal implement-authentication
```

### Backward Compatibility

✅ **All existing commands work identically**  
✅ **No breaking changes to data formats**  
✅ **Existing goals/changes unaffected**  
✅ **Specs are completely opt-in**

---

## Technical Specifications

### Spec Format

```markdown
---
domain: auth
updated: 2025-10-28T12:00:00Z
---

# Authentication Specification

## Purpose

Define authentication and authorization requirements for the system.

## Requirements

### Requirement: User Authentication

#### Scenario: Valid credentials
- MUST authenticate user with valid email and password
- MUST return session token on successful authentication
- MUST store session in secure, httpOnly cookie

#### Scenario: Invalid credentials
- MUST reject authentication attempts with invalid credentials
- MUST return 401 status code
- MUST not reveal whether email or password was incorrect

### Requirement: Session Management

#### Scenario: Active session
- MUST validate session token on each request
- MUST refresh token if expiring within 5 minutes
- MUST maintain session for 24 hours

#### Scenario: Expired session
- MUST reject requests with expired tokens
- MUST return 401 status code
- MUST clear session cookie
```

### Delta Format

```markdown
---
change: 001-add-2fa
domain: auth
delta_type: spec
---

# Spec Delta: auth

## ADDED Requirements

### Requirement: Two-Factor Authentication

#### Scenario: OTP generation
- MUST generate time-based OTP using TOTP algorithm
- MUST use 6-digit codes
- MUST expire codes after 30 seconds

#### Scenario: OTP verification
- MUST validate OTP against user's secret
- MUST allow one-time use only
- MUST lock account after 3 failed attempts

## MODIFIED Requirements

### Requirement: User Authentication

#### Scenario: Valid credentials with 2FA
- MUST authenticate user with valid email and password
- MUST prompt for OTP if 2FA enabled
- MUST complete authentication only after OTP verification
- MUST return session token on successful authentication

## REMOVED Requirements

(None)
```

### Fingerprinting

```javascript
// Fingerprint generation (SHA-256, first 16 chars)
function generateFingerprint(content) {
  return crypto
    .createHash('sha256')
    .update(content.trim())
    .digest('hex')
    .substring(0, 16);
}

// Stored in proposal.md frontmatter
{
  spec_fingerprints: {
    auth: {
      base_fingerprint: '8f3a9b2c1d4e5f6a',
      base_timestamp: '2025-10-28T12:00:00Z',
      requirements: [
        {
          id: 'user-authentication',
          title: 'User Authentication',
          fingerprint: '7e2d8c1b4f3a9e5c'
        }
      ]
    }
  }
}
```

### Merge Algorithm

```
For each delta operation:
  
  IF operation is ADD:
    - Check if requirement already exists (conflict)
    - If not, append to spec
  
  IF operation is MODIFY:
    - Check if requirement exists (error if not)
    - Check if current fingerprint == base fingerprint
      - If YES: Apply delta (fast-forward)
      - If NO: Conflict (spec has diverged)
  
  IF operation is REMOVE:
    - Check if requirement exists (error if not)
    - Remove from spec

After all operations:
  - Reconstruct spec content
  - Write to .teamwerx/specs/<domain>/spec.md
  - Update fingerprint
```

---

## Developer Guide

### Setting Up Development Environment

```bash
# Clone repo
git clone <repo-url>
cd teamwerx

# Install dependencies
npm install

# Run tests
npm test

# Run in watch mode
npm run test:watch
```

### Adding New Spec Manager Features

```javascript
// lib/core/spec-manager.js

class SpecManager {
  // Add new methods here
  
  async exportSpec(domain, format = 'markdown') {
    const spec = await this.readSpec(domain);
    
    if (format === 'json') {
      return JSON.stringify({
        domain: spec.domain,
        requirements: spec.requirements.map(r => ({
          id: r.id,
          title: r.title,
          scenarios: this._extractScenarios(r.content)
        }))
      }, null, 2);
    }
    
    return spec.content;
  }
}
```

### Testing Spec Merges

```javascript
// test/core/spec-merger.test.js

describe('SpecMerger', () => {
  it('should merge ADDED requirements', async () => {
    const merger = new SpecMerger();
    const delta = `
## ADDED Requirements

### Requirement: New Feature
- MUST implement feature
    `;
    
    const result = await merger.applyDelta(delta, baseSpec);
    
    expect(result.requirements).toHaveLength(baseSpec.requirements.length + 1);
    expect(result.requirements[result.requirements.length - 1].title).toBe('New Feature');
  });
});
```

### Debugging

```javascript
// Enable debug logging
const DEBUG = process.env.DEBUG === 'teamwerx:*';

if (DEBUG) {
  console.log('Fingerprint:', fingerprint);
  console.log('Operations:', operations);
}
```

---

## Testing Strategy

### Unit Tests

**Coverage Target**: 80%+

```javascript
// lib/core/spec-manager.test.js
describe('SpecManager', () => {
  describe('readSpec', () => { /* ... */ });
  describe('writeSpec', () => { /* ... */ });
  describe('parseRequirements', () => { /* ... */ });
  describe('generateFingerprint', () => { /* ... */ });
});

// lib/core/spec-delta-parser.test.js
describe('SpecDeltaParser', () => {
  describe('parseDelta', () => { /* ... */ });
  describe('validateDelta', () => { /* ... */ });
});

// lib/core/spec-merger.test.js
describe('SpecMerger', () => {
  describe('mergeChange', () => { /* ... */ });
  describe('applyOperations', () => { /* ... */ });
  describe('detectConflicts', () => { /* ... */ });
});
```

### Integration Tests

```javascript
// test/integration/spec-workflow.test.js
describe('Spec Workflow', () => {
  it('should complete full spec lifecycle', async () => {
    // 1. Initialize specs
    await execCommand('teamwerx specs init');
    
    // 2. Create spec
    await execCommand('teamwerx specs create auth');
    
    // 3. Create change with spec
    await execCommand('teamwerx propose "Add 2FA" --specs auth');
    
    // 4. Edit delta (programmatically)
    await writeSpecDelta('001-add-2fa', 'auth', deltaContent);
    
    // 5. Validate
    const validation = await execCommand('teamwerx changes validate 001-add-2fa');
    expect(validation).toContain('valid');
    
    // 6. Archive with merge
    await execCommand('teamwerx changes archive 001-add-2fa --merge-specs --yes');
    
    // 7. Verify spec was updated
    const updatedSpec = await readSpec('auth');
    expect(updatedSpec).toContain('Two-Factor Authentication');
  });
});
```

### Test Scenarios

| Scenario | Description | Expected Result |
|----------|-------------|-----------------|
| **Happy Path** | Create spec → Create change → Archive with merge | Spec updated successfully |
| **Fingerprint Match** | Spec unchanged since change created | Fast-forward merge |
| **Fingerprint Mismatch** | Spec modified by another change | Conflict detected |
| **Force Merge** | Override divergence with --force | Merge succeeds with warning |
| **Missing Requirement** | MODIFY/REMOVE non-existent requirement | Error reported |
| **Duplicate Add** | ADD existing requirement | Conflict detected |
| **No Specs** | Change without spec domains | Works as before |
| **Sync Update** | Update fingerprints after divergence | Fingerprints updated |

---

## Rollout Plan

### Pre-Release

**Week 7: Internal Testing**
- Team dogfooding
- Documentation review
- Performance validation

**Week 8: Beta Release**
- Version 2.0.0-beta.1
- Announce to 5-10 early adopters
- Gather feedback

### Release

**Week 9: Release Candidate**
- Version 2.0.0-rc.1
- Address beta feedback
- Final bug fixes

**Week 10: General Availability**
- Version 2.0.0
- Full documentation
- Blog post / announcement

### Post-Release

**Week 11+: Support & Iteration**
- Monitor issues
- User support
- Minor patches (2.0.1, 2.0.2, etc.)

### Communication Plan

**Channels**:
- GitHub Releases
- README.md
- docs/ folder
- (If applicable) Twitter/Blog

**Messaging**:
- Emphasize **opt-in** nature
- Highlight **backward compatibility**
- Provide **migration examples**
- Link to **documentation**

---

## FAQ

### General

**Q: Do I have to use specs?**  
A: No. Spec management is completely optional. Your existing workflow continues to work without any changes.

**Q: Will this break my existing projects?**  
A: No. This is a non-breaking change. All existing commands work identically.

**Q: How is this different from the current spec-delta.md?**  
A: Current `spec-delta.md` is free-form notes. The new spec deltas use a structured format and actually merge into project specs.

### Technical

**Q: What happens if I don't use --merge-specs when archiving?**  
A: The change archives normally (moves to archive/) but spec deltas are NOT merged. Specs remain unchanged.

**Q: Can I edit specs directly without using changes?**  
A: Yes. You can edit `.teamwerx/specs/<domain>/spec.md` directly. Changes are for tracking proposed modifications.

**Q: What if two changes modify the same spec?**  
A: Fingerprinting detects this. The second change to archive will see divergence. Use `teamwerx changes sync` to update fingerprints or `--force` to override.

**Q: How do I resolve conflicts?**  
A: Run `teamwerx changes sync <id>` to see divergence. You can:
1. Update change fingerprints with `--update`
2. Manually edit the delta to account for changes
3. Force merge with `--force` (use cautiously)

**Q: Can goals have their own specs?**  
A: Yes. Goal-specific specs go in `.teamwerx/goals/00X-slug/specs/`. They inherit from project specs.

### Workflow

**Q: When should I use specs vs tasks?**  
A: 
- **Specs**: Define "what to build" (requirements, behavior, contracts)
- **Tasks**: Define "how to build it" (implementation steps)
- Use both together for comprehensive tracking

**Q: Can I have changes without specs?**  
A: Yes. Changes without `--specs` flag work exactly as before.

**Q: How do I create a change with multiple spec domains?**  
A: `teamwerx propose "Update auth and API" --specs auth,api`

**Q: What if I forget to use --merge-specs?**  
A: You can manually copy deltas to specs or create a new change for the spec updates.

### Performance

**Q: Will this slow down my workflow?**  
A: No. Fingerprinting is fast (~1ms per spec). Merging is only done on archive (rare operation).

**Q: How big can specs get?**  
A: Tested with 100+ requirements (5000+ lines). Performance is acceptable. For very large specs, consider splitting into domains.

### Migration

**Q: How do I adopt specs in an existing project?**  
A: 
1. `teamwerx specs init`
2. Create specs for your domains: `teamwerx specs create <domain>`
3. Use `--specs` flag on new changes
4. Existing changes work unchanged

**Q: Can I convert old spec-delta.md to the new format?**  
A: Not automatically. You can manually create a change and copy content using the delta format.

---

## Appendix

### Related Documents

- [OpenSpec Documentation](https://github.com/Fission-AI/OpenSpec)
- [Spec Management Guide](./SPEC_MANAGEMENT.md) (to be created)
- [Conflict Resolution Guide](./CONFLICT_RESOLUTION.md) (to be created)
- [Migration Guide](./MIGRATION_TO_HYBRID.md) (to be created)

### References

- [OpenSpec Parallel Merge Plan](https://github.com/Fission-AI/OpenSpec/blob/main/openspec-parallel-merge-plan.md)
- [3-Way Merge Algorithm](https://en.wikipedia.org/wiki/Merge_(version_control)#Three-way_merge)

### Glossary

- **Spec**: Specification document defining requirements and behavior
- **Delta**: A set of changes (ADDED/MODIFIED/REMOVED) to a spec
- **Fingerprint**: SHA-256 hash used to detect changes
- **Divergence**: When a spec has changed since a change proposal was created
- **Merge**: Applying deltas to update the source spec
- **Domain**: A logical grouping of specifications (e.g., auth, api, database)

---

**Document Status**: Planning  
**Next Review**: After Phase 1 completion  
**Maintainer**: TeamWERX Core Team
