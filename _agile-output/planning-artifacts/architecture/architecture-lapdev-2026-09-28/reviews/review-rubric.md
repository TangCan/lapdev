# Architecture spine reviewer gate — rubric

## Verdict

PASS with deferred implementation details. The spine fixes the main divergences likely to occur between independently built capabilities and does not bind a new framework or service topology unsupported by the brownfield codebase.

## Checks

- Design paradigm is explicit and maps transport, application service, policy, ports and adapters.
- AD-1 through AD-7 are monotonic and each has Binds, Prevents and Rule.
- State ownership, event compatibility, authorization, skill discovery and LSP lifecycle are explicit.
- Operational/security envelope is represented by AD-6 and Deferred items for authentication, isolation and least privilege.
- Stack rows are pinned to repository manifests or CI rather than guessed latest versions.
- Deferred items name the missing decision and why it can wait; they do not leave two builders free to invent different current behavior.
- No template placeholders or empty diagrams remain; deterministic lint returned zero findings.

## Remaining follow-up

The concrete authentication provider, tenant model, command allowlist and artifact migration policy must be decided before remote-shared deployment or migration implementation begins.
