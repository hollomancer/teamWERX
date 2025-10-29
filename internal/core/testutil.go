package core

import (
	"os"
)

// createTempDir creates a temporary directory and registers a cleanup callback
// on the provided test-like object. The parameter accepts any value that
// implements a Cleanup(func()) method (for example *testing.T).
//
// Usage from tests:
//
//	baseDir := createTempDir(t)
//
// The directory will be removed automatically when the test finishes.
func createTempDir(t interface{ Cleanup(func()) }) string {
	dir, err := os.MkdirTemp("", "teamwerx_test")
	if err != nil {
		// In tests it's appropriate to fail fast; panic will surface the error.
		panic(err)
	}

	// Register cleanup via the provided test helper.
	t.Cleanup(func() { _ = os.RemoveAll(dir) })

	return dir
}
