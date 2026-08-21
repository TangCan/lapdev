---
name: bmad-tea-teams
description: TEA (Test Architect) team and workflow overview — Murat (Master Test Architect) and the step-file architecture. Covers tri-modal workflows, testing strategies, and tooling.
whenToUse: When working with TEA for test architecture, quality assurance strategy, or test automation planning
---

# TEA (Test Architect) — Team & Workflow Overview

**Original source:** `_bmad/config.toml` [agents.tea-agent-murat], `_bmad/tea/module-help.csv`

TEA handles test architecture, quality assurance strategy, and risk-based testing for software projects.

## Agent

| Agent | Role | Icon | Description |
|-------|------|------|-------------|
| **Murat** | Master Test Architect | 🧪 | Risk-based testing strategy, ATDD, API/UI automation, and contract testing. Employs Playwright, Cypress, pytest, and JUnit. Plans test strategy before writing tests, validates with CI gates |

## Team

| Team |
|------|
| software-development |

## Capabilities

### Testing Tools
- **Playwright** — browser automation for E2E testing
- **Cypress** — component and E2E testing
- **pytest** — Python testing framework
- **JUnit** — Java testing framework
- **Pact** — contract testing

### Configuration
```toml
tea_use_playwright_utils = true
tea_use_pactjs_utils = false
tea_pact_mcp = "none"
tea_browser_automation = "auto"
tea_execution_mode = "auto"
tea_capability_probe = true
test_stack_type = "auto"
ci_platform = "auto"
test_framework = "auto"
risk_threshold = "p1"
```

### Output Locations
- **Test Artifacts:** `{project-root}/_bmad-output/test-artifacts/`
- **Test Design:** `_bmad-output/test-artifacts/test-design`
- **Test Reviews:** `_bmad-output/test-artifacts/test-reviews`
- **Traceability:** `_bmad-output/test-artifacts/traceability`

## Workflows

TEA workflows follow the step-file architecture (see `bmad-tea-testarch` skill for details):
- teach-me-testing
- test-design
- framework
- ci
- atdd
- automate
- test-review
- nfr-assess
- trace

## Quality Gates

- Risk threshold: P1 (priority 1 issues)
- Capability probe: enabled (auto-detects available tools)
- Execution mode: auto (adapts to project context)
- CI platform: auto (detects from environment)
