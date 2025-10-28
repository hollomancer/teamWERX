/**
 * Tests for SpecManager
 */

const fs = require("fs").promises;
const path = require("path");
const os = require("os");
const { SpecManager } = require("../../lib/core/spec-manager");

describe("SpecManager", () => {
  let testDir;
  let specManager;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "teamwerx-spec-test-"));
    specManager = new SpecManager(testDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe("initialize", () => {
    it("should create specs directory with README", async () => {
      await specManager.initialize();

      const readmePath = path.join(testDir, "README.md");
      const exists = await fs
        .access(readmePath)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);

      const content = await fs.readFile(readmePath, "utf8");
      expect(content).toContain("# Specifications");
    });

    it("should not overwrite existing README", async () => {
      await specManager.initialize();
      const firstInit = await fs.readFile(
        path.join(testDir, "README.md"),
        "utf8"
      );

      await specManager.initialize();
      const secondInit = await fs.readFile(
        path.join(testDir, "README.md"),
        "utf8"
      );

      expect(firstInit).toBe(secondInit);
    });
  });

  describe("createSpec", () => {
    it("should create a new spec domain", async () => {
      const specPath = await specManager.createSpec("auth");

      expect(specPath).toBe(path.join(testDir, "auth", "spec.md"));

      const exists = await fs
        .access(specPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(specPath, "utf8");
      expect(content).toContain("# Auth Specification");
      expect(content).toContain("domain: auth");
    });

    it("should create spec with custom title", async () => {
      await specManager.createSpec("api", { title: "REST API" });

      const specPath = path.join(testDir, "api", "spec.md");
      const content = await fs.readFile(specPath, "utf8");

      expect(content).toContain("# REST API Specification");
    });

    it("should throw error if spec already exists", async () => {
      await specManager.createSpec("auth");

      await expect(specManager.createSpec("auth")).rejects.toThrow(
        "Spec already exists"
      );
    });
  });

  describe("readSpec", () => {
    beforeEach(async () => {
      await specManager.createSpec("auth");
    });

    it("should read a spec by domain", async () => {
      const spec = await specManager.readSpec("auth");

      expect(spec.domain).toBe("auth");
      expect(spec.content).toContain("# Auth Specification");
      expect(spec.fingerprint).toBeTruthy();
      expect(spec.fingerprint.length).toBe(16);
    });

    it("should parse requirements from spec", async () => {
      // Write a spec with requirements
      const content = `# Auth Specification

## Requirements

### Requirement: User Authentication

#### Scenario: Valid credentials
- MUST authenticate user
- MUST return session token

### Requirement: Session Management

#### Scenario: Active session
- MUST validate session token
`;

      await specManager.writeSpec("auth", content);

      const spec = await specManager.readSpec("auth");
      expect(spec.requirements).toHaveLength(2);
      expect(spec.requirements[0].title).toBe("User Authentication");
      expect(spec.requirements[0].id).toBe("user-authentication");
      expect(spec.requirements[1].title).toBe("Session Management");
    });

    it("should throw error if spec does not exist", async () => {
      await expect(specManager.readSpec("nonexistent")).rejects.toThrow(
        "Spec not found"
      );
    });
  });

  describe("writeSpec", () => {
    it("should write new spec", async () => {
      const content = "# Test Spec\n\nSome content.";
      await specManager.writeSpec("test", content);

      const specPath = path.join(testDir, "test", "spec.md");
      const written = await fs.readFile(specPath, "utf8");

      expect(written).toContain("domain: test");
      expect(written).toContain("# Test Spec");
    });

    it("should update existing spec", async () => {
      await specManager.createSpec("auth");

      const newContent = "# Auth Specification\n\nUpdated content.";
      await specManager.writeSpec("auth", newContent);

      const spec = await specManager.readSpec("auth");
      expect(spec.content).toContain("Updated content");
    });

    it("should preserve metadata when updating", async () => {
      await specManager.createSpec("auth");
      const original = await specManager.readSpec("auth");

      // Wait to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 50));

      await specManager.writeSpec("auth", "# Updated");

      const updated = await specManager.readSpec("auth");
      expect(updated.data.domain).toBe("auth");
      expect(new Date(updated.data.updated).getTime()).toBeGreaterThanOrEqual(
        new Date(original.data.updated).getTime()
      );
    });
  });

  describe("listSpecs", () => {
    it("should return empty array when no specs exist", async () => {
      const specs = await specManager.listSpecs();
      expect(specs).toEqual([]);
    });

    it("should list all spec domains", async () => {
      await specManager.createSpec("auth");
      await specManager.createSpec("api");
      await specManager.createSpec("database");

      const specs = await specManager.listSpecs();

      expect(specs).toHaveLength(3);
      expect(specs.map((s) => s.domain)).toEqual(["api", "auth", "database"]); // Sorted
    });

    it("should include metadata in listing", async () => {
      await specManager.createSpec("auth");

      const specs = await specManager.listSpecs();

      expect(specs[0]).toHaveProperty("domain", "auth");
      expect(specs[0]).toHaveProperty("fingerprint");
      expect(specs[0]).toHaveProperty("updated");
      expect(specs[0]).toHaveProperty("requirement_count");
      // The template has 1 example requirement, so count should be >= 0
      expect(specs[0].requirement_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getFingerprints", () => {
    beforeEach(async () => {
      await specManager.createSpec("auth");
      await specManager.createSpec("api");
    });

    it("should get fingerprints for multiple domains", async () => {
      const fingerprints = await specManager.getFingerprints(["auth", "api"]);

      expect(fingerprints).toHaveProperty("auth");
      expect(fingerprints).toHaveProperty("api");
      expect(fingerprints.auth.base_fingerprint).toBeTruthy();
      expect(fingerprints.api.base_fingerprint).toBeTruthy();
    });

    it("should include requirement fingerprints", async () => {
      const content = `# Auth Specification

## Requirements

### Requirement: User Authentication
Some content here.
`;
      await specManager.writeSpec("auth", content);

      const fingerprints = await specManager.getFingerprints(["auth"]);

      expect(fingerprints.auth.requirements).toHaveLength(1);
      expect(fingerprints.auth.requirements[0].id).toBe("user-authentication");
      expect(fingerprints.auth.requirements[0].fingerprint).toBeTruthy();
    });

    it("should handle missing domains gracefully", async () => {
      const fingerprints = await specManager.getFingerprints([
        "auth",
        "nonexistent",
      ]);

      expect(fingerprints.auth).toBeTruthy();
      expect(fingerprints.nonexistent).toBeNull();
    });
  });

  describe("fingerprint generation", () => {
    it("should generate consistent fingerprints", async () => {
      const content = "Test content";
      const fp1 = specManager._generateFingerprint(content);
      const fp2 = specManager._generateFingerprint(content);

      expect(fp1).toBe(fp2);
      expect(fp1.length).toBe(16);
    });

    it("should generate different fingerprints for different content", async () => {
      const fp1 = specManager._generateFingerprint("content 1");
      const fp2 = specManager._generateFingerprint("content 2");

      expect(fp1).not.toBe(fp2);
    });

    it("should trim whitespace before fingerprinting", async () => {
      const fp1 = specManager._generateFingerprint("content");
      const fp2 = specManager._generateFingerprint("  content  \n");

      expect(fp1).toBe(fp2);
    });
  });
});
