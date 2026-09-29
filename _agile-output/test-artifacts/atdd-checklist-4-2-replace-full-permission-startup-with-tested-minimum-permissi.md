# ATDD checklist — Story 4.2

- [ ] Production entrypoint contains no `-A` or `--allow-all`.
- [ ] Both named profiles construct explicit filesystem, network, environment, and subprocess flags.
- [ ] Remote profile does not grant interactive shell execution or unrestricted network by default.
- [ ] Static entrypoint tests protect the minimum-permission contract.
