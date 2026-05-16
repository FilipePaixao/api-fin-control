---
name: skill-boilerplate-domain-errors
description: >-
  Padroniza erros HTTP traduzidos no st-node-boilerplate: EErrorCode, IThrowedError no service,
  ErrorCatalog i18n, handleTranslatedError no controller, DATABASE_ERROR no repositório.
  Use quando adicionar código de erro, 404/409/500 ou mensagens pt-BR/en/es na API.
disable-model-invocation: true
---

# Skill: erros de domínio e resposta HTTP traduzida

Lê [docs/arquitetura-e-camadas.md](../../../docs/arquitetura-e-camadas.md) (§3.3, §4.2).

## Regra de ouro

| Camada | Faz | Não faz |
|--------|-----|---------|
| **Repository** | Retorna `null` se não achar; em falha de DB lança `DATABASE_ERROR` (500) | Lançar 404 de produto |
| **Service** | Interpreta `null`, valida regras; lança 404/409 com `EErrorCode` | Aceder a `AppointmentModel` / Mongo |
| **Controller** | `handleTranslatedError(error, ErrorCatalog, res)` | Traduzir mensagens manualmente |

## Fluxo para novo código de erro

1. **Enum** — adicionar valor em [`EErrorCode.ts`](../../../src/domain/common/errors/enums/EErrorCode.ts).

2. **Catálogo i18n** — entrada em [`error-catalog.ts`](../../../src/infraestructure/i18n/error-catalog.ts) com `pt-BR`, `en`, `es`.

3. **Service** — lançar objeto tipado como `IThrowedError`:

```ts
throw {
  status: 404,
  errorCode: EErrorCode.RESOURCE_NOT_FOUND,
  message: 'User not found',
  details: { id },
} as IThrowedError;
```

Referência: [`user.service.ts`](../../../src/domain/user/service/user.service.ts) (409 conflito, 404 not found).

4. **Repository** — em `catch` de operações Mongo:

```ts
serviceLogErrorHandler(error, { eventName: '...', eventData: { ... } });
throw { status: 500, errorCode: EErrorCode.DATABASE_ERROR } as IThrowedError;
```

Referência: [`user.repository.read.ts`](../../../src/infraestructure/repository/user/user.repository.read.ts).

5. **Controller** — importar `ErrorCatalog` e usar em todos os handlers:

```ts
} catch (error) {
  handleTranslatedError(error, ErrorCatalog, res);
}
```

Referência: [`user.controller.ts`](../../../src/application/controllers/user.controller.ts).

## Testes

- Service: `rejects.toMatchObject({ status, errorCode, details })` e `expect(ErrorCatalog[EErrorCode.*]).toBeDefined()`.
- Controller: assert corpo com `code` / mensagem traduzida quando aplicável.
- Referência: [`create-user.int.test.ts`](../../../src/__tests__/integration/user/service/create-user.int.test.ts).

## Checklist

- [ ] Novo `EErrorCode` + entrada no `ErrorCatalog`
- [ ] 404/409 só no service; repo devolve `null`
- [ ] Controller sem lógica de negócio nos erros
- [ ] OpenAPI atualizado se expuser novo código (ver [skill-openapi-contract](../skill-openapi-contract/SKILL.md))
