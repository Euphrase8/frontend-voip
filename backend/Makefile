# VoIP Backend Makefile

# Variables
BINARY_NAME=voip-backend
MAIN_PATH=./main.go
BUILD_DIR=./build
GO_FILES=$(shell find . -name "*.go" -type f)

# Default target
.PHONY: all
all: build

# Build the application
.PHONY: build
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Run the application
.PHONY: run
run:
	@echo "Running $(BINARY_NAME)..."
	@go run $(MAIN_PATH)

# Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
.PHONY: dev
dev:
	@echo "Starting development server with hot reload..."
	@air

# Test the application
.PHONY: test
test:
	@echo "Running tests..."
	@go test -v ./...

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -f voip.db
	@echo "Clean complete"

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

# Format code
.PHONY: fmt
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# Lint code (requires golangci-lint)
.PHONY: lint
lint:
	@echo "Linting code..."
	@golangci-lint run

# Build for production
.PHONY: build-prod
build-prod:
	@echo "Building for production..."
	@mkdir -p $(BUILD_DIR)
	@CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Production build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Create release archive
.PHONY: release
release: build-prod
	@echo "Creating release archive..."
	@tar -czf $(BUILD_DIR)/$(BINARY_NAME)-linux.tar.gz -C $(BUILD_DIR) $(BINARY_NAME)
	@echo "Release archive created: $(BUILD_DIR)/$(BINARY_NAME)-linux.tar.gz"

# Setup development environment
.PHONY: setup
setup:
	@echo "Setting up development environment..."
	@cp .env.example .env
	@echo "Please edit .env file with your configuration"
	@go mod download
	@echo "Setup complete"

# Database operations
.PHONY: db-reset
db-reset:
	@echo "Resetting database..."
	@rm -f voip.db
	@echo "Database reset complete"

# Show help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build      - Build the application"
	@echo "  run        - Run the application"
	@echo "  dev        - Run with hot reload (requires air)"
	@echo "  test       - Run tests"
	@echo "  clean      - Clean build artifacts"
	@echo "  deps       - Install dependencies"
	@echo "  fmt        - Format code"
	@echo "  lint       - Lint code (requires golangci-lint)"
	@echo "  build-prod - Build for production"
	@echo "  release    - Create release archive"
	@echo "  setup      - Setup development environment"
	@echo "  db-reset   - Reset database"
	@echo "  help       - Show this help"
