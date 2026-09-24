# Test plan — Cartões de crédito e totais

feature: credit-cards
status: Approved
version: 0.1.0
owner: QA
jira: N/A
createdAt: 2026-09-22
updatedAt: 2026-09-22

Requirements: docs/specs/credit-cards/requirements.md (version 0.1.0)
Design: docs/specs/credit-cards/design.md

## Criterion → test matrix

| Criterion | Test ID | Type | Layer |
|-----------|---------|------|-------|
| AC-01 | TC-01 | unit | CreditCardService |
| AC-02 | TC-02 | unit | CreditCardService |
| AC-03 | TC-03 | unit | CreditCardService |
| AC-04 | TC-04 | unit | StatementImportService.confirm |
| AC-05 | TC-05 | unit | StatementImportService.confirm |
| AC-09 | TC-06 | unit | ExpenseService/repo filter (via service list) |
| AC-06 | TC-07 | manual / FE smoke | ImportPage |
| AC-07 | TC-08 | manual / FE smoke | ExpensesPage |
| AC-08 | TC-09 | unit + FE | createExpense with creditCardId |

## Test cases

### TC-01 — Create and list credit card

Given user U
When create { name: "Nubank", lastFourDigits: "0506" }
Then card returned with id; list for U contains it

### TC-02 — Invalid lastFourDigits

Given user U
When create with lastFourDigits "12"
Then FIELD_INVALID (or equivalent 400)

### TC-03 — Delete blocked when expenses exist

Given card C with expense linked
When delete C
Then CREDIT_CARD_IN_USE or FIELD_INVALID; card remains

### TC-04 — Confirm INVOICE with creditCardId

Given valid card C and selected expense lines
When confirm INVOICE with creditCardId=C
Then createManyExpenses called with creditCardId=C and CREDIT_CARD

### TC-05 — Confirm INVOICE without creditCardId

Given selected lines
When confirm INVOICE without creditCardId
Then 400; createMany not called

### TC-06 — List expenses by creditCardId

Given expenses on C1 and C2
When list with creditCardId=C1
Then only C1 expenses

### TC-07 — Import selected total (UI)

Manual: select/deselect lines; footer sum matches selected expense amounts

### TC-08 — Expenses group totals (UI)

Manual: two cards in month; Todos shows two sections with sums; filter one card shows one total

### TC-09 — Manual expense with creditCardId

Given card C
When createExpense with creditCardId=C
Then persisted expense has creditCardId=C

## Out of scope for automation this slice

- Full Playwright E2E for ImportPage/ExpensesPage (manual TC-07/08 acceptable in qa-report)
