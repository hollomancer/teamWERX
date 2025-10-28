package core

import (
	"testing"
)

func TestSpecParser_Parse_NoRequirements(t *testing.T) {
	parser := NewSpecParser()
	content := []byte(`# Domain Spec

This is a spec without any requirements.

## Subsection

More content here.`)

	spec, err := parser.Parse(content)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if spec.Content != string(content) {
		t.Errorf("Expected content to match input, got %s", spec.Content)
	}

	if len(spec.Requirements) != 0 {
		t.Errorf("Expected 0 requirements, got %d", len(spec.Requirements))
	}
}

func TestSpecParser_Parse_SingleRequirement(t *testing.T) {
	parser := NewSpecParser()
	content := []byte(`# Domain Spec

This is a spec with one requirement.

### Requirement: User Login

The system must allow users to log in with email and password.

## Another Section

More content.`)

	spec, err := parser.Parse(content)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(spec.Requirements) != 1 {
		t.Errorf("Expected 1 requirement, got %d", len(spec.Requirements))
	}

	req := spec.Requirements[0]
	if req.ID != "user-login" {
		t.Errorf("Expected ID 'user-login', got '%s'", req.ID)
	}
	if req.Title != "User Login" {
		t.Errorf("Expected Title 'User Login', got '%s'", req.Title)
	}
	if req.Content == "" {
		t.Error("Expected non-empty content for requirement")
	}
}

func TestSpecParser_Parse_MultipleRequirements(t *testing.T) {
	parser := NewSpecParser()
	content := []byte(`# Domain Spec

### Requirement: User Registration

Users must be able to register.

### Requirement: Password Reset

Users can reset passwords.

## End Section`)

	spec, err := parser.Parse(content)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(spec.Requirements) != 2 {
		t.Errorf("Expected 2 requirements, got %d", len(spec.Requirements))
	}

	// Check first requirement
	req1 := spec.Requirements[0]
	if req1.ID != "user-registration" {
		t.Errorf("Expected ID 'user-registration', got '%s'", req1.ID)
	}
	if req1.Title != "User Registration" {
		t.Errorf("Expected Title 'User Registration', got '%s'", req1.Title)
	}

	// Check second requirement
	req2 := spec.Requirements[1]
	if req2.ID != "password-reset" {
		t.Errorf("Expected ID 'password-reset', got '%s'", req2.ID)
	}
	if req2.Title != "Password Reset" {
		t.Errorf("Expected Title 'Password Reset', got '%s'", req2.Title)
	}
}

func TestSpecParser_Parse_WithOtherHeadings(t *testing.T) {
	parser := NewSpecParser()
	content := []byte(`# Domain Spec

## Overview

This is an overview.

### Requirement: Core Feature

The core feature description.

#### Subheading

Sub content.

### Requirement: Another Feature

Another description.

# Another Top Level`)

	spec, err := parser.Parse(content)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(spec.Requirements) != 2 {
		t.Errorf("Expected 2 requirements, got %d", len(spec.Requirements))
	}

	// Requirements should ignore non-requirement level 3 headings
	req1 := spec.Requirements[0]
	if req1.Title != "Core Feature" {
		t.Errorf("Expected Title 'Core Feature', got '%s'", req1.Title)
	}

	req2 := spec.Requirements[1]
	if req2.Title != "Another Feature" {
		t.Errorf("Expected Title 'Another Feature', got '%s'", req2.Title)
	}
}
