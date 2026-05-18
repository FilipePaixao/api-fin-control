# st-node-boilerlplate

Base de projeto para APIs REST em **Node.js**, **TypeScript**, **Express** e **MongoDB** (Mongoose), com validação **OpenAPI**, testes **Jest** (unitários e integração) e organização em **camadas** (domain, application, infraestructure, configuration).

**Architecture documentation (layers, Mermaid diagrams, patterns and anti-patterns):** [docs/architecture-and-layers.md](docs/architecture-and-layers.md) — also available via the root entry [ARCHITECTURE.md](ARCHITECTURE.md).

---

## O que já vem no boilerplate

| Área | Tecnologia / padrão |
|------|---------------------|
| HTTP | Express, Helmet, rotas por controller |
| Contrato da API | `express-openapi-validator` + `src/contracts/service.yaml` |
| Persistência | Mongoose, repositório read/write, adapters `IM*` ↔ `IUser` |
| Observabilidade | `traceability` (async hooks / logging) |
| Pacotes internos | `@sauvvitech/st-packages` (autorização, erros traduzidos, etc.) |
| Qualidade | ESLint, Prettier, Jest, Husky (conforme config do repo) |

---

## Pré-requisitos

- **Node.js** (versão compatível com o `package.json` do repositório)
- **Yarn**
- **MongoDB** (ou outro endpoint compatível com a URI) apenas para **`yarn dev`** / **`yarn start`** em ambiente local — configure `DATABASE_URI` no `.env`
- **Testes de integração** (`yarn test:int`): usam **MongoDB em memória** via `mongodb-memory-server` (ver `jest/start-integration.ts`); não exige instância Mongo instalada só para correr essa suíte

---

## Configuração rápida

1. Clone o repositório e instale dependências:

   ```bash
   yarn install
   ```

2. Crie um ficheiro **`.env`** na raiz (o `dev` usa `--env-file=.env`). Variáveis usadas na subida da app incluem:

   | Variável | Descrição |
   |----------|-----------|
   | `DATABASE_URI` | URI de conexão MongoDB (necessária para `databaseSetup`) |
   | `PORT` | Porta HTTP (opcional; predefinição **3000** em `src/app.ts`) |

   Exemplo mínimo:

   ```env
   PORT=3000
   DATABASE_URI=mongodb://usuario:password@localhost:27017/nomeDaBase
   ```

3. Arranque em modo desenvolvimento (hot reload com `ts-node-dev`):

   ```bash
   yarn dev
   ```

4. **Health check:** `GET /health` (definido no `Server`).

---

## Scripts principais

| Comando | Função |
|---------|--------|
| `yarn dev` | Servidor em TS com reload e `.env` |
| `yarn build` | Compila TypeScript e copia `src/contracts/*.yaml` para `dist/` |
| `yarn start` | Executa `node dist/src/app.js` (após build) |
| `yarn test` | Unitários + integração |
| `yarn test:unit` | Apenas testes unitários |
| `yarn test:int` | Apenas testes de integração |
| `yarn test:coverage` | Cobertura (meta do projeto: ≥ 80 % — ver `AGENTS.md`) |
| `yarn lint` / `yarn lint:fix` | ESLint |
| `yarn prettier` | Formatação Prettier em `src/**/*.ts` |
| `yarn clean` | Remove pasta `dist` |

---

## Arquitetura e pastas

O fluxo típico é: **HTTP → Controller (application) → Service (domain) → Repositório (contrato no domain, implementação na infraestructure) → Mongo + adapters**.

Documentação detalhada:

- **[`docs/architecture-and-layers.md`](docs/architecture-and-layers.md)** — layers, patterns, do/avoid examples and Mermaid diagrams
- **[`AGENTS.md`](AGENTS.md)** — convenções de nomes (`I*`, `IM*`), estrutura de pastas e checklist para contribuições

Resumo da árvore `src/`:

```text
src/
├── application/controllers/   # Express: rotas e delegação ao service
├── configuration/             # dotenv, factories (DI), env-constants
├── contracts/                 # OpenAPI (ex.: service.yaml)
├── domain/                    # Entidades, services, contratos de repositório, Server
├── infraestructure/           # Mongo (schema/model), repos, adapters, i18n de erros
└── __tests__/                 # Unitários e integração
```

---

## API e OpenAPI

As rotas e payloads devem estar alinhados com **`src/contracts/service.yaml`**. O servidor valida pedidos e respostas contra essa especificação; ao alterar endpoints, **atualize o YAML** e os testes correspondentes.

---

## Licença

Ver o campo `license` no [`package.json`](package.json) (ex.: ISC).
