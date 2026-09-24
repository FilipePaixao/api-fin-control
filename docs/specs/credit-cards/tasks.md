# Tasks — Cartões de crédito e totais

feature: credit-cards
status: Approved
version: 0.1.0
owner: Tech
jira: N/A
createdAt: 2026-09-22
updatedAt: 2026-09-22
approvedBy: User (plan execution)
approvedAt: 2026-09-22

Requirements: docs/specs/credit-cards/requirements.md (version 0.1.0)
Design: docs/specs/credit-cards/design.md
Test plan: docs/specs/credit-cards/test-plan.md

## Overview

| ID | Task | Owner | Depends on | Status |
|----|------|-------|------------|--------|
| TASK-01 | Domínio CreditCard + OpenAPI CRUD | backend | — | Done |
| TASK-02 | creditCardId em Expense + filtro list | backend | TASK-01 | Done |
| TASK-03 | Import confirm INVOICE exige creditCardId | backend | TASK-01, TASK-02 | Done |
| TASK-04 | Testes unitários backend | backend | TASK-01–03 | Done |
| TASK-05 | Frontend creditCardService + ImportPage | frontend | TASK-01, TASK-03 | Done |
| TASK-06 | Frontend ExpensesPage + form | frontend | TASK-02 | Done |

## Tasks

### TASK-01 — CRUD CreditCard exposto e persistido

Traceability:
- AC-01
- AC-02
- AC-03
- BR-01
- BR-02
- BR-07

Owner:
- backend

Dependencies:
- none

Expected files/layers:
- Domain `src/domain/credit-card/…`
- Infraestructure mongo schema/model/repository
- Application controller + Configuration factories
- Contracts `service.yaml`
- Wiring `app.ts` / configApp tests

Completion check:
- Unit tests create/list/update/delete; delete bloqueado com despesas mockadas

### TASK-02 — Expense.creditCardId + filtro

Traceability:
- AC-08
- AC-09
- BR-03

Owner:
- backend

Dependencies:
- TASK-01

Expected files/layers:
- expense entity/interfaces/schema/repository/service/filters
- OpenAPI Expense/NewExpense/UpdateExpense + query param

Completion check:
- listExpenses filtra por creditCardId; createMany aceita o campo

### TASK-03 — Import confirm vincula cartão

Traceability:
- AC-04
- AC-05
- BR-04
- BR-08

Owner:
- backend

Dependencies:
- TASK-01
- TASK-02

Expected files/layers:
- statement-import service/interfaces
- ImportConfirmRequest no OpenAPI
- Injetar CreditCardService (ou getById) no StatementImportService

Completion check:
- Unit: INVOICE sem creditCardId falha; com id válido propaga no createMany

### TASK-04 — Testes unitários

Traceability:
- AC-01–05, AC-09

Owner:
- backend

Dependencies:
- TASK-01–03

Expected files/layers:
- `__tests__/unit/credit-card/…`
- Atualizar `statement-import.unit.test.ts`

Completion check:
- `yarn test:unit --testPathPattern='credit-card|statement-import'` PASS

### TASK-05 — ImportPage cartão + total

Traceability:
- AC-06
- US-02
- US-03

Owner:
- frontend

Dependencies:
- TASK-01
- TASK-03

Expected files/layers:
- `frontend/src/services/credit-card.service.ts`
- types, api-routes, queryKeys
- `ImportPage.tsx`

Completion check:
- Select/criar cartão; confirm envia creditCardId; rodapé com soma selected

### TASK-06 — ExpensesPage filtro/grupo + form

Traceability:
- AC-07
- AC-08

Owner:
- frontend

Dependencies:
- TASK-02

Expected files/layers:
- `ExpensesPage.tsx`, `ExpenseFormBody`, schemas

Completion check:
- Filtro por cartão; seções com totais; form com select opcional
