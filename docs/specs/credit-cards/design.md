# Design — Cartões de crédito e totais

feature: credit-cards
status: Approved
version: 0.1.0
owner: Architecture
jira: N/A
createdAt: 2026-09-22
updatedAt: 2026-09-22
approvedBy: User (plan execution)
approvedAt: 2026-09-22

Requirements: docs/specs/credit-cards/requirements.md (version 0.1.0)

## Context

Novo bounded context `credit-card` (CRUD Mongo). Estende `expense` com `creditCardId` opcional e filtro de listagem. Estende `statement-import.confirm` para exigir/propagar `creditCardId` em `INVOICE`. Frontend: ImportPage (select + total) e ExpensesPage (filtro/agrupamento + totais).

## Requirements coverage

| Requirement | Technical support | Notes |
|-------------|-------------------|-------|
| AC-01 | `CreditCardService` create/list + OpenAPI | Auth + userId |
| AC-02 | Validação `lastFourDigits` no service | 4 dígitos ou omitido |
| AC-03 | Delete checa `ExpenseService.list` com creditCardId | 400 se houver |
| AC-04 | `StatementImportService.confirm` + createMany | Força CREDIT_CARD |
| AC-05 | Validação creditCardId no confirm INVOICE | 400 FIELD_INVALID / NOT_FOUND |
| AC-06 | FE ImportPage `useMemo` soma selected | UI only |
| AC-07 | FE ExpensesPage groupBy + filtro | UI + API filter |
| AC-08 | NewExpense/UpdateExpense + form select | creditCardId opcional |
| AC-09 | GET /api/expenses?creditCardId= | Repo filter |
| NFR-01 | Auth middleware + ownership checks | |
| NFR-02 | Campo opcional; docs antigos sem campo | Sem backfill |

## End-to-end flow

### CRUD cartão

1. `POST /api/credit-cards` → Controller → `CreditCardService.create` → Mongo → 201
2. `GET /api/credit-cards` → list by userId
3. `PUT /api/credit-cards/{id}` → update owned
4. `DELETE /api/credit-cards/{id}` → se listExpenses(creditCardId) vazio → delete; senão 400

### Import fatura

1. Analyze (inalterado)
2. FE: usuário escolhe cartão; vê soma selected
3. `POST /api/imports/confirm` com `creditCardId` + transactions
4. Service valida cartão do user → createManyExpenses com creditCardId

### Lista despesas

1. `GET /api/expenses?referenceMonth=&creditCardId=`
2. FE agrupa por creditCardId quando filtro = todos; mostra totais

## Layers impacted

| Layer | Paths / artifacts | Change |
|-------|-------------------|--------|
| Domain | `src/domain/credit-card/…` | entity, service, interfaces |
| Domain | `src/domain/expense/…` | creditCardId em entity/interfaces/filters/create |
| Domain | `src/domain/statement-import/…` | confirm exige/propaga creditCardId |
| Application | `credit-card.controller.ts` | HTTP |
| Infraestructure | mongo schema/model/repo credit-card | |
| Infraestructure | expense.schema + repository filter | |
| Configuration | factories + app.ts wiring | |
| Contracts | `service.yaml` | CreditCard + Expense + ImportConfirm |
| Common | EErrorCode se necessário (ex. CREDIT_CARD_IN_USE) | |
| Frontend | services, ImportPage, ExpensesPage, forms, types | |

## Data ownership

- Owning context: `credit-card` (collection própria)
- Expense referencia `creditCardId` (FK lógica; sem cascade delete)
- Consumers: Import, Expenses UI, futuramente dashboard (fora de escopo)

## HTTP / event contracts

### Credit cards

- `GET /api/credit-cards` → `CreditCard[]`
- `POST /api/credit-cards` body `{ name, lastFourDigits? }` → 201 CreditCard
- `GET /api/credit-cards/{id}` → CreditCard
- `PUT /api/credit-cards/{id}` body `{ name?, lastFourDigits? }` → CreditCard
- `DELETE /api/credit-cards/{id}` → 204 ou 400 se em uso

### Expense

- Schema `Expense` / `NewExpense` / `UpdateExpense`: `creditCardId?: string`
- `GET /api/expenses` query: `creditCardId` opcional

### Import confirm

```json
{
  "documentType": "INVOICE",
  "creditCardId": "uuid",
  "transactions": [ /* … */ ]
}
```

- `creditCardId` required when `documentType === INVOICE`
- omitted/optional for STATEMENT

## Persistence, compatibility and migration

- New collection `creditcards` (ou `credit_cards` conforme naming do projeto)
- `expense.creditCardId` **optional** String + índice `{ userId: 1, creditCardId: 1, referenceMonth: 1 }`
- Old expenses: campo ausente = válido
- Sem backfill
- Rollback: ignorar campo / feature FE; collection pode ficar

## Idempotency and concurrency

- Create cartão: não idempotente (nomes podem repetir nesta versão — permitido)
- Delete: recheck expenses at delete time
- Confirm import: mesmo comportamento atual (cria N despesas)

## Observability

- Logs: userId, creditCardId, operação; sem dados sensíveis além de lastFourDigits mascarável nos logs (logar só id/name)

## Rollout and rollback

- Direct deploy; FE e BE juntos preferível
- Rollback: FE sem select; BE aceita confirm sem creditCardId só se reverter validação (não recomendado após release)

## Error codes

- Reusar `FIELD_INVALID`, `NOT_FOUND`, `UNAUTHORIZED` quando couber
- Novo: `CREDIT_CARD_IN_USE` (delete bloqueado) se padrão do catálogo permitir; senão `FIELD_INVALID` com mensagem clara

## Frontend contracts

- `creditCardService` + queryKeys
- ImportPage: select + create inline + `selectedTotal`
- ExpensesPage: filter + group sections + totals
- ExpenseFormBody: select opcional creditCardId

## Technical risks

- Confirm sem cartão quebraria fluxo atual de import — **intencional** (BR-04); FE deve forçar select
- Agrupamento só no FE (lista já filtrada por mês) — OK para volumes pessoais

## Open design questions

Nenhuma.
