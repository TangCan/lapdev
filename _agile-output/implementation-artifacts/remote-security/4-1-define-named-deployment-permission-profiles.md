---
status: in-review
story_id: '4.1'
story_key: 4-1-define-named-deployment-permission-profiles
epic: epic-4
---

# Story 4.1: Define named deployment permission profiles

As an operator,
I want a named deployment profile describing required permissions,
So that local-trusted and remote-shared deployments are reproducible and reviewable.

## Acceptance Criteria

1. A selected profile resolves filesystem, network, environment, and subprocess permissions from one named contract.
2. An operation omitted from the remote-shared profile is denied or reported as unsupported before execution.
3. Unknown or malformed profiles fail startup with a safe diagnostic before serving remote requests.

## Security Decisions

- Supported profiles are `local-trusted` and `remote-shared`; there is no implicit third profile.
- The profile is declarative and contains no secret values.
- Capability checks consume the profile contract; later startup hardening will translate it into explicit Deno/container flags.

## Review Triage Log

- Manual adversarial review: no blocking findings.
- Verified read/write filesystem checks are distinct, remote-shared interactive subprocesses are denied, and malformed profile values fail before `Deno.serve` starts.
- Verified profile contracts contain only capability names and path classes; no secret values are stored in the profile.
