# Lapdev Test Suite

This directory contains the test suite for Lapdev, an open-source Web IDE.

## Test Framework

- **E2E Testing**: Playwright
- **Unit Testing**: Deno Test (for TypeScript) + Cargo Test (for Rust)

## Directory Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── fixtures/           # Test fixtures and helpers
│   │   ├── ai.fixture.ts   # AI-related fixtures
│   │   ├── git.fixture.ts  # Git operations fixtures
│   │   └── ide.fixture.ts  # IDE core fixtures
│   ├── ai-chat.test.ts     # AI chat tests
│   ├── code-completion.test.ts  # Code completion tests
│   ├── editor.test.ts      # Editor tests
│   ├── file-tree.test.ts   # File tree tests
│   ├── git.test.ts         # Git tests
│   └── terminal.test.ts    # Terminal tests
└── README.md               # This file
```

## Setup Instructions

### Prerequisites

1. Install Node.js (v20+) and npm
2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Install Dependencies

```bash
npm install
```

## Running Tests

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests with headed browser
npm run test:e2e:headed

# Show test report
npm run test:e2e:report
```

### Unit Tests (Deno)

```bash
npm run test:unit
```

### Rust Tests

```bash
npm run test:rust
```

### Run All Tests

```bash
npm test
```

## Fixtures Overview

### IDE Fixtures
- `FileTreeHelper`: File creation, deletion, renaming
- `EditorHelper`: Code editing, saving, syntax highlighting
- `TerminalHelper`: Terminal command execution

### AI Fixtures
- `AIChatHelper`: AI chat panel interactions
- `CodeCompletionHelper`: Code suggestion features

### Git Fixtures
- `GitHelper`: Git operations (stage, commit, push, branch)

## Best Practices

### Selector Strategy
- Use `data-testid` attributes for stable selectors
- Avoid CSS selectors that may change with styling

### Test Isolation
- Each test should be independent
- Clean up after each test
- Use fixtures for shared setup/teardown

### CI Integration
- Tests run in parallel by default in CI
- Artifacts (screenshots, videos, traces) are retained on failure
- JUnit reports are generated for CI dashboards

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `http://localhost:3000` |
| `API_URL` | API server URL | `http://localhost:8080` |
| `TEST_ENV` | Test environment | `development` |

### Playwright Configuration

See `playwright.config.ts` for:
- Timeout settings
- Browser configurations
- Reporter settings
- Parallel execution options

## CI Notes

- Use `CI=true` environment variable for CI-specific behavior
- Tests are retried 2 times in CI on failure
- Worker count is set to 4 in CI for parallel execution