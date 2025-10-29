package file

import (
	"errors"
	"io"
	"os"
	"path/filepath"

	customerrors "github.com/teamwerx/teamwerx/internal/errors"
)

// Exists reports whether the given path exists.
// If an unexpected error occurs during stat, it is returned.
func Exists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

// IsDir reports whether the given path exists and is a directory.
// If the path does not exist, returns (false, ErrNotFound).
func IsDir(path string) (bool, error) {
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return false, customerrors.NewErrNotFound("path", path)
		}
		return false, err
	}
	return info.IsDir(), nil
}

// IsFile reports whether the given path exists and is a regular file.
// If the path does not exist, returns (false, ErrNotFound).
func IsFile(path string) (bool, error) {
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return false, customerrors.NewErrNotFound("path", path)
		}
		return false, err
	}
	return info.Mode().IsRegular(), nil
}

// EnsureParentDir ensures the parent directory for the given path exists,
// creating it (and necessary parents) if missing, with the provided permission bits.
func EnsureParentDir(path string, perm os.FileMode) error {
	dir := filepath.Dir(path)
	if dir == "" || dir == "." {
		return nil
	}
	return os.MkdirAll(dir, perm)
}

// MkdirAll creates a directory and all necessary parents with permission perm.
// If the directory already exists, it returns nil.
func MkdirAll(path string, perm os.FileMode) error {
	return os.MkdirAll(path, perm)
}

// ReadFile reads the contents of the file at path.
// Returns ErrNotFound if the file does not exist.
func ReadFile(path string) ([]byte, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, customerrors.NewErrNotFound("file", path)
		}
		return nil, err
	}
	return b, nil
}

// WriteFile writes data to the file at path with the given file permission bits.
// It ensures the parent directory exists before writing.
func WriteFile(path string, data []byte, perm os.FileMode) error {
	if err := EnsureParentDir(path, 0o755); err != nil {
		return err
	}
	// Use a temporary write then rename for better atomicity where supported.
	return SafeWriteAtomic(path, data, perm)
}

// Remove deletes the file or directory at path. For directories, it removes recursively.
// If the path does not exist, returns ErrNotFound.
func Remove(path string) error {
	err := os.RemoveAll(path)
	if err != nil {
		// RemoveAll does not report NotExist, so detect explicitly.
		if ok, statErr := Exists(path); statErr == nil && !ok {
			return customerrors.NewErrNotFound("path", path)
		}
		return err
	}
	return nil
}

// CopyFile copies a regular file from src to dst, preserving the source file's mode bits.
// It ensures the parent directory for dst exists.
// Returns ErrNotFound if src does not exist. Returns an error if src is a directory.
func CopyFile(src, dst string) error {
	srcInfo, err := os.Stat(src)
	if err != nil {
		if os.IsNotExist(err) {
			return customerrors.NewErrNotFound("file", src)
		}
		return err
	}
	if !srcInfo.Mode().IsRegular() {
		return customerrors.NewErrConflict("source is not a regular file")
	}

	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	if err := EnsureParentDir(dst, 0o755); err != nil {
		return err
	}

	out, err := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, srcInfo.Mode().Perm())
	if err != nil {
		return err
	}
	defer func() {
		_ = out.Close()
	}()

	if _, err := io.Copy(out, in); err != nil {
		return err
	}
	// Ensure data is flushed.
	if err := out.Sync(); err != nil {
		return err
	}
	return nil
}

// SafeWriteAtomic writes data to path using a best-effort atomic replace:
// it writes to a temporary file in the destination directory, fsyncs it,
// then renames it over the target and fsyncs the directory.
// Note: atomic guarantees depend on the underlying OS/filesystem.
func SafeWriteAtomic(path string, data []byte, perm os.FileMode) error {
	dir := filepath.Dir(path)
	base := filepath.Base(path)

	if err := EnsureParentDir(path, 0o755); err != nil {
		return err
	}

	// Create a temp file in the same directory to ensure rename does not cross filesystems.
	tmp, err := os.CreateTemp(dir, base+".tmp-*")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()

	// Ensure cleanup on failure.
	cleanup := func() {
		_ = os.Remove(tmpName)
	}

	// Write data
	if _, err := tmp.Write(data); err != nil {
		_ = tmp.Close()
		cleanup()
		return err
	}

	// Set mode (CreateTemp uses 0600 by default)
	if err := tmp.Chmod(perm); err != nil {
		_ = tmp.Close()
		cleanup()
		return err
	}

	// Flush file data
	if err := tmp.Sync(); err != nil {
		_ = tmp.Close()
		cleanup()
		return err
	}
	if err := tmp.Close(); err != nil {
		cleanup()
		return err
	}

	// Rename into place
	if err := os.Rename(tmpName, path); err != nil {
		cleanup()
		return err
	}

	// Best-effort fsync the directory to persist the rename metadata.
	dirFD, err := os.Open(dir)
	if err == nil {
		_ = dirFD.Sync()
		_ = dirFD.Close()
	}

	return nil
}

// MoveFile moves a file or directory from src to dst, creating parent directories for dst if needed.
// If src does not exist, returns ErrNotFound.
func MoveFile(src, dst string) error {
	if _, err := os.Stat(src); err != nil {
		if os.IsNotExist(err) {
			return customerrors.NewErrNotFound("path", src)
		}
		return err
	}
	if err := EnsureParentDir(dst, 0o755); err != nil {
		return err
	}
	// Attempt a simple rename first.
	if err := os.Rename(src, dst); err == nil {
		return nil
	} else if errors.Is(err, os.ErrInvalid) {
		// Fall back not strictly necessary; keep the error. Cross-device moves
		// would return EXDEV not ErrInvalid; handle that path below.
		return err
	} else {
		// If cross-device (EXDEV), fall back to copy + remove for regular files.
		// Detect file vs dir.
		info, statErr := os.Stat(src)
		if statErr != nil {
			return statErr
		}
		if info.IsDir() {
			// Use os.Rename error directly for directories, since recursive copy is out-of-scope.
			return err
		}
		if copyErr := CopyFile(src, dst); copyErr != nil {
			return copyErr
		}
		return Remove(src)
	}
}
