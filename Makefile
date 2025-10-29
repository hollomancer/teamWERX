# Makefile for the teamwerx Go project

.PHONY: build test lint clean

build:
	go build -v -o teamwerx ./cmd/teamwerx

test:
	go test -v ./...

lint:
	# Assuming golangci-lint is installed (go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run

clean:
	rm -f teamwerx
