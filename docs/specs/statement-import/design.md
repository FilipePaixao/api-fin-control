# Design — Importar fatura e extrato (PDF)

feature: statement-import
status: Approved
version: 0.1.0
owner: Architecture
jira: N/A
createdAt: 2026-09-21
updatedAt: 2026-09-21
approvedBy: User (plan execution)
approvedAt: 2026-09-21

Requirements: docs/specs/statement-import/requirements.md (version 0.1.0)

## Context

Novo bounded context `statement-import` orquestra upload PDF → extração de texto → LLM (Ollama) → preview → confirmação em lote via `ExpenseService` / `IncomeService`. Não persiste o PDF. Reusa padrões de factory/controller do agente e de despesas.

## Requirements coverage

| Requirement | Technical support | Notes |
|-------------|-------------------|-------|
| AC-01 | `StatementImportService.analyze` + PDF extractor + LLM tool | INVOICE → só despesas |
| AC-02 | Mesmo analyze com `documentType=STATEMENT` | Débito/crédito + suggestedSkip |
| AC-03 | `StatementImportService.confirm` + createMany | Revalidação no servidor |
| AC-04 | Duplicate detector vs listagens recentes | Desmarcado no preview |
| AC-05 | Error codes + AGENT_LLM_UNAVAILABLE | PDF vazio / inválido |
| AC-06 | Auth middleware nas rotas | Bearer |
| NFR-01 | Chunks LLM + loading FE | Timeout Ollama existente |
| NFR-02 | OpenAPI + multer/fileUploader ~10MB | |
| NFR-03 | Buffer em memória; sem save | Logs sem body do PDF |
| NFR-04 | Mapear falha Ollama | |

## End-to-end flow

1. `POST /api/imports/analyze` (multipart) → Controller → `StatementImportService.analyze`
2. Valida PDF → `IPdfTextExtractor.extract` → texto
3. Carrega hints de categoria (despesas/entradas do usuário nos meses detectados)
4. `ILlmProvider.chat` com prompt + tool `extract_transactions` (chunks se necessário)
5. Normaliza linhas, marca duplicate/suggestedSkip → response preview (sem persistir)
6. FE revisa → `POST /api/imports/confirm` JSON
7. Service valida linhas selecionadas → `ExpenseService.createMany` / `IncomeService.createMany` → 201 com contagens + entidades criadas

## Layers impacted

| Layer | Paths / artifacts | Change |
|-------|-------------------|--------|
| Domain | `src/domain/statement-import/…` | service, interfaces, prompt loader path, enums de document type |
| Domain | `src/domain/expense/service/expense.service.ts` | `createManyExpenses` público |
| Domain | `src/domain/income/…` | `createManyIncomes` no write + service |
| Application | `src/application/controllers/statement-import.controller.ts` | HTTP |
| Infraestructure | `src/infraestructure/statement-import/pdf-parse.extractor.ts` | pdf-parse |
| Infraestructure | `src/infraestructure/agent/ollama-llm.provider.ts` | reuso |
| Configuration | `statement-import.*.factory.ts`, `app.ts` | wiring |
| Contracts | `src/contracts/service.yaml` | rotas + schemas |
| Server | `src/domain/server/server.ts` | `fileUploader` no OpenApiValidator |
| Common | `EErrorCode` + error-catalog | novos códigos |
| Frontend | `frontend/src/…` | `/import`, FormData, botões |

## Data ownership

- Owning context: `statement-import` (orquestra; não possui collection própria)
- Persistência: continua em `expense` e `income` (Mongo)
- Consumers: Dashboard, Agent, RAG (via sync existente de expense)

## HTTP / event contracts

### `POST /api/imports/analyze`

- Auth: bearer
- Content-Type: `multipart/form-data`
- Fields: `file` (binary PDF), `documentType` (`INVOICE` | `STATEMENT`)
- Response 200:

```json
{
  "documentType": "STATEMENT",
  "transactions": [
    {
      "tempId": "uuid",
      "kind": "EXPENSE" | "INCOME",
      "name": "string",
      "amount": 12.34,
      "date": "2026-09-01",
      "referenceMonth": "2026-09",
      "category": "FOOD",
      "paymentMethod": "PIX",
      "confidence": 0.8,
      "suggestedSkip": false,
      "duplicate": false,
      "selected": true
    }
  ],
  "warnings": []
}
```

### `POST /api/imports/confirm`

- Auth: bearer
- Body:

```json
{
  "documentType": "STATEMENT",
  "transactions": [ /* subset selected, edited */ ]
}
```

- Response 201: `{ expenses: Expense[], incomes: Income[] }`

### Errors

- `IMPORT_INVALID_PDF` (400)
- `IMPORT_NO_TEXT` (400)
- `IMPORT_NO_TRANSACTIONS` (400)
- `FIELD_INVALID` (400)
- `AGENT_LLM_UNAVAILABLE` (503)
- `AUTH_*` (401)

## Persistence, compatibility and migration

- Sem nova collection / migration
- Sem campos novos obrigatórios em expense/income
- Old records inalterados
- Rollback = desligar rotas / não usar UI

## Idempotency and concurrency

- Analyze: não idempotente (LLM); não persiste
- Confirm: não é idempotente por design; duplicatas sugeridas mitigam reenvio; cliente não deve double-submit sem feedback

## Observability

- Logs: userId, documentType, contagem de linhas, duração; **sem** texto do PDF
- Erros via ErrorCatalog i18n

## Rollout and rollback

- Rollout: direto (feature nova)
- Rollback: remover nav/botões FE ou desregistrar controller

## Technical risks

### TRISK-01 — Layouts PDF

- Impact: Extração vazia ou errada
- Mitigation: AC revisão humana; erro IMPORT_NO_TRANSACTIONS

### TRISK-02 — Tool-calling inconsistente do modelo

- Impact: JSON inválido
- Mitigation: Validação estrita; retry uma vez; falha AGENT_LLM_UNAVAILABLE / FIELD_INVALID

## Decisions

| Decision | Chosen | Rejected alternatives |
|----------|--------|------------------------|
| Extrator PDF | `pdf-parse` | OCR / pdf.js server |
| LLM | Ollama existente (`ILlmProvider`) | OpenAI cloud |
| Persistência preview | Stateless (cliente guarda preview) | Job store / Redis |
| Bulk create | createMany nos services existentes | N× createExpense em loop HTTP |
| Upload | OpenAPI fileUploader + multipart | Base64 no JSON |

## Open technical decisions

- none

## Questions returned to PO

- none

## Must not do without asking

- Persistir PDF
- Alterar enums de categoria
- Adicionar OFX/CSV/OCR no mesmo PR

## Alignment

- Follow docs/architecture-and-layers.md e AGENTS.md
- Domain não importa Infraestructure (`IPdfTextExtractor` no domain; impl em infra)
- Controllers thin; regras no Service

## Approval

- Status: APPROVED
- Approved by: User (plan execution)
- Date: 2026-09-21
- Approved version: 0.1.0
- Conditions: none

## Changelog

### 0.1.0 — 2026-09-21

- Initial design
