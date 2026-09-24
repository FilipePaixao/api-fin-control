# Tasks — Importar fatura e extrato (PDF)

feature: statement-import
status: Approved
version: 0.1.0
owner: Tech
jira: N/A
createdAt: 2026-09-21
updatedAt: 2026-09-21
approvedBy: User (plan execution)
approvedAt: 2026-09-21

Requirements: docs/specs/statement-import/requirements.md (version 0.1.0)
Design: docs/specs/statement-import/design.md
Test plan: docs/specs/statement-import/test-plan.md

## Overview

| ID | Task | Owner | Depends on | Status |
|----|------|-------|------------|--------|
| TASK-01 | Error codes + catalog | backend | — | Pending |
| TASK-02 | Expense/Income createMany | backend | — | Pending |
| TASK-03 | Domain statement-import (service + PDF port + LLM prompt) | backend | TASK-01 | Pending |
| TASK-04 | Infra PDF extractor + factories + controller + app wiring | backend | TASK-03 | Pending |
| TASK-05 | OpenAPI + fileUploader | backend | TASK-04 | Pending |
| TASK-06 | Unit tests analyze/confirm | backend | TASK-03 | Pending |
| TASK-07 | Integration tests | backend | TASK-05 | Pending |
| TASK-08 | Frontend /import + FormData + botões | frontend | TASK-05 | Pending |

## Tasks

### TASK-01 — Error codes de importação no catálogo

Traceability: AC-05, NFR-04

Owner: backend

Expected files:
- `src/domain/common/errors/enums/EErrorCode.ts`
- `src/infraestructure/i18n/error-catalog.ts`

Completion check: códigos `IMPORT_INVALID_PDF`, `IMPORT_NO_TEXT`, `IMPORT_NO_TRANSACTIONS` com pt-BR/en/es

### TASK-02 — createMany em Expense e Income

Traceability: AC-03, BR-09

Owner: backend

Expected files:
- `expense.service.ts` + interface
- `income.repository.write.ts` + impl + `income.service.ts`

Completion check: métodos públicos usados pelo confirm; RAG best-effort em expenses

### TASK-03 — StatementImportService + ports

Traceability: AC-01..AC-05, BR-*

Owner: backend

Expected files:
- `src/domain/statement-import/**`
- prompt `statement-import-prompt.md`
- utils: normalize name, duplicate, chunk text, validate transactions

Completion check: unit tests com LLM e PDF mocks

### TASK-04 — HTTP + wiring

Traceability: AC-06

Owner: backend

Expected files:
- controller, factories, `pdf-parse.extractor.ts`, `app.ts`
- dependency `pdf-parse` (+ types)

Completion check: rotas registradas em `/api/imports/*`

### TASK-05 — OpenAPI multipart + JSON confirm

Traceability: AC-01, NFR-02

Owner: backend

Expected files:
- `service.yaml`
- `server.ts` fileUploader

Completion check: validator aceita multipart; schemas batem com responses

### TASK-06 — Unit tests

Traceability: test-plan TC P0 unit

Owner: backend

Completion check: `yarn test:unit` passa nos novos testes

### TASK-07 — Integration tests

Traceability: test-plan TC integração

Owner: backend

Completion check: analyze + confirm com fixture PDF e LLM mock

### TASK-08 — Frontend import UX

Traceability: US-01, US-02, NFR-01

Owner: frontend

Expected files:
- `ImportPage`, router, AppShell opcional, expense/income headers
- `http-client` FormData
- `statement-import.service.ts`, types, api-routes

Completion check: fluxo upload → revisão → confirm atualiza listas

## Notes

- Vertical: contracts → domain → infra → HTTP → tests → FE
- Não expandir para OFX/OCR

## Changelog

### 0.1.0 — 2026-09-21

- Initial tasks
