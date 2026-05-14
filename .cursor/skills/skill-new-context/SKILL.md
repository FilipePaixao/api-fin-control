---
name: skill-boilerplate-new-context
description: >-
  Guia passo a passo para adicionar um novo contexto (bounded context) ao st-node-boilerplate:
  domain entity/repos/service, infra Mongo+adapter+repos, controller, factories e OpenAPI.
  Use quando o utilizador pedir novo recurso, novo módulo ou scaffold semelhante ao `user`.
disable-model-invocation: true
---

# Skill: novo contexto no st-node-boilerplate

Lê [AGENTS.md](../../../AGENTS.md) (secções 1–3 e 5–6) e [docs/arquitetura-e-camadas.md](../../../docs/arquitetura-e-camadas.md) antes de gerar ficheiros.

## Ordem sugerida

1. **Domain** — `src/domain/<contexto>/`
   - `entity/interfaces/<contexto>.interface.ts` (`I*`)
   - `entity/<contexto>.entity.ts` (classe `*ServiceEntity` com validação)
   - `repository/<contexto>.repository.read.ts` e `.write.ts` (`I*RepositoryRead` / `I*RepositoryWrite`)
   - `service/<contexto>.service.ts` (só interfaces de repo + entity)

2. **Infraestructure** — `src/infraestructure/`
   - `db/mongo/interfaces/<contexto>.interface.ts` (`IM*` extends `I*`)
   - `db/mongo/schema/<contexto>.schema.ts`, `models/<contexto>.model.ts`
   - `repository/<contexto>/adapters/<contexto>.adapter.ts` (`dbToInternal`, `internalToDb`)
   - `repository/<contexto>/<contexto>.repository.read.ts` e `.write.ts` (implementações)

3. **Application** — `src/application/controllers/<contexto>.controller.ts` (fino, chama service)

4. **Configuration** — `src/configuration/factory/<contexto>.service.factory.ts`, `<contexto>.controller.factory.ts`; registar controller em [src/app.ts](../../../src/app.ts) se necessário

5. **Contracts** — atualizar [src/contracts/service.yaml](../../../src/contracts/service.yaml) com paths e schemas

6. **Testes** — `src/__tests__/integration/` e `unit/` espelhando o contexto `user` como referência

## Checklist final

- [ ] Domain sem imports de `infraestructure` ou `mongoose`
- [ ] `IM*` só na infra; adapters puros
- [ ] Factories injetam implementações concretas
- [ ] `yarn test` e `yarn lint` passam
