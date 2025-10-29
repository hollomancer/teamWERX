package core

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// TestE2E_MultiSpecMultiDeltaApply exercises a multi-domain, multi-delta change apply:
// 1) Seed two specs: auth and billing
// 2) Seed a change with:
//   - ADDED requirement for auth (MFA)
//   - MODIFIED requirement for billing (Payment -> add PCI DSS mention)
//
// 3) change apply -> expect success
// 4) Verify both specs reflect the changes
func TestE2E_MultiSpecMultiDeltaApply(t *testing.T) {
	t.Parallel()

	repoRoot := findRepoRoot(t)
	binPath := buildCLI(t, repoRoot)

	// Workspace with default .teamwerx paths
	ws := t.TempDir()
	specsDir := filepath.Join(ws, ".teamwerx", "specs")
	changesDir := filepath.Join(ws, ".teamwerx", "changes")

	// Seed auth spec
	authDir := filepath.Join(specsDir, "auth")
	mkdirAll(t, authDir)
	writeFile(t, filepath.Join(authDir, "spec.md"), []byte(`# Auth Spec

### Requirement: Login

Users must be able to authenticate with credentials.

### Requirement: Logout

Users must be able to logout.
`))

	// Seed billing spec
	billingDir := filepath.Join(specsDir, "billing")
	mkdirAll(t, billingDir)
	writeFile(t, filepath.Join(billingDir, "spec.md"), []byte(`# Billing Spec

### Requirement: Payment

Handle customer payments securely.

### Requirement: Invoice

Generate invoices for completed orders.
`))

	// Seed change with two deltas
	chID := "CH-002"
	chDir := filepath.Join(changesDir, chID)
	mkdirAll(t, chDir)

	type deltaOperation struct {
		Type        string `json:"type"`
		Requirement struct {
			ID      string `json:"id"`
			Title   string `json:"title"`
			Content string `json:"content"`
		} `json:"requirement"`
	}
	type specDelta struct {
		Domain          string           `json:"domain"`
		BaseFingerprint string           `json:"base_fingerprint,omitempty"`
		Operations      []deltaOperation `json:"operations"`
	}
	type change struct {
		ID         string      `json:"id"`
		Title      string      `json:"title"`
		Status     string      `json:"status"`
		CreatedAt  time.Time   `json:"created_at"`
		SpecDeltas []specDelta `json:"spec_deltas"`
	}

	// ADDED requirement for auth: MFA
	addMFA := deltaOperation{Type: "ADDED"}
	addMFA.Requirement.ID = "mfa"
	addMFA.Requirement.Title = "MFA"
	addMFA.Requirement.Content = "### Requirement: MFA\n\nThe system shall support multi-factor authentication for high-risk actions.\n\n"

	// MODIFIED requirement for billing: Payment (add PCI DSS mention)
	modPayment := deltaOperation{Type: "MODIFIED"}
	modPayment.Requirement.ID = "payment"
	modPayment.Requirement.Title = "Payment"
	modPayment.Requirement.Content = "### Requirement: Payment\n\nHandle customer payments securely and in compliance with PCI DSS.\n\n"

	ch := change{
		ID:        chID,
		Title:     "Auth MFA and Billing Payment updates",
		Status:    "draft",
		CreatedAt: time.Now(),
		SpecDeltas: []specDelta{
			{
				Domain:     "auth",
				Operations: []deltaOperation{addMFA},
			},
			{
				Domain:     "billing",
				Operations: []deltaOperation{modPayment},
			},
		},
	}

	data, err := json.MarshalIndent(&ch, "", "  ")
	if err != nil {
		t.Fatalf("marshal change failed: %v", err)
	}
	writeFile(t, filepath.Join(chDir, "change.json"), append(data, '\n'))

	// Apply the change (defaults to .teamwerx under CWD)
	out := runCLIWithDir(t, binPath, ws, []string{"change", "apply", "--id", chID})
	if !strings.Contains(out, "Applied change CH-002") {
		t.Fatalf("change apply unexpected output:\n%s", out)
	}

	// Verify auth spec includes MFA requirement
	authSpecBytes, rerr := os.ReadFile(filepath.Join(authDir, "spec.md"))
	if rerr != nil {
		t.Fatalf("reading auth spec failed: %v", rerr)
	}
	authSpec := string(authSpecBytes)
	if !strings.Contains(authSpec, "Requirement: MFA") ||
		!strings.Contains(authSpec, "support multi-factor authentication") {
		t.Fatalf("auth spec did not include MFA addition:\n%s", authSpec)
	}

	// Verify billing spec includes updated Payment text with PCI DSS
	billingSpecBytes, rerr := os.ReadFile(filepath.Join(billingDir, "spec.md"))
	if rerr != nil {
		t.Fatalf("reading billing spec failed: %v", rerr)
	}
	billingSpec := string(billingSpecBytes)
	if !strings.Contains(billingSpec, "Requirement: Payment") ||
		!strings.Contains(billingSpec, "PCI DSS") {
		t.Fatalf("billing spec did not include updated Payment content:\n%s", billingSpec)
	}
}
