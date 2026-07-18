# Cursor rules — st-node-boilerplate

Index of the project rules in [`rules/`](rules/). Source of truth for architecture: [AGENTS.md](../AGENTS.md) and [docs/architecture-and-layers.md](../docs/architecture-and-layers.md).

## Naming convention

- `rule.<kebab>.mdc` — layer and subject rules for this backend.
- `meta.<kebab>.mdc` — rules about creating and maintaining rules.
- No other prefixes; imported tool rules (Task Master, Whitebeard) are not used here.

See [meta.cursor-rules.mdc](rules/meta.cursor-rules.mdc) for the full convention.

## Layer and subject rules (`rule.*`)

| Rule | Focus |
|------|-------|
| [rule.project-core.mdc](rules/rule.project-core.mdc) | Layered backend, folder spelling, AGENTS.md as source of truth |
| [rule.naming-patterns.mdc](rules/rule.naming-patterns.mdc) | `I*` interfaces, Mongo `IM*` models, `E*` enums |
| [rule.business-rules-layers.mdc](rules/rule.business-rules-layers.mdc) | Business rules in Service; forbidden in Repository and Controller (incl. no `profile.*` flatten, no multi-service controller orchestration, `generateId()`) |
| [rule.domain.mdc](rules/rule.domain.mdc) | Domain — interfaces, entities, repo/service contracts |
| [rule.application.mdc](rules/rule.application.mdc) | Application — thin Express controllers, error/auth pattern |
| [rule.infraestructure.mdc](rules/rule.infraestructure.mdc) | Infraestructure — Mongo `IM*`, adapters, repositories |
| [rule.configuration.mdc](rules/rule.configuration.mdc) | Configuration — dotenv, env, composition factories |
| [rule.contracts-openapi.mdc](rules/rule.contracts-openapi.mdc) | OpenAPI `service.yaml` aligned with the HTTP API |
| [rule.semantic-quality.mdc](rules/rule.semantic-quality.mdc) | Semantic naming, REST paths, OpenAPI schemas |
| [rule.tests.mdc](rules/rule.tests.mdc) | Jest tests — layer mirror, `*.int`/`*.unit`, coverage |
| [rule.release.mdc](rules/rule.release.mdc) | Release via semantic-release (not Changesets) |
| [rule.git-no-ai-attribution.mdc](rules/rule.git-no-ai-attribution.mdc) | Never add `Made with Cursor` / AI attribution to commits or PRs (`alwaysApply`) |

## Meta rules (`meta.*`)

| Rule | Focus |
|------|-------|
| [meta.cursor-rules.mdc](rules/meta.cursor-rules.mdc) | How to create and format rules, naming convention |
| [meta.self-improve.mdc](rules/meta.self-improve.mdc) | When and how to evolve rules from emerging patterns |

## Orchestration

Pedido amplo / feature ou bugfix end-to-end / encadear vários agents → **[`agt-orchestrator`](agents/agt-orchestrator.md)** (router fino: classifica, despacha, sintetiza; não implementa).

Pedido óbvio de um único especialista (só PR, só Jira, só review) → chamar o agent direto.

## Spec-Driven toolkit

Specs versionadas, PO, arquitetura (design), QA (PLAN/AUTOMATE/VERIFY) e code review: [SPECS.md](SPECS.md) · artefatos em [`docs/specs/`](../docs/specs/README.md) (`requirements`, `design`, `tasks`, `test-plan`, `qa-report`).

Fluxo completo (idea → release gate): [WORKFLOW.md](WORKFLOW.md).

## Quality toolkit

Agents and skills for naming/REST/quality reviews: [QUALITY.md](QUALITY.md).

## GitHub toolkit

Commits atômicos, Conventional Commits e criação de PR: [GITHUB.md](GITHUB.md).

## Jira toolkit

Leitura e criação de issues no Jira Cloud: [JIRA.md](JIRA.md).
