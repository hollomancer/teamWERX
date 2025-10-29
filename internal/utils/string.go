package utils

import (
	"regexp"
	"strings"
)

var (
	// matchFirstCap inserts a hyphen between a single leading char and a following CamelCase word:
	// "userLogin" -> "user-Login"
	matchFirstCap = regexp.MustCompile("(.)([A-Z][a-z]+)")
	// matchAllCaps inserts a hyphen between a lowercase/number and an uppercase:
	// "HTMLParser" -> "HTML-Parser", "userID" -> "user-ID"
	matchAllCaps = regexp.MustCompile("([a-z0-9])([A-Z])")
	// nonAlnum matches runs of non-alphanumeric characters (including underscores and spaces).
	nonAlnum = regexp.MustCompile("[^a-zA-Z0-9]+")
	// multiHyphen collapses multiple consecutive hyphens into one.
	multiHyphen = regexp.MustCompile("-+")
)

// ToKebabCase converts a string to kebab-case.
//
// Behavior:
// - Preserves existing ASCII letters and digits.
// - Inserts hyphens for common camelCase / PascalCase boundaries.
// - Replaces any non-alphanumeric runs (spaces, punctuation, underscores) with a single hyphen.
// - Collapses multiple hyphens and trims leading/trailing hyphens.
// - Returns the result in lowercase.
//
// Examples:
//
//	"UserLogin"      -> "user-login"
//	"userLoginID"    -> "user-login-id"
//	"some_value+wow" -> "some-value-wow"
//	"  spaced  out " -> "spaced-out"
func ToKebabCase(s string) string {
	if s == "" {
		return ""
	}

	// Trim surrounding whitespace first.
	s = strings.TrimSpace(s)

	// Handle CamelCase boundaries first to avoid merging words incorrectly when non-alnum
	// replacements happen. This will insert hyphens where CamelCase changes occur.
	s = matchFirstCap.ReplaceAllString(s, "${1}-${2}")
	s = matchAllCaps.ReplaceAllString(s, "${1}-${2}")

	// Replace any non-alphanumeric sequences with a hyphen.
	s = nonAlnum.ReplaceAllString(s, "-")

	// Collapse multiple hyphens into one.
	s = multiHyphen.ReplaceAllString(s, "-")

	// Trim any leading/trailing hyphens that may have been introduced.
	s = strings.Trim(s, "-")

	// Lowercase for kebab-case.
	s = strings.ToLower(s)

	return s
}
