# Makefile for the teamwerx Go project

.PHONY: build test lint clean

build:
	go build -v -o teamwerx ./cmd/teamwerx

test:
	go test -v ./...

lint:
	# CI runs golangci-lint via GitHub Action; locally, ensure golangci-lint is installed (e.g., v1.54.2)
	golangci-lint run

clean:
	rm -f teamwerx
