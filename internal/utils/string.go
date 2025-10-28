package utils

import (
	"regexp"
	"strings"
)

var (
	matchFirstCap = regexp.MustCompile("(.)([A-Z][a-z]+)")
	matchAllCaps  = regexp.MustCompile("([a-z0-9])([A-Z])")
)

// ToKebabCase converts a string to kebab-case.
func ToKebabCase(str string) string {
	snake := matchFirstCap.ReplaceAllString(str, "${1}-${2}")
	snake = matchAllCaps.ReplaceAllString(snake, "${1}-${2}")
	return strings.ToLower(snake)
}
