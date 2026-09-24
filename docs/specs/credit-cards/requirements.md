# Cartões de crédito e totais por fatura/lista

feature: credit-cards
status: Approved
version: 0.1.0
owner: Product
jira: N/A
createdAt: 2026-09-22
updatedAt: 2026-09-22
approvedBy: User (plan execution authorization)
approvedAt: 2026-09-22

Classification: Feature

## Related specifications

- [docs/specs/statement-import/requirements.md](../statement-import/requirements.md)

## Context

### Current situation

Despesas de fatura importada ficam com `paymentMethod = CREDIT_CARD`, sem identificar *qual* cartão. Não há cadastro de cartões. Em `/import` e `/expenses` não há soma agregada por cartão/fatura.

### Problem or opportunity

O usuário precisa agrupar gastos da fatura (ex.: Nubank) sob um cartão nomeado, revisar o total antes de confirmar e filtrar/ver totais na lista de despesas.

### Business impact

Visibilidade do total da fatura por cartão melhora controle do limite e evita misturar cartões diferentes.

## Objective

### OBJ-01 — Cartões permanentes

Usuário autenticado cadastra, lista, edita e remove cartões de crédito próprios.

### OBJ-02 — Vínculo e totais

Despesas (manuais ou importadas de fatura) podem/serão vinculadas a um cartão; a UI mostra totais por seleção (import) e por cartão/mês (lista).

## Actors

### ACT-01 — Usuário autenticado (onboarding completo)

- Goal: Gerenciar cartões e associar despesas de fatura a um cartão específico.
- Permissions: Apenas cartões e despesas próprios.
- Relevant context: Já importa faturas PDF (statement-import).

## User stories

### US-01 — CRUD de cartões

As a usuário autenticado,
I want cadastrar cartões com nome (e opcionalmente os 4 últimos dígitos),
so that eu possa distinguir Nubank, Inter, etc.

### US-02 — Associar fatura ao cartão

As a usuário autenticado,
I want escolher (ou criar) um cartão ao confirmar a importação de fatura,
so that todas as despesas confirmadas fiquem ligadas a esse cartão.

### US-03 — Total na revisão do import

As a usuário autenticado,
I want ver a soma dos valores das linhas selecionadas antes de confirmar,
so that eu confira o total da fatura.

### US-04 — Filtrar e agrupar despesas por cartão

As a usuário autenticado,
I want filtrar e ver despesas agrupadas por cartão com a soma do grupo (no mês filtrado),
so that eu saiba quanto gastei em cada cartão.

### US-05 — Despesa manual com cartão

As a usuário autenticado,
I want opcionalmente informar o cartão ao criar/editar uma despesa,
so that gastos manuais no cartão entrem no mesmo agrupamento.

## Business rules

### BR-01 — Escopo do cartão

Source: Confirmed

Cartão pertence a um único usuário. Campos: `name` (obrigatório, não vazio) e `lastFourDigits` (opcional; se informado, exatamente 4 dígitos numéricos).

### BR-02 — Delete com despesas

Source: Confirmed

Não é permitido apagar um cartão que ainda tenha despesas vinculadas. O sistema rejeita com erro claro.

### BR-03 — creditCardId na despesa

Source: Confirmed

Despesa pode ter `creditCardId` opcional. Se informado, deve referenciar cartão existente do mesmo usuário.

### BR-04 — Import INVOICE exige cartão

Source: Confirmed

Na confirmação de importação com `documentType = INVOICE`, `creditCardId` é obrigatório e válido; todas as despesas criadas nessa confirmação recebem esse `creditCardId`. Extrato (`STATEMENT`) não exige cartão.

### BR-05 — Totais no import

Source: Confirmed

Na revisão do import, o sistema (UI) exibe a soma dos `amount` das linhas **selecionadas** que são despesas. Linhas desmarcadas não entram no total.

### BR-06 — Totais e agrupamento em despesas

Source: Confirmed

Na lista de despesas: (1) filtro por cartão; (2) quando “todos”, agrupar visualmente por cartão (e “Sem cartão”) com soma por grupo no mês/filtros ativos; (3) com um cartão filtrado, exibir total do conjunto listado.

### BR-07 — Autorização

Source: Confirmed

CRUD de cartões e listagens exigem autenticação; usuário só acessa dados próprios.

### BR-08 — Meio de pagamento

Source: Confirmed

Import de fatura continua forçando `paymentMethod = CREDIT_CARD`. O cartão específico é `creditCardId`, não um novo enum de payment method.

## Product flows

### FLOW-01 — Cadastrar cartão e importar fatura

1. Usuário cria cartão “Nubank” (opcionalmente com final).
2. Analisa PDF de fatura; revisa linhas; vê total selecionado.
3. Seleciona o cartão Nubank e confirma.
4. Despesas são criadas com `creditCardId` do Nubank.

### FLOW-02 — Listar por cartão

1. Usuário abre Despesas no mês.
2. Filtra por Nubank ou deixa “Todos” (agrupado).
3. Vê soma(s) do(s) grupo(s).

### FLOW-03 — Tentar apagar cartão em uso

1. Usuário tenta remover cartão com despesas.
2. Sistema rejeita; cartão permanece.

### FLOW-04 — Confirm INVOICE sem cartão

1. Usuário confirma fatura sem `creditCardId`.
2. Sistema rejeita; nenhuma despesa criada nessa tentativa.

## Acceptance criteria

### AC-01 — Criar e listar cartão

Traceability:
- US-01
- BR-01
- BR-07

Given usuário autenticado
When cria cartão com nome "Nubank" e opcionalmente lastFourDigits "0506"
Then o cartão aparece na listagem do usuário
And outro usuário não o vê

### AC-02 — Validação lastFourDigits

Traceability:
- BR-01

Given usuário autenticado
When cria/atualiza cartão com lastFourDigits inválido (não 4 dígitos)
Then a operação é rejeitada

### AC-03 — Delete bloqueado

Traceability:
- US-01
- BR-02

Given cartão com ao menos uma despesa vinculada
When usuário tenta apagar o cartão
Then recebe erro e o cartão continua existindo

### AC-04 — Confirm fatura com cartão

Traceability:
- US-02
- BR-04
- BR-08

Given análise de INVOICE com linhas selecionadas e cartão válido do usuário
When confirma importação com esse creditCardId
Then todas as despesas criadas têm esse creditCardId e paymentMethod CREDIT_CARD

### AC-05 — Confirm fatura sem cartão

Traceability:
- BR-04
- FLOW-04

Given confirmação INVOICE sem creditCardId (ou id inválido/de outro usuário)
When confirma
Then erro 4xx e nenhuma despesa criada

### AC-06 — Total selecionado no import (UI)

Traceability:
- US-03
- BR-05

Given preview com linhas selecionadas e desmarcadas
When usuário olha o rodapé da revisão
Then vê a soma apenas das linhas selecionadas (despesas)

### AC-07 — Filtro e agrupamento em despesas (UI)

Traceability:
- US-04
- BR-06

Given despesas de cartões diferentes no mês
When lista com “Todos”
Then vê seções por cartão com soma por seção
When filtra um cartão
Then vê só essas despesas e o total correspondente

### AC-08 — Despesa manual com cartão

Traceability:
- US-05
- BR-03

Given usuário autenticao com cartão cadastrado
When cria despesa com creditCardId válido
Then a despesa persiste o vínculo e aparece no agrupamento desse cartão

### AC-09 — Filtrar listagem por creditCardId (API)

Traceability:
- BR-03
- BR-06

Given despesas com e sem creditCardId
When lista despesas com query creditCardId
Then retorna apenas as do cartão informado (mesmo usuário)

## Non-functional requirements

### NFR-01 — Autorização

Todo endpoint de cartão e o filtro por cartão respeitam o userId autenticado.

### NFR-02 — Compatibilidade

Despesas existentes sem creditCardId continuam válidas (aparecem em “Sem cartão”).

## Out of scope

- Entidade “fatura do mês” separada — Deferred
- Reutilizar installmentGroupId para agrupar fatura — Unsupported by design
- OCR / PDF escaneado — Separate feature (statement-import)
- Múltiplos cartões no mesmo PDF — Deferred
- Limite de crédito / fatura aberta / vencimento do cartão — Deferred
- Soft-delete / arquivar cartão — Deferred

## Dependencies

- Domínio expense existente
- Feature statement-import (confirm de INVOICE)
- Autenticação / onboarding

## Risks and assumptions

### Risk

- Usuário confirma fatura no cartão errado — mitigação: select explícito + total visível antes do confirm.

### Assumption

- Um confirm de fatura associa **todas** as linhas selecionadas a um único cartão.

## Open questions

Nenhuma — decisões confirmadas no plano aprovado para execução.

## Decision log

### DEC-01 — Cartão permanente (não só grupo por import)

Date: 2026-09-22
Decision: CRUD de cartões + creditCardId nas despesas.
Rationale: Reuso entre meses e listagem/filtro.

### DEC-02 — Totais no import e nas despesas

Date: 2026-09-22
Decision: Soma no rodapé do import e agrupamento/filtro com soma em /expenses.
Rationale: Pedido explícito do usuário.

### DEC-03 — Delete bloqueado com vínculo

Date: 2026-09-22
Decision: Não apagar cartão com despesas.
Rationale: Evitar órfãos sem reassign nesta versão.
