# QA Report — Importar fatura e extrato (PDF)

feature: statement-import
status: Completed
version: 0.1.0
owner: Quality Assurance
jira: N/A
createdAt: 2026-09-21
updatedAt: 2026-09-21

Requirements: docs/specs/statement-import/requirements.md (version 0.1.0)
Design: docs/specs/statement-import/design.md
Test plan: docs/specs/statement-import/test-plan.md

## Result

**PASS**

## Evidence

| ID | Scenario | Result | Evidence |
|---|---|---|---|
| TC-01 | Analyze INVOICE | PASS | unit: statement-import.unit.test.ts |
| TC-02 | PDF sem texto | PASS | unit |
| TC-03 | suggestedSkip pagamento fatura | PASS | unit |
| TC-04 | Duplicata | PASS | unit |
| TC-05 | Confirm subset | PASS | unit + int confirm |
| TC-06 | Unauthorized | PASS | int: 401 analyze |
| TC-07 | LLM unavailable | PASS | unit |

Commands:

- `yarn test:unit --testPathPattern=statement-import` → 6 passed
- `yarn test:int --testPathPattern=statement-import` → 3 passed

## Residual risks

- Layouts reais de PDF de bancos variam; revisão humana mitiga.
- `pdf-parse` v2 carrega canvas (open handle em Jest; forceExit ok).
- Análise feliz com Ollama real não coberta em CI (mock).

## Architecture checklist

- Domain não importa Infra (port `IPdfTextExtractor`)
- Controller thin
- OpenAPI sincronizado (`/api/imports/*`)
- Factories apenas composições

## Sign-off

- Result: PASS
- Date: 2026-09-21
