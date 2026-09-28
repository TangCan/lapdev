# Architecture spine reviewer gate — security and seam lens

## Verdict

PASS for architecture direction. The spine closes the primary seam where transport handlers could bypass policy and where frontend, backend, adapters and event consumers could create competing state owners.

## Adversarial checks

- A terminal service and an Agent service cannot independently authorize a workspace operation because AD-1 and AD-6 require a shared capability context and policy decision.
- A file watcher and an Agent writer cannot independently publish conflicting state because AD-2 and AD-7 assign mutation ownership to backend application services and require revisions on events.
- A new LSP language adapter and an existing handler cannot choose incompatible process lifecycle rules because AD-5 assigns lifecycle to LSP Manager.
- A legacy skill directory and `.agents/skills` cannot silently shadow one another because AD-4 requires source labels and registry-mediated discovery.
- An HTTP request and WebSocket event cannot invent different error/version semantics because AD-3 requires one versioned envelope.

## Remaining risk

The spine intentionally does not choose the authentication provider, tenant isolation implementation or terminal allowlist. Those are explicit blockers for remote-shared mode, not holes in the current platform invariant set.
