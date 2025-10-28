/**
 * Integration tests for spec merge workflows
 */

const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { SpecManager } = require("../../lib/core/spec-manager");
const { SpecDeltaParser } = require("../../lib/core/spec-delta-parser");
const { SpecMerger } = require("../../lib/core/spec-merger");
const { ChangeManager } = require("../../lib/core/change-manager");

describe("Spec Merge Integration", () => {
  let testDir;
  let specManager;
  let changeManager;
  let specMerger;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "teamwerx-merge-test-"));

    // IMPORTANT: Change directory FIRST before setting env var
    // because getTeamwerxDir() will use process.cwd()
    const originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .teamwerx structure
    await fs.mkdir(path.join(testDir, ".teamwerx"), { recursive: true });
    await fs.mkdir(path.join(testDir, ".teamwerx", "specs"), {
      recursive: true,
    });
    await fs.mkdir(path.join(testDir, ".teamwerx", "changes"), {
      recursive: true,
    });
    await fs.mkdir(path.join(testDir, ".teamwerx", "goals"), {
      recursive: true,
    });

    // Now instantiate managers (they will pick up correct directory)
    specManager = new SpecManager();
    changeManager = new ChangeManager();
    specMerger = new SpecMerger(specManager);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
    delete process.env.TEAMWERX_DIR;
  });

  describe("Happy Path - Fast Forward Merge", () => {
    it("should successfully merge ADDED requirements", async () => {
      // 1. Create base spec
      await specManager.createSpec("auth");
      const baseSpec = await specManager.readSpec("auth");

      // 2. Create change with spec tracking
      const change = await changeManager.createChange("Add 2FA", {
        specs: ["auth"],
      });

      // 3. Write spec delta (directory already created by ChangeManager)
      const deltaPath = path.join(change.path, "specs", "auth", "spec.md");
      const deltaContent = `---
change: ${change.id}
domain: auth
delta_type: spec
---

# Spec Delta: auth

## ADDED Requirements

### Requirement: Two-Factor Authentication

#### Scenario: TOTP generation
- MUST generate TOTP codes
- MUST use 6-digit format

## MODIFIED Requirements

## REMOVED Requirements
`;
      await fs.writeFile(deltaPath, deltaContent, "utf8");

      // 4. Get base fingerprints
      const proposal = await changeManager.readChange(change.id);
      const baseFingerprints = proposal.proposal.frontmatter.spec_fingerprints;

      // 5. Merge
      const result = await specMerger.mergeChange(
        change.id,
        change.path,
        baseFingerprints,
        { silent: true }
      );

      // Assertions
      expect(result.success).toBe(true);
      expect(result.domains_merged).toHaveLength(1);
      expect(result.domains_merged[0].operations_applied.ADDED).toBe(1);
      expect(result.conflicts).toHaveLength(0);

      // Verify spec was updated
      const updatedSpec = await specManager.readSpec("auth");
      expect(updatedSpec.content).toContain("Two-Factor Authentication");
    });

    it("should successfully merge MODIFIED requirements", async () => {
      // 1. Create base spec with existing requirement
      await specManager.createSpec("auth");
      const baseContent = `# Auth Specification

## Requirements

### Requirement: User Authentication

#### Scenario: Valid credentials
- MUST authenticate user
- MUST return session token
`;
      await specManager.writeSpec("auth", baseContent);

      // 2. Create change
      const change = await changeManager.createChange("Update Auth", {
        specs: ["auth"],
      });

      // 3. Write spec delta with MODIFIED requirement
      const deltaPath = path.join(change.path, "specs", "auth", "spec.md");
      const deltaContent = `---
change: ${change.id}
domain: auth
delta_type: spec
---

# Spec Delta: auth

## ADDED Requirements

## MODIFIED Requirements

### Requirement: User Authentication

#### Scenario: Valid credentials
- MUST authenticate user with email and password
- MUST return JWT session token
- MUST set httpOnly cookie

## REMOVED Requirements
`;
      await fs.writeFile(deltaPath, deltaContent, "utf8");

      // 4. Merge
      const proposal = await changeManager.readChange(change.id);
      const result = await specMerger.mergeChange(
        change.id,
        change.path,
        proposal.proposal.frontmatter.spec_fingerprints,
        { silent: true }
      );

      // Assertions
      expect(result.success).toBe(true);
      expect(result.domains_merged[0].operations_applied.MODIFIED).toBe(1);

      // Verify spec was updated
      const updatedSpec = await specManager.readSpec("auth");
      expect(updatedSpec.content).toContain("JWT session token");
      expect(updatedSpec.content).toContain("httpOnly cookie");
    });

    it("should successfully merge REMOVED requirements", async () => {
      // 1. Create base spec with requirements
      await specManager.createSpec("auth");
      const baseContent = `# Auth Specification

## Requirements

### Requirement: User Authentication
Content here

### Requirement: Deprecated Feature
This will be removed
`;
      await specManager.writeSpec("auth", baseContent);

      // 2. Create change
      const change = await changeManager.createChange("Remove deprecated", {
        specs: ["auth"],
      });

      // 3. Write spec delta
      const deltaPath = path.join(change.path, "specs", "auth", "spec.md");
      const deltaContent = `---
change: ${change.id}
domain: auth
delta_type: spec
---

# Spec Delta: auth

## ADDED Requirements

## MODIFIED Requirements

## REMOVED Requirements

### Requirement: Deprecated Feature
`;
      await fs.writeFile(deltaPath, deltaContent, "utf8");

      // 4. Merge
      const proposal = await changeManager.readChange(change.id);
      const result = await specMerger.mergeChange(
        change.id,
        change.path,
        proposal.proposal.frontmatter.spec_fingerprints,
        { silent: true }
      );

      // Assertions
      expect(result.success).toBe(true);
      expect(result.domains_merged[0].operations_applied.REMOVED).toBe(1);

      // Verify spec was updated
      const updatedSpec = await specManager.readSpec("auth");
      expect(updatedSpec.content).not.toContain("Deprecated Feature");
      expect(updatedSpec.content).toContain("User Authentication");
    });
  });

  describe("Conflict Detection", () => {
    it("should detect spec divergence", async () => {
      // 1. Create base spec
      await specManager.createSpec("auth");

      // 2. Create change
      const change = await changeManager.createChange("Add feature", {
        specs: ["auth"],
      });

      // 3. Modify base spec (simulate another change)
      const modifiedContent = `# Auth Specification

## Requirements

### Requirement: New Feature
This was added by another change
`;
      await specManager.writeSpec("auth", modifiedContent);

      // 4. Write spec delta
      const deltaPath = path.join(change.path, "specs", "auth", "spec.md");
      const deltaContent = `---
change: ${change.id}
domain: auth
delta_type: spec
---

# Spec Delta: auth

## ADDED Requirements

### Requirement: Another Feature
My feature

## MODIFIED Requirements

## REMOVED Requirements
`;
      await fs.writeFile(deltaPath, deltaContent, "utf8");

      // 5. Try to merge (should detect divergence)
      const proposal = await changeManager.readChange(change.id);

      await expect(
        specMerger.mergeChange(
          change.id,
          change.path,
          proposal.proposal.frontmatter.spec_fingerprints,
          { silent: true }
        )
      ).rejects.toThrow("divergence");
    });

    it("should allow force merge on divergence", async () => {
      // 1. Create base spec
      await specManager.createSpec("auth");

      // 2. Create change
      const change = await changeManager.createChange("Add feature", {
        specs: ["auth"],
      });

      // 3. Modify base spec
      await specManager.writeSpec(
        "auth",
        "# Auth Spec\n\n## Requirements\n\n### Requirement: Modified\nContent"
      );

      // 4. Write delta
      const deltaPath = path.join(change.path, "specs", "auth", "spec.md");
      const deltaContent = `---
change: ${change.id}
domain: auth
---

# Spec Delta: auth

## ADDED Requirements

### Requirement: New Feature
Content

## MODIFIED Requirements

## REMOVED Requirements
`;
      await fs.writeFile(deltaPath, deltaContent, "utf8");

      // 5. Force merge
      const proposal = await changeManager.readChange(change.id);
      const result = await specMerger.mergeChange(
        change.id,
        change.path,
        proposal.proposal.frontmatter.spec_fingerprints,
        { force: true, silent: true }
      );

      // Should succeed with force
      expect(result.success).toBe(true);
      expect(result.domains_merged[0].diverged).toBe(true);
    });

    it("should detect internal delta conflicts", async () => {
      // Delta parser should catch this during validation
      const deltaParser = new SpecDeltaParser();

      const badDelta = `---
domain: auth
---

# Delta

## ADDED Requirements

### Requirement: Test Feature
Content

## REMOVED Requirements

### Requirement: Test Feature
Same requirement
`;

      const delta = deltaParser.parseDelta(badDelta, { domain: "auth" });
      const conflicts = deltaParser.findConflicts(delta);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe("ADDED_AND_REMOVED");
    });
  });

  describe("Dry Run Mode", () => {
    it("should preview merge without applying changes", async () => {
      // 1. Create base spec
      await specManager.createSpec("auth");
      const originalContent = (await specManager.readSpec("auth")).content;

      // 2. Create change
      const change = await changeManager.createChange("Add feature", {
        specs: ["auth"],
      });

      // 3. Write delta
      const deltaPath = path.join(change.path, "specs", "auth", "spec.md");
      const deltaContent = `---
change: ${change.id}
domain: auth
---

# Spec Delta

## ADDED Requirements

### Requirement: Preview Feature
Content

## MODIFIED Requirements

## REMOVED Requirements
`;
      await fs.writeFile(deltaPath, deltaContent, "utf8");

      // 4. Dry run
      const proposal = await changeManager.readChange(change.id);
      const result = await specMerger.mergeChange(
        change.id,
        change.path,
        proposal.proposal.frontmatter.spec_fingerprints,
        { dryRun: true, silent: true }
      );

      // Should show what would happen
      expect(result.success).toBe(true);
      expect(result.domains_merged[0].operations_applied.ADDED).toBe(1);

      // But spec should not be modified
      const currentContent = (await specManager.readSpec("auth")).content;
      expect(currentContent).toBe(originalContent);
    });
  });
});
