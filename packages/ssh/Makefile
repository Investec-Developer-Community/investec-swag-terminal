.PHONY: build run run/live test tidy audit

BINARY := bin/ssh-server

## build: Build the SSH server binary
build:
	go build -o $(BINARY) ./cmd/ssh/main.go

## run: Build and run the SSH server
run: build
	./$(BINARY)

## run/live: Run with live reloading (requires air)
run/live:
	air --build.cmd "go build -o $(BINARY) ./cmd/ssh/main.go" --build.bin "./$(BINARY)"

## test: Run all tests with race detection
test:
	go test -race -v ./...

## tidy: Format code and tidy modules
tidy:
	go fmt ./...
	go mod tidy

## audit: Quality checks
audit:
	go vet ./...
