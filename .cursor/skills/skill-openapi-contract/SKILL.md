---
name: skill-boilerplate-openapi-contract
description: >-
  Sincroniza src/contracts/service.yaml com rotas Express e payloads do st-node-boilerplate.
  Use quando alterar path, método HTTP, request/response, schemas OpenAPI ou documentar
  códigos de erro da API (404, 409, 500, auth).
disable-model-invocation: true
---

# Skill: contrato OpenAPI (`service.yaml`)

Lê [docs/arquitetura-e-camadas.md](../../../docs/arquitetura-e-camadas.md) (§7) e [AGENTS.md](../../../AGENTS.md) (checklist de contribuição).

O `Server` valida a API com `express-openapi-validator` — paths e schemas devem coincidir com o código.

## Passos

1. **Espelhar rotas**
   - Cada rota em `initRoutes()` do controller deve existir em `paths` do YAML.
   - Comparar [`user.controller.ts`](../../../src/application/controllers/user.controller.ts) com `paths` em [`service.yaml`](../../../src/contracts/service.yaml) (`/users`, `/users/{id}`, etc.).

2. **Métodos e parâmetros**
   - `get` / `post` / `put` / `delete` alinhados ao Express.
   - `parameters`: path (`id`), query, headers (ex. auth quando `authorizeByGroup` está na rota).
   - `requestBody` com `$ref` a schema em `components/schemas` para POST/PUT.

3. **Responses**
   - Sucesso: status + schema (`User`, array de `User`, etc.) alinhado a `I*` do domain.
   - Erros de negócio documentados conforme o service:
     - `404` — `RESOURCE_NOT_FOUND`
     - `409` — `RESOURCE_CONFLICT`
     - `500` — `DATABASE_ERROR` / `Error` genérico
   - Rotas com `authorizeByGroup`: incluir `400` e `403` com `AuthMiddlewareError` (ver GET `/users` no YAML).

4. **Schemas em `components/schemas`**
   - Reutilizar `$ref` (`User`, `NewUser`, `Error`, `AuthMiddlewareError`).
   - Novos campos no domain → atualizar schema correspondente (tipos, `required`, formatos de data).

5. **Tags e metadados**
   - Agrupar por recurso (ex. tag `Users`) para manter o YAML legível.

## Checklist

- [ ] Path e verbo no controller = path e verbo no YAML
- [ ] Body/query documentados batem com o que o controller extrai de `req`
- [ ] Códigos de erro que o service lança têm response documentada
- [ ] Testes de integração de controller passam (`yarn test`)

## Skills relacionadas

- Novo endpoint: [skill-add-http-endpoint](../skill-add-http-endpoint/SKILL.md)
- Erros i18n: [skill-domain-errors](../skill-domain-errors/SKILL.md)
