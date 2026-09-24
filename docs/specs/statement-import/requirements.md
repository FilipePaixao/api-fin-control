# Importar fatura e extrato (PDF) com categorização por IA

feature: statement-import
status: Approved
version: 0.2.0
owner: Product
jira: N/A
createdAt: 2026-09-21
updatedAt: 2026-09-22
approvedBy: User (plan execution authorization)
approvedAt: 2026-09-22

Classification: Feature

## Related specifications

- N/A

## Context

### Current situation

O usuário cadastra despesas e entradas manualmente (formulário) ou via assistente conversacional. Não há upload de fatura de cartão nem de extrato bancário. Categorias existem nos enums de despesa e entrada; a IA (Ollama) já infere categoria no chat, mas não processa documentos.

### Problem or opportunity

Exportar PDF do banco/cartão e lançar dezenas de linhas à mão é lento e propenso a erro. Automação com revisão humana reduz atrito e melhora aderência ao controle de gastos.

### Business impact

Mais lançamentos completos e categorizados no mês → dashboard e assistente mais úteis; menos abandono do hábito de registrar gastos.

## Objective

### OBJ-01 — Importar PDF com revisão

Usuário autenticado envia PDF de fatura ou extrato, recebe lista de transações sugeridas (com categoria), revisa e confirma; o sistema persiste despesas e/ou entradas selecionadas sem guardar o arquivo PDF.

## Actors

### ACT-01 — Usuário autenticado (onboarding completo)

- Goal: Importar gastos e entradas a partir do PDF do banco/cartão.
- Permissions: Apenas os próprios lançamentos; endpoints autenticados.
- Relevant context: Histórico de despesas/entradas pode melhorar sugestões de categoria.

## User stories

### US-01 — Analisar PDF

As a usuário autenticado,
I want enviar um PDF de fatura ou extrato e ver as linhas extraídas com categoria sugerida,
so that eu não precise digitar cada lançamento.

### US-02 — Revisar e confirmar

As a usuário autenticado,
I want incluir/excluir e editar nome, categoria e demais campos antes de salvar,
so that eu controle o que entra no sistema e corrija erros da IA.

### US-03 — Evitar duplicatas e pagamentos de fatura

As a usuário autenticado,
I want que possíveis duplicatas e linhas de “pagamento de fatura” no extrato venham desmarcadas,
so that eu não conte o mesmo gasto duas vezes.

## Business rules

### BR-01 — Tipos de documento

Source: Confirmed

Documento é `INVOICE` (fatura de cartão) ou `STATEMENT` (extrato bancário). O usuário informa o tipo no upload.

### BR-02 — Formato de arquivo

Source: Confirmed

Apenas PDF com texto extraível (não escaneado / sem OCR nesta versão). PDF inválido, vazio de texto ou acima do limite de tamanho deve falhar com mensagem clara.

### BR-03 — Fatura → despesas

Source: Confirmed

Em `INVOICE`, todas as linhas de compra viram despesa: `paymentMethod = CREDIT_CARD`, `status = PAID`. Data da linha (ou vencimento da fatura quando a linha não tiver data) alimenta `dueDate`/`paidAt` e `referenceMonth` (AAAA-MM). Parcela informada como “N/M” gera apenas o lançamento daquele mês — não cria a série futura de parcelas.

### BR-04 — Extrato → despesas e entradas

Source: Confirmed

Em `STATEMENT`: débitos → despesa (`status = PAID`); créditos → entrada (`status = RECEIVED`). Forma de pagamento (PIX, TED, débito etc.) deve ser inferida quando o texto permitir; senão `OTHER` ou omitida conforme contrato de despesa.

### BR-05 — Pagamento de fatura no extrato

Source: Confirmed

Linhas cujo texto indicar pagamento de fatura / cartão de crédito no extrato devem vir com sugestão de exclusão (`suggestedSkip = true` / desmarcadas), para não duplicar a fatura importada separadamente.

### BR-06 — Categorias

Source: Confirmed

Categorias de despesa e entrada usam apenas os enums existentes do produto. Categoria inválida ou ambígua → `OTHER`. Histórico do usuário (mesmo estabelecimento) pode priorizar a categoria já usada.

### BR-07 — PDF não persistido

Source: Confirmed

O arquivo PDF não é armazenado. A análise retorna um preview; a confirmação envia as linhas revisadas e o servidor revalida enums, valores e duplicatas.

### BR-08 — Duplicatas

Source: Confirmed

Uma linha é marcada como possível duplicata se já existir lançamento do mesmo usuário com valor igual, data próxima (±1 dia) e nome normalizado semelhante. Duplicatas vêm desmarcadas por padrão.

### BR-09 — Confirmação seletiva

Source: Confirmed

Somente linhas selecionadas na confirmação são persistidas. Débitos criam despesas; créditos criam entradas. Indexação/busca (RAG) segue o mesmo comportamento best-effort dos creates manuais.

### BR-10 — Autorização

Source: Confirmed

Análise e confirmação exigem autenticação. Usuário só cria/consulta dados próprios.

### BR-11 — Enriquecimento de nomes por IA

Source: Confirmed

Após extrair linhas, o sistema solicita ao LLM nomes comerciais amigáveis a partir da nomenclatura genérica da fatura. Falha no enriquecimento não impede a análise (mantém nome original + warning).

### BR-12 — Observação (`description`)

Source: Confirmed

O usuário pode informar observação/detalhes por linha na revisão; na confirmação o valor é persistido em `Expense.description`.

## Product flows

### FLOW-01 — Main flow

1. Usuário abre importação a partir de Despesas ou Entradas.
2. Escolhe tipo (fatura ou extrato) e seleciona PDF.
3. Sistema extrai texto, analisa com IA, aplica hints de histórico e regras de skip/duplicata.
4. Usuário vê tabela editável, ajusta e seleciona linhas.
5. Usuário confirma; sistema cria despesas e/ou entradas; UI atualiza listas/dashboard.

### FLOW-02 — PDF sem texto / inválido

1. Usuário envia PDF escaneado, corrompido ou não-PDF.
2. Sistema responde erro sem criar lançamentos (mensagem compreensível).

### FLOW-03 — IA indisponível

1. Análise não consegue obter resposta válida do modelo.
2. Sistema responde erro de indisponibilidade; nenhum lançamento é criado.

### FLOW-04 — Confirmação com lista vazia / só inválidas

1. Usuário confirma sem linhas selecionadas ou com payload inválido.
2. Sistema rejeita; nenhum lançamento parcial inválido é persistido.

## Acceptance criteria

### AC-01 — Análise de fatura

Traceability:
- US-01
- BR-01
- BR-03
- BR-06

Given usuário autenticado com PDF de fatura com texto selecionável
When envia análise com `documentType = INVOICE`
Then recebe lista de transações com nome, valor, data/mês, categoria de despesa e `paymentMethod` cartão
And nenhuma despesa/entrada é persistida ainda
And o PDF não é armazenado

### AC-02 — Análise de extrato

Traceability:
- US-01
- BR-04
- BR-05

Given usuário autenticado com PDF de extrato com débitos e créditos
When envia análise com `documentType = STATEMENT`
Then débitos aparecem como despesas sugeridas e créditos como entradas sugeridas
And linhas de pagamento de fatura/cartão vêm desmarcadas / `suggestedSkip`

### AC-03 — Revisão e confirmação

Traceability:
- US-02
- BR-07
- BR-09

Given preview de análise válido
When usuário edita categorias/nomes, seleciona um subconjunto e confirma
Then apenas as linhas selecionadas são criadas (despesas e/ou entradas)
And valores e enums inválidos são rejeitados

### AC-04 — Duplicatas

Traceability:
- US-03
- BR-08

Given usuário já possui despesa com mesmo valor, data próxima e nome similar
When analisa PDF contendo a mesma linha
Then a linha é marcada como possível duplicata e vem desmarcada

### AC-05 — Erros de arquivo e IA

Traceability:
- FLOW-02
- FLOW-03
- BR-02

Given PDF inválido, sem texto, ou falha do provedor de IA
When usuário solicita análise
Then recebe erro adequado
And nenhum lançamento é criado

### AC-06 — Autorização

Traceability:
- BR-10

Given request sem token válido
When chama análise ou confirmação
Then resposta não autorizada

### AC-10 — Enriquecimento de nomes genéricos

Traceability:
- US-02
- BR-11

Given fatura analisada com nomenclatura genérica (ex. `MP *Betelbarbeari`)
When a análise conclui com Ollama disponível para enriquecimento
Then o preview exibe nome amigável sugerido e `originalName` com o texto do PDF
And se o enriquecimento falhar, mantém o nome original e adiciona warning (sem falhar a análise)

### AC-11 — Observação na confirmação

Traceability:
- US-02
- BR-12

Given usuário preenche observação (`description`) em linhas selecionadas
When confirma a importação
Then as despesas criadas persistem o campo `description`

## Non-functional requirements

### NFR-01 — Tempo de análise

Category: Performance

Análise de PDF típico (< ~50 linhas) deve completar em tempo aceitável com Ollama local (ordem de minutos no pior caso). UI deve exibir estado de carregamento prolongado.

### NFR-02 — Limite de tamanho

Category: Security / Reliability

Upload limitado (ordem de 10 MB). Arquivos maiores são rejeitados.

### NFR-03 — Privacidade do arquivo

Category: Privacy

PDF não é persistido em disco/banco após a análise. Logs não devem gravar o conteúdo integral do extrato.

### NFR-04 — Disponibilidade da IA

Category: Reliability

Falha do Ollama deve mapear para erro de serviço de IA já conhecido pelo produto (assistente indisponível), sem falha silenciosa.

## Out of scope

- OFX / CSV — Deferred
- Foto / print / OCR — Deferred
- Persistência do PDF — Unsupported by design
- Open Finance / conexão bancária — Separate feature
- Criar série completa de parcelas futuras a partir da fatura — Deferred
- Importação de entradas avulsas sem passar pela revisão — Unsupported by design

## Dependencies

- Provedor LLM local (Ollama) disponível no ambiente do backend
- Domínios existentes de despesa e entrada (enums, create, listagem)
- Frontend autenticado com acesso às páginas de Despesas/Entradas

## Risks

### RISK-01 — Layouts de PDF heterogêneos

- Probability: High
- Impact: High
- Required decision or mitigation: Revisão humana obrigatória; mensagens claras quando nenhuma linha for extraída; melhorar prompt/fixtures ao longo do tempo.

### RISK-02 — Falsos positivos/negativos de duplicata

- Probability: Medium
- Impact: Medium
- Required decision or mitigation: Apenas sugerir skip; usuário decide na revisão.

### RISK-03 — Timeout do modelo local

- Probability: Medium
- Impact: Medium
- Required decision or mitigation: Timeout/erro explícito; processamento em chunks no design técnico.

## Metrics

### METRIC-01 — Taxa de confirmação

- Definition: % de análises que resultam em pelo menos um lançamento confirmado
- Baseline: N/A (feature nova)
- Expected outcome: Uso recorrente mensal
- Measurement window: Pós-lançamento
- Data source: Logs/métricas de produto (futuro)

## Assumptions

### ASM-01 — PDFs com texto selecionável

- Reason: Escopo sem OCR
- Impact if false: Usuário não consegue importar faturas escaneadas
- Validation owner: Product / suporte

### ASM-02 — Ollama disponível onde o backend roda

- Reason: Mesmo padrão do assistente
- Impact if false: Análise falha com erro de IA
- Validation owner: Engineering

## Open questions

Nenhuma blocking. Decisões de contrato HTTP e stack ficam no design técnico.

## Decisions

### DEC-01 — Somente PDF nesta versão

- Date: 2026-09-21
- Approver/source: User
- Consequence: Sem OFX/CSV/OCR no MVP

### DEC-02 — Extrato importa débitos e créditos

- Date: 2026-09-21
- Approver/source: User
- Consequence: Confirmação pode criar despesas e entradas no mesmo lote

### DEC-03 — Revisão humana obrigatória

- Date: 2026-09-21
- Approver/source: Product (rascunho do plano)
- Consequence: Analyze não persiste; Confirm persiste seleção

## Links

- Jira: N/A
- Architecture: docs/specs/statement-import/design.md
- API contract: src/contracts/service.yaml (após implementação)
- Other: Plano de entrega Spec-Driven (agt-orchestrator)

## Definition of Ready

- [x] Problem and business impact are clear
- [x] Objective is verifiable
- [x] Actors are identified
- [x] Main flow exists
- [x] Relevant alternative/failure flows exist
- [x] Business rules are explicit
- [x] Acceptance criteria are testable
- [x] Authorization and invalid-state behavior are covered when relevant
- [x] Relevant NFRs are documented
- [x] Out-of-scope is explicit
- [x] Dependencies and risks are documented
- [x] Assumptions and blocking questions are visible
- [x] Traceability is complete
- [x] The specification stands alone

## Approval

- Status: APPROVED
- Approved by: User (explicit plan execution: implement full Spec-Driven pipeline)
- Date: 2026-09-21
- Approved version: 0.1.0

## Changelog

### 0.1.0 — 2026-09-21

Added:
- Initial requirements for PDF statement/invoice import with AI categorization and human review

Changed:
- N/A

Deprecated:
- N/A

Reason:
- Spec-Driven delivery of statement-import feature

### 0.2.0 — 2026-09-22

Added:
- BR-11 / AC-10 merchant name enrichment via LLM
- BR-12 / AC-11 observation (`description`) on confirm

Changed:
- N/A

Reason:
- Friendly names for generic invoice labels + user notes without storing PDF
