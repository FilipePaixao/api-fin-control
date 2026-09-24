# Test Plan — Importar fatura e extrato (PDF)

feature: statement-import
status: Approved
version: 0.1.0
owner: Quality Assurance
jira: N/A
createdAt: 2026-09-21
updatedAt: 2026-09-21
approvedBy: User (plan execution)
approvedAt: 2026-09-21

Requirements: docs/specs/statement-import/requirements.md (version 0.1.0)
Design: docs/specs/statement-import/design.md

## Scope

### In scope

- Analyze (INVOICE / STATEMENT), validação PDF, LLM mock, duplicatas, suggestedSkip, confirm parcial, auth, OpenAPI

### Out of scope

- OCR, OFX/CSV, E2E browser, performance real do Ollama em CI

## Quality risks

| Risk | Impact | Probability | Priority | Coverage |
|---|---:|---:|---:|---|
| PDF sem texto aceito | High | Medium | P0 | TC-02 |
| Confirm cria linhas inválidas | High | Low | P0 | TC-05 |
| Duplicata não marcada | Medium | Medium | P0 | TC-04 |
| Auth bypass | High | Low | P0 | TC-06 |

## Test strategy

### Domain unit

- StatementImportService com mocks de PDF, LLM, expense/income list/create

### Application/controller

- Cobertura via integration

### Infrastructure integration

- Analyze/confirm HTTP com Mongo memory + LLM mock + PDF fixture

### Contract/OpenAPI

- Rotas no service.yaml; multipart habilitado

### Messaging

- N/A

### Configuration/wiring

- Controller registrado em app.ts

### Regression

- test:unit + test:int existentes

## Test matrix

| ID | Traceability | Scenario | Level | Priority | Automation | Status |
|---|---|---|---|---|---|---|
| TC-01 | AC-01 | Analyze INVOICE retorna despesas CREDIT_CARD sem persistir | Unit | P0 | Planned | Not run |
| TC-02 | AC-05, BR-02 | PDF sem texto → IMPORT_NO_TEXT | Unit | P0 | Planned | Not run |
| TC-03 | AC-02, BR-05 | STATEMENT marca suggestedSkip em pagamento fatura | Unit | P0 | Planned | Not run |
| TC-04 | AC-04 | Duplicata marcada e selected=false | Unit | P0 | Planned | Not run |
| TC-05 | AC-03 | Confirm cria só selecionados | Unit/Int | P0 | Planned | Not run |
| TC-06 | AC-06 | Sem token → 401 | Integration | P0 | Planned | Not run |
| TC-07 | AC-05 | LLM falha → AGENT_LLM_UNAVAILABLE | Unit | P0 | Planned | Not run |

## Detailed test cases

### TC-01 — Analyze invoice

Traceability: AC-01, BR-03

Priority: P0
Level: Unit
Automation: Planned
Test file: `src/__tests__/unit/statement-import/service/analyze-invoice.unit.test.ts`

Given: PDF mock com texto; LLM retorna 2 compras
When: analyze INVOICE
Then: 2 EXPENSE, CREDIT_CARD, PAID mapping no confirm; createMany não chamado

### TC-02 — No text PDF

Traceability: AC-05

Priority: P0
Level: Unit
Test file: same suite

Given: extractor retorna string vazia
When: analyze
Then: IMPORT_NO_TEXT; sem LLM call

### TC-03 — Invoice payment skip

Traceability: AC-02, BR-05

Priority: P0
Level: Unit

Given: LLM retorna linha “PAGAMENTO FATURA CARTAO”
When: analyze STATEMENT
Then: suggestedSkip=true, selected=false

### TC-04 — Duplicate

Traceability: AC-04

Priority: P0
Level: Unit

Given: expense existente mesmo valor/data/nome
When: analyze
Then: duplicate=true, selected=false

### TC-05 — Confirm subset

Traceability: AC-03

Priority: P0
Level: Unit + Integration

Given: 3 linhas, 2 selected
When: confirm
Then: 2 creates; 1 ignorada

### TC-06 — Unauthorized

Traceability: AC-06

Priority: P0
Level: Integration

Given: sem Authorization
When: POST analyze/confirm
Then: 401

### TC-07 — LLM unavailable

Traceability: AC-05, NFR-04

Priority: P0
Level: Unit

Given: llm.chat throws
When: analyze
Then: AGENT_LLM_UNAVAILABLE

## Architecture validations

- [ ] Domain does not import Infraestructure
- [ ] Controller remains thin
- [ ] Repository contains no product-level decision
- [ ] Adapters remain pure
- [ ] Factories only compose dependencies
- [ ] OpenAPI is synchronized
- [ ] Tests are under `src/__tests__`

## Environment and data

- Environment: NODE_ENV=test
- Database: mongodb-memory-server (int)
- External: LLM mock; PDF fixture texto
- Cleanup: padrão int tests

## Commands

| Purpose | Command | Required |
|---|---|---|
| Unit | `yarn test:unit` | Yes |
| Int | `yarn test:int` | Yes |
| Lint | `yarn lint` | Yes |

## Entry criteria

- [x] Requirements approved
- [x] Acceptance criteria identifiable
- [x] Dependencies mockable

## Exit criteria

- [ ] All P0 tests pass
- [ ] OpenAPI sync
- [ ] Regression suite runs
- [ ] Residual risks explicit (PDF layouts)

## Assumptions

- CI não sobe Ollama; LLM sempre mock em testes

## Blockers

- none

## Changelog

### 0.1.0 — 2026-09-21

- Initial test plan
