---
name: skill-boilerplate-tests-layered
description: >-
  Cria ou estende testes Jest no st-node-boilerplate espelhando camadas: integração
  controller/service/repository (read/write), unitário de service, mocks e cobertura ≥80%.
  Use após alterar src/, ao pedir testes de integração, unitários ou cobertura.
disable-model-invocation: true
---

# Skill: testes em camadas (`src/__tests__`)

Lê [docs/arquitetura-e-camadas.md](../../../docs/arquitetura-e-camadas.md) (§8) e [AGENTS.md](../../../AGENTS.md) (§4).

## Estrutura de pastas (espelhar `user`)

```text
src/__tests__/
  __mocks__/<contexto>.mock.ts
  integration/<contexto>/
    controller/*.int.test.ts
    service/*.int.test.ts
    repository/read/*.int.test.ts
    repository/write/*.int.test.ts
  unit/<contexto>/service/*.unit.test.ts   # quando existir padrão no repo
```

## Por camada

### Controller (HTTP)

- `supertest` contra `app` do setup de integração.
- Assert `statusCode` e corpo JSON.
- Opcional: verificar persistência com `*Model` após POST/PUT/DELETE.
- Referência: [`create-user.int.test.ts`](../../../src/__tests__/integration/user/controller/create-user.int.test.ts).

### Service (negócio)

- Instanciar via `*ServiceFactory.create()` — **sem** HTTP.
- Mock de dados com `validUserMock` ou `UserModel.create` para cenários de conflito.
- Assert erros com `errorCode` + `ErrorCatalog`.
- Referência: [`create-user.int.test.ts`](../../../src/__tests__/integration/user/service/create-user.int.test.ts) (service).

### Repository (persistência)

- Testar implementação concreta Read/Write separadamente.
- Pastas `repository/read/` e `repository/write/` (CQRS leve).
- Referência: [`find-user-by-id.int.test.ts`](../../../src/__tests__/integration/user/repository/read/find-user-by-id.int.test.ts).

## Convenções

- Sufixo `*.int.test.ts` para integração.
- Mocks partilhados em [`__mocks__/user.mock.ts`](../../../src/__tests__/__mocks__/user.mock.ts) (`validUserMock`).
- Descrições em inglês no `describe`/`it` (padrão do repo).

## Comandos

| Comando | Uso |
|---------|-----|
| `yarn test` | Suite completa |
| `yarn test:coverage` | Cobertura alvo ≥ 80% |
| `yarn lint` | ESLint após alterações |

## Checklist

- [ ] Novo comportamento tem teste na camada onde a lógica vive
- [ ] Controller: caminho feliz + pelo menos um erro HTTP relevante
- [ ] Service: conflito / not found quando aplicável
- [ ] Repository: read e write em ficheiros/pastas corretas
- [ ] `yarn test` e `yarn test:coverage` passam

## Skills relacionadas

- Novo endpoint: [skill-add-http-endpoint](../skill-add-http-endpoint/SKILL.md)
- Erros: [skill-domain-errors](../skill-domain-errors/SKILL.md)
