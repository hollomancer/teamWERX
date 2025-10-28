package core

import (
	"bytes"
	"testing"

	"github.com/teamwerx/teamwerx/internal/model"
)

func TestSpecSerializer_Serialize_NoRequirements(t *testing.T) {
	serializer := NewSpecSerializer()
	spec := &model.Spec{
		Domain:       "test-domain",
		Content:      "",
		Requirements: []model.Requirement{},
	}

	result, err := serializer.Serialize(spec)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	expected := []byte("")
	if !bytes.Equal(result, expected) {
		t.Errorf("Expected empty bytes, got %s", string(result))
	}
}

func TestSpecSerializer_Serialize_SingleRequirement(t *testing.T) {
	serializer := NewSpecSerializer()
	spec := &model.Spec{
		Domain: "test-domain",
		Requirements: []model.Requirement{
			{
				ID:      "user-login",
				Title:   "User Login",
				Content: "### Requirement: User Login\n\nThe system must allow users to log in.\n\n",
			},
		},
	}

	result, err := serializer.Serialize(spec)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	expected := []byte("### Requirement: User Login\n\nThe system must allow users to log in.\n\n\n")
	if !bytes.Equal(result, expected) {
		t.Errorf("Expected %q, got %q", string(expected), string(result))
	}
}

func TestSpecSerializer_Serialize_MultipleRequirements(t *testing.T) {
	serializer := NewSpecSerializer()
	spec := &model.Spec{
		Domain: "test-domain",
		Requirements: []model.Requirement{
			{
				ID:      "user-registration",
				Title:   "User Registration",
				Content: "### Requirement: User Registration\n\nUsers must register.\n\n",
			},
			{
				ID:      "password-reset",
				Title:   "Password Reset",
				Content: "### Requirement: Password Reset\n\nUsers can reset passwords.\n\n",
			},
		},
	}

	result, err := serializer.Serialize(spec)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	expected := []byte("### Requirement: User Registration\n\nUsers must register.\n\n\n### Requirement: Password Reset\n\nUsers can reset passwords.\n\n\n")
	if !bytes.Equal(result, expected) {
		t.Errorf("Expected %q, got %q", string(expected), string(result))
	}
}

func TestSpecSerializer_Serialize_WithEmptyContent(t *testing.T) {
	serializer := NewSpecSerializer()
	spec := &model.Spec{
		Domain: "test-domain",
		Requirements: []model.Requirement{
			{
				ID:      "empty-req",
				Title:   "Empty Requirement",
				Content: "",
			},
		},
	}

	result, err := serializer.Serialize(spec)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	expected := []byte("\n")
	if !bytes.Equal(result, expected) {
		t.Errorf("Expected %q, got %q", string(expected), string(result))
	}
}
