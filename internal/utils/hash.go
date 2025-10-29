package utils

import (
	"crypto/sha256"
	"fmt"
	"strings"
)

// FingerprintBytes controls how many bytes of the SHA-256 hash are used
// as the fingerprint. 8 bytes => 16 hex characters which is a compact
// but reasonably collision-resistant identifier for human consumption.
const FingerprintBytes = 8

// GenerateFingerprint computes a stable, compact fingerprint for the given
// content. The function trims surrounding whitespace before hashing so that
// incidental leading/trailing newlines or spaces do not change the fingerprint.
//
// If the (trimmed) content is empty, an empty string is returned.
func GenerateFingerprint(content string) string {
	s := strings.TrimSpace(content)
	if s == "" {
		return ""
	}

	sum := sha256.Sum256([]byte(s))
	// Use the first FingerprintBytes bytes of the hash and return hex.
	return fmt.Sprintf("%x", sum[:FingerprintBytes])
}
