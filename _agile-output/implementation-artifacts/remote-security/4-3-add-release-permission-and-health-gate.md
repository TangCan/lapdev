---
status: done
story_id: '4.3'
story_key: 4-3-add-release-permission-and-health-gate
epic: epic-4
---

# Story 4.3: Add release permission and health gate

As a maintainer,
I want CI to verify minimum-permission startup before publishing an image,
So that a green build cannot hide an unsafe or unusable deployment.

## Acceptance Criteria

1. Layered tests, profile validation, minimum-permission startup, and health checks pass before publication.
2. Environment limitations are classified separately from product/security failures.
3. Runtime port, path, and permission drift blocks publication with an actionable finding.

## Security Decisions

- The image is loaded locally, exercised under the production entrypoint, health-checked, and only then pushed.
- Static permission and runtime-contract checks run before image build; environment failures use exit code 2.
- No secrets are passed to the permission gate or embedded in test output.

## Review Triage Log

- Manual adversarial review: no blocking findings.
- Verified the gate distinguishes environment exit code 2 from drift/security exit code 1.
- Verified image publication occurs only after local image health passes; failed health checks stop the workflow before push.
- Verified no secrets are passed to the gate or included in diagnostics.
