package main

import (
	"fmt"

	"github.com/teamwerx/teamwerx/internal/core"
)

func main() {
	// For now, we assume the command is run from the project root
	specManager := core.NewSpecManager(".teamwerx/specs")

	specs, err := specManager.ListSpecs()
	if err != nil {
		fmt.Println("Error:", err)
		return
	}

	fmt.Println("Found specs:")
	for _, spec := range specs {
		fmt.Printf("- Domain: %s\n", spec.Domain)
		fmt.Printf("  Requirements (%d):\n", len(spec.Requirements))
		for _, req := range spec.Requirements {
			fmt.Printf("    - ID: %s, Title: %s\n", req.ID, req.Title)
		}
	}
}
