# Fluxo completo de feature (agents)

Como este repositório conduz uma demanda da ideia até a entrega validada.
Complementa [SPECS.md](SPECS.md) (artefatos) e [AGENTS.md](../AGENTS.md) (contrato curto).

**Entrada padrão:** invoque o **`agt-orchestrator`**. Ele classifica a intenção, monta o pipeline mínimo, aplica gates e despacha os especialistas — não implementa, não escreve specs e não committa sozinho.

---

## Visão geral

```text
Ideia / Jira / chat
        ↓
  agt-orchestrator
        ↓
  agt-product-owner  →  docs/specs/<slug>/requirements.md
        ↓
  Gate humano (APPROVED explícito)
        ↓
  agt-architecture   →  design.md  (+ tasks.md)
        ↓
  agt-quality-assurance (PLAN)  →  test-plan.md   ← antes do código
        ↓
  agt-dev-backend    →  implementação (lê tasks + test-plan)
        ↓
  agt-test-runner    →  suite Jest saudável
        ↓
  agt-code-review    →  findings tipados (read-only)
        ↓
  agt-quality-assurance (AUTOMATE + VERIFY)  →  testes + qa-report.md
        ↓
  agt-architecture-review  ∥  agt-code-quality
        ↓
  agt-verifier
        ↓
  agt-github-workflow  (só se pedido: commit / PR)
```

Princípio: **shift-left** — requisitos, design e plano de testes existem *antes* do código. QA verifica requisitos aprovados, não justifica o que foi implementado.

---

## Artefatos por feature

Pasta: `docs/specs/<feature-slug>/`

| Arquivo | Quem produz | Quando | Conteúdo |
|---------|-------------|--------|----------|
| `requirements.md` | `agt-product-owner` | Antes de tudo | Problema, regras, AC testáveis |
| `design.md` | `agt-architecture` | Após requirements aprovados | Camadas, contratos, compatibilidade, rollout |
| `tasks.md` | Arquitetura + `@skill-spec-driven` | Com o design | Fatias rastreáveis (`TASK-*` → `AC-*` / `TC-*`) |
| `test-plan.md` | `agt-quality-assurance` (PLAN) | **Antes** do dev | Matriz AC → TC, prioridades P0–P3 |
| `qa-report.md` | `agt-quality-assurance` (VERIFY) | **Depois** do código | Resultado com evidência |

Templates: [`docs/specs/_templates/`](../docs/specs/_templates/).

Metadados padrão no topo de cada documento:

```yaml
feature: <slug>
status: Draft | In Review | Approved | …
version: 0.1.0
owner: …
jira: …
createdAt: YYYY-MM-DD
updatedAt: YYYY-MM-DD
approvedBy: …
approvedAt: …
```

Agents devem **ler e preservar** esses campos — nunca descartá-los.

---

## Agents e papéis

| Agent | Faz | Não faz |
|-------|-----|---------|
| [`agt-orchestrator`](agents/agt-orchestrator.md) | Classifica, sequencia, aplica gates, sintetiza | Editar `src/` ou specs |
| [`agt-product-owner`](agents/agt-product-owner.md) | Requisitos, AC, DoR | Código, schema, library |
| [`agt-architecture`](agents/agt-architecture.md) | `design.md` técnico | Editar `src/`; mudar regra de produto |
| [`agt-quality-assurance`](agents/agt-quality-assurance.md) | PLAN / AUTOMATE / VERIFY | Alterar produção para “passar” teste |
| [`agt-dev-backend`](agents/agt-dev-backend.md) | Implementar o slice aprovado | Reinterpretar regra ambígua |
| [`agt-test-runner`](agents/agt-test-runner.md) | Estabilizar Jest / regressão técnica | Redefinir AC de produto |
| [`agt-code-review`](agents/agt-code-review.md) | Review spec ↔ código (read-only) | Implementar correções |
| [`agt-architecture-review`](agents/agt-architecture-review.md) | Auditoria de camadas pós-código | Escrever design (isso é `agt-architecture`) |
| [`agt-code-quality`](agents/agt-code-quality.md) | Naming + REST | Substituir code review de spec |
| [`agt-verifier`](agents/agt-verifier.md) | Evidência de entrega | Soften asserts |
| [`agt-github-workflow`](agents/agt-github-workflow.md) | Commit atômico / PR | Rodar sem pedido explícito |
| [`agt-jira-workflow`](agents/agt-jira-workflow.md) | Ler / criar Jira | Obrigatório em toda feature |

Skills associadas: `@skill-product-refinement`, `@skill-technical-design`, `@skill-quality-assurance`, `@skill-backend-implementation`, `@skill-code-review`, `@skill-spec-driven`.

---

## Pipeline de feature (padrão)

### 1. Ideia → requisitos

1. Orchestrator classifica intent como `feature` (ou `specify` / `bugfix`).
2. Opcional: `agt-jira-workflow` traz contexto do card.
3. `agt-product-owner` (+ `@skill-product-refinement`) escreve `requirements.md`.
4. **Gate humano:** só avance com decisão explícita:

```text
APPROVED | CHANGES_REQUESTED | REJECTED | BLOCKED
```

Comentário, elogio ou “revise” **não** aprovam.

### 2. Design técnico

1. `agt-architecture` (+ `@skill-technical-design`) produz `design.md`.
2. Tasks rastreáveis em `tasks.md` (via skill / tech).
3. Se o requisito for inviável ou contraditório → devolve pergunta ao PO (não redefine a regra no design).
4. Gate técnico: `APPROVED` (ou `CHANGES_REQUESTED` volta à arquitetura).

Pode pular o design só quando a mudança toca um único contexto **sem** impacto em contrato, persistência ou mensageria.

### 3. QA PLAN (antes do código)

1. `agt-quality-assurance` em modo **PLAN**.
2. Entrada: `requirements.md` + `design.md`.
3. Saída: `test-plan.md` (casos positivos/negativos, P0/P1, níveis unit/int/contrato/mensageria).
4. Critérios impossíveis de testar voltam ao PO — desenvolvimento **não** inicia com AC cego.

Resultado operacional: `READY_FOR_DEVELOPMENT`.

### 4. Implementação

1. `agt-dev-backend` (+ `@skill-backend-implementation`) lê **requirements + design + tasks + test-plan**.
2. Implementa só o slice aprovado; regras de negócio no Service; Domain ↛ Infraestructure.
3. Desvios:

```text
Regra ambígua / ausente     → agt-product-owner
Risco / inviabilidade       → agt-architecture
AC impossível de testar     → QA + PO
Mudança fora do escopo      → orchestrator + PO
```

4. DoD do dev (lint, testes direcionados, OpenAPI se HTTP mudou) antes do handoff.

### 5. Suite técnica

`agt-test-runner` deixa a suite Jest saudável (regressão de tooling ≠ aceite de produto).

### 6. Code review

`agt-code-review` compara requirements ↔ design ↔ tasks ↔ implementação ↔ testes.

Categorias de finding:

```text
BLOCKING_FUNCTIONAL | BLOCKING_ARCHITECTURE | BLOCKING_SECURITY | BLOCKING_CONTRACT
NON_BLOCKING_IMPROVEMENT | STYLE | QUESTION
```

Blocking → volta ao `agt-dev-backend`. Style / melhoria não-bloqueante não param o fluxo.

### 7. QA AUTOMATE + VERIFY

1. `agt-quality-assurance` automatiza o que estiver no test-plan (`src/__tests__/`).
2. Executa comandos reais do `package.json` (test, coverage, lint, etc.).
3. Escreve `qa-report.md` com resultado:

| Resultado | Significado | Próximo passo |
|-----------|-------------|---------------|
| `PASS` | P0/P1 ok, sem defect bloqueante | Segue |
| `PASS_WITH_RISKS` | Core ok, riscos menores explícitos | **Aceite humano de risco** |
| `FAIL` | AC obrigatório falhou / regressão / contrato / arch material | Volta ao dev |
| `BLOCKED` | Ambiente / dado / credencial / regra indecidida | Orchestrator consolida |

Nunca enfraquecer assert para ficar verde.

### 8. Reviews em paralelo + verifier

1. `agt-architecture-review` ∥ `agt-code-quality`.
2. `agt-verifier` — wiring, lint, YAML, evidência de que “foi entregue”.
3. Opcional, **só se pedido:** `agt-github-workflow` (commit / PR). Sem atribuição de IA no Git.

---

## Atalhos (quando pular o SDD completo)

| Situação | Pipeline |
|----------|----------|
| Rename / typo / 1 linha | Um especialista; sem SDD |
| Hotfix ≤ 3 arquivos, sem OpenAPI/rota, critério claro no prompt | `dev` → `test-runner` → `verifier` |
| Bugfix que muda HTTP/OpenAPI | Pelo menos `requirements.md` antes do verifier |
| Só requisitos | `agt-product-owner` → gate humano e para |
| Só design | `agt-architecture` (requirements já aprovados) |
| Só QA | `agt-quality-assurance` no modo pedido (PLAN / AUTOMATE / VERIFY) |
| Só review | `agt-code-review` ou `architecture-review` ∥ `code-quality` |
| Commit / PR | `agt-verifier` → `agt-github-workflow` (pedido explícito) |

---

## Gates e decisões

Toda aprovação de produto/design/risco usa uma destas palavras — **nada implícito**:

```text
APPROVED | CHANGES_REQUESTED | REJECTED | BLOCKED
```

| Gate | Quem decide | Se falhar |
|------|-------------|-----------|
| Requirements | Humano responsável | Volta ao PO |
| Design | Humano / tech | Volta à arquitetura (conflito de produto → PO) |
| QA PLAN ok | Fluxo / orchestrator | Critérios bloqueados → PO |
| Code review | Reviewer (agent) | Blocking → dev |
| QA VERIFY | Evidência + resultado | `FAIL` → dev; `PASS_WITH_RISKS` → aceite humano; `BLOCKED` → owner |
| Commit / PR | Usuário explícito | Não chama github-workflow |

---

## Rastreabilidade

```text
OBJ-01
 └── US-01
      ├── BR-01
      ├── FLOW-01
      └── AC-01
           ├── TC-01  (test-plan)
           ├── TASK-01
           ├── src/__tests__/…
           └── evidência no qa-report.md
```

Identificadores estáveis: `OBJ-*`, `ACT-*`, `US-*`, `BR-*`, `FLOW-*`, `AC-*`, `NFR-*`, `ASM-*`, `RQ-*`, `RISK-*`, `METRIC-*`, `DEC-*`, `TC-*`, `TASK-*`, `DEF-*`, `ARCH-*`.

Quando um requisito **já aprovado** muda: PO versiona + changelog → arquitetura faz impact analysis → QA atualiza test-plan → tasks afetadas → QA report registra a versão validada. Nenhum agent valida uma versão diferente da implementada.

---

## Como usar no dia a dia

1. **Feature nova:** no chat, peça ao `agt-orchestrator` (ou “rode o pipeline SDD”) com o problema — não só a solução técnica.
2. No gate de requirements, responda com **`APPROVED`** (ou `CHANGES_REQUESTED` + o que mudar).
3. Deixe o orchestrator conduzir design → QA PLAN → dev → review → QA VERIFY → verifier.
4. Commit/PR só quando você pedir explicitamente.

Pedido óbvio de um único papel (só PO, só QA, só PR) → chame o agent direto; o orchestrator também redireciona.

---

## O que ainda não faz parte deste fluxo

Reservado para evoluções posteriores (Fases 3–4 do guia de processo):

- `agt-release` / `skill-release-readiness` / `release-report.md`
- Outcome review pós-produção e máquina de estados formal aparte deste documento

Release de versão do pacote continua em [rule.release.mdc](rules/rule.release.mdc) (semantic-release / Conventional Commits) — distinto de “prontidão operacional da feature”.

---

## Referências rápidas

| Doc | Para quê |
|-----|----------|
| [SPECS.md](SPECS.md) | Kit Spec-Driven, artefatos, skills |
| [docs/specs/README.md](../docs/specs/README.md) | Convenção de pasta e templates |
| [RULES.md](RULES.md) | Índice de rules por camada |
| [QUALITY.md](QUALITY.md) | Naming / REST / audits |
| [GITHUB.md](GITHUB.md) | Commits e PR |
| [JIRA.md](JIRA.md) | Issues Jira |
| [AGENTS.md](../AGENTS.md) | Contrato curto do repo |
| [docs/architecture-and-layers.md](../docs/architecture-and-layers.md) | Camadas Domain → Configuration |
