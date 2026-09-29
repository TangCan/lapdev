---
status: done
story_id: '4.2'
story_key: 4-2-replace-full-permission-startup-with-tested-minimum-permissi
epic: epic-4
---

# Story 4.2: Replace full-permission startup with tested minimum permissions

As a maintainer,
I want the release entrypoint to use the smallest tested permissions,
So that deployment security does not depend on Deno `-A` or container-wide access.

## Acceptance Criteria

1. The release entrypoint uses explicit Deno permissions selected by the deployment profile.
2. Workspace, health, WebSocket, Git, LSP, and process behavior are covered by minimum-permission contract tests.
3. Missing permissions report the profile/capability without exposing host secrets.

## Security Decisions

- `local-trusted` retains compatibility through explicit broad local permissions, never `-A`.
- `remote-shared` grants workspace read/write, server/listed-provider networking, approved environment names, and fixed subprocess commands only.
- Extra remote network hosts and LSP commands are deployment configuration, not user-controlled request data.

## Review Triage Log

- Manual adversarial review: no blocking findings.
- Verified production startup no longer uses `-A`/`--allow-all`; local-trusted and remote-shared each construct explicit flags.
- Verified remote optional network and subprocess grants come only from deployment environment variables and are not request-controlled.
