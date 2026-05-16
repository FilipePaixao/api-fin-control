---
name: skill-boilerplate-mongo-persistence
description: >-
  Estende persistência Mongo no st-node-boilerplate: IM*, schema, model, adapter dbToInternal/
  internalToDb, repositórios Read/Write (CQRS). Use para novo campo, método de repo ou schema
  sem criar contexto completo.
disable-model-invocation: true
---

# Skill: persistência Mongo (CQRS leve)

Lê [docs/arquitetura-e-camadas.md](../../../docs/arquitetura-e-camadas.md) (§5) e [AGENTS.md](../../../AGENTS.md) (padrão `IM*`).

**Não usar** para contexto novo do zero — ver [skill-new-context](../skill-new-context/SKILL.md).

## Ordem (contrato primeiro)

1. **Domain**
   - Atualizar `I*` em `entity/interfaces/`.
   - Novos métodos em `I*RepositoryRead` e/ou `I*RepositoryWrite` (leitura vs escrita separados).

2. **Infraestructure — modelo**
   - `IM*` extends `I*` + `_id`, `updatedAt` (em `db/mongo/interfaces/` ou no próprio `models/<contexto>.model.ts`, como em [`user.model.ts`](../../../src/infraestructure/db/mongo/models/user.model.ts)).
   - `schema/<contexto>.schema.ts` com `Schema<IM*>`.
   - `models/<contexto>.model.ts` com `model<IM*>`.

3. **Adapter** (funções puras, sem side effects)
   - `dbToInternal(im): I*`
   - `internalToDb(i): Omit<IM*, '_id' | 'createdAt' | 'updatedAt'>`
   - Referência: [`user.adapter.ts`](../../../src/infraestructure/repository/user/adapters/user.adapter.ts).

4. **Repositórios**
   - **Read:** `findOne` / `find` → `doc ? dbToInternal(doc) : null`.
   - **Write:** `create` / `update` / `delete` com `internalToDb` no payload.
   - Referência: [`user.repository.read.ts`](../../../src/infraestructure/repository/user/user.repository.read.ts), [`user.repository.write.ts`](../../../src/infraestructure/repository/user/user.repository.write.ts).

5. **Erros de DB** — ver [skill-domain-errors](../skill-domain-errors/SKILL.md) (`DATABASE_ERROR`, `serviceLogErrorHandler`).

## Pode / não pode (repositório)

| Pode | Não pode |
|------|----------|
| CRUD + `dbToInternal` | Regra “não encontrado → 404” (service decide) |
| Retornar `null` | Expor `IM*` ao controller ou domain |
| Lançar 500 em falha de Mongo | Importar service ou controller |

## Diagrama (resumo)

```text
I* (domain) ←── dbToInternal ── IMAppointment (Mongo doc)
I* ── internalToDb ──→ payload persistível (sem _id/timestamps geridos pelo schema)
```

## Checklist

- [ ] Contratos Read/Write no domain atualizados antes da infra
- [ ] Adapter mapeia todos os campos novos
- [ ] Métodos de leitura só em Read; escrita só em Write
- [ ] Testes em `repository/read` e `repository/write`
- [ ] Domain continua sem imports de `mongoose` ou `infraestructure`
