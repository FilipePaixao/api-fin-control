---
name: skill-boilerplate-add-http-endpoint
description: >-
  Adiciona um endpoint HTTP num contexto já existente do st-node-boilerplate: método no service,
  rota no controller fino, factory se necessário. Use quando pedir nova rota, novo método REST
  ou operação HTTP sem criar contexto/módulo novo (ex. GET /users/by-email).
disable-model-invocation: true
---

# Skill: novo endpoint HTTP (contexto existente)

Lê [docs/arquitetura-e-camadas.md](../../../docs/arquitetura-e-camadas.md) (§4 Application, §10) e use o contexto `user` como referência.

**Não usar** para contexto novo — ver [skill-new-context](../skill-new-context/SKILL.md).

## Ordem de implementação

1. **Domain — service**
   - Declarar método em `src/domain/<contexto>/interfaces/<contexto>.service.interface.ts`.
   - Implementar em `src/domain/<contexto>/service/<contexto>.service.ts`: regras de negócio, `*ServiceEntity`, `IThrowedError` + `EErrorCode` (ver [skill-domain-errors](../skill-domain-errors/SKILL.md)).
   - Referência: [`user.service.ts`](../../../src/domain/user/service/user.service.ts).

2. **Repositório (se precisar de dados novos)**
   - Estender `I*RepositoryRead` / `I*RepositoryWrite` no domain.
   - Implementar na infra — ver [skill-mongo-persistence](../skill-mongo-persistence/SKILL.md).

3. **Application — controller**
   - Registar rota em `initRoutes()` de `src/application/controllers/<contexto>.controller.ts`.
   - Handler fino: extrair `params` / `body` / `query` → chamar service → `res.status(...).json(...)`.
   - `try/catch` com `handleTranslatedError(error, ErrorCatalog, res)`.
   - Referência: [`user.controller.ts`](../../../src/application/controllers/user.controller.ts).

4. **Configuration — factory**
   - Alterar `src/configuration/factory/<contexto>.service.factory.ts` **só** se o service ganhar novas dependências no construtor.

5. **Contrato e testes**
   - OpenAPI: [skill-openapi-contract](../skill-openapi-contract/SKILL.md).
   - Testes: [skill-tests-layered](../skill-tests-layered/SKILL.md).

## Status HTTP (orientação)

| Situação | Status |
|----------|--------|
| Leitura com sucesso | 200 |
| Criação | 201 |
| Conflito de negócio (ex. email duplicado) | 409 (service) |
| Recurso inexistente | 404 (service) |
| Erro de base de dados | 500 (repositório) |

## Anti-padrões

- Lógica de unicidade, validação de negócio ou queries Mongo no controller.
- Instanciar `*RepositoryRead` / `*RepositoryWrite` no controller (usar factory).
- Traduzir erros manualmente no controller (usar `handleTranslatedError`).

## Checklist

- [ ] Service contém regras; controller só orquestra HTTP
- [ ] `service.yaml` atualizado
- [ ] Testes de controller e service (mínimo caminho feliz + erro principal)
- [ ] `yarn test` e `yarn lint` passam
