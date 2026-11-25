# Repository agent guidance

Before working in this repository, read the shared DOGESEC guidance in
[.agent-guidance/AGENTS.md](.agent-guidance/AGENTS.md), then read the linked
Stixify and external API consumer guides. This repository-specific file adds
the rules below.

- Treat this extension as a production-critical Stixify API consumer.
- Preserve the `API-KEY` authentication contract and never commit API keys or
  captured customer content.
- For API-facing changes, validate the extension build plus submission, job
  polling, quota/error handling, and hosted-result URL construction against an
  ephemeral isolated Stixify environment.
- Coordinate incompatible API changes with the Stixify server release; do not
  assume the extension auto-updates immediately for every installed user.
