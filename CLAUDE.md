## Git workflow

- Never commit directly to main.
- Every feature/change starts on its own branch (e.g. `feature/equipment-service-records`).
- Merge to main only when the feature is complete and working — main must
  always be in a buildable, shippable state, since preview builds get cut
  from it for testing.
- Docs-only changes (README.md, docs/ROADMAP.md, docs/INBOX.md) may commit
  directly to main — they don't affect the app build.