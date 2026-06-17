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

## Agente de IA (Ollama)

O assistente conversacional usa um LLM local via [Ollama](https://ollama.com).

### Pré-requisitos

1. Instale o Ollama e baixe um modelo com suporte a **tool calling** (recomendado: `llama3.2`):

   ```bash
   ollama pull llama3.2
   ollama serve
   ```

2. Configure no `.env`:

   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   OLLAMA_TIMEOUT_MS=60000
   ```

### System prompt (comportamento do agente)

As regras, tom, restrições e boas práticas do assistente ficam em:

**[`src/domain/agent/prompts/agent-system-prompt.md`](src/domain/agent/prompts/agent-system-prompt.md)**

Esse arquivo é carregado na inicialização via factory (`loadAgentSystemPrompt`) e enviado como mensagem `system` ao Ollama. Edite-o para ajustar o comportamento sem alterar código TypeScript. Após `yarn build`, o `.md` é copiado para `dist/`.

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/agent/conversations` | Lista conversas do usuário |
| `POST` | `/api/agent/conversations` | Cria conversa vazia |
| `GET` | `/api/agent/conversations/:id` | Conversa com histórico de mensagens |
| `PATCH` | `/api/agent/conversations/:id` | Renomeia conversa |
| `DELETE` | `/api/agent/conversations/:id` | Exclui conversa e mensagens |
| `POST` | `/api/agent/chat` | Envia mensagem (`conversationId` opcional); histórico fica no servidor |
| `POST` | `/api/agent/actions/execute` | Executa ação confirmada (`CREATE_EXPENSE`, `UPDATE_SALARY`) |

**Breaking change:** `POST /api/agent/chat` passou a receber `{ message, conversationId? }` em vez de `{ messages[] }`. O cliente não precisa mais reenviar o histórico completo.

### Histórico e conhecimento global

- Conversas e mensagens são persistidas no **MongoDB**, isoladas por `userId`.
- Dicas gerais anonimizadas (sem PII) são indexadas em **Postgres/pgvector** (`global_knowledge_embeddings`) e usadas como contexto no system prompt.
- Nenhum dado pessoal de um usuário é exposto a outro.

### Fine-tuning offline

1. Acumule conversas reais em produção/staging.
2. Exporte dataset anonimizado:

   ```bash
   yarn agent:export-training-data
   ```

3. Pipeline completo (requer `AGENT_FINE_TUNE_ENABLED=true`):

   ```bash
   yarn agent:fine-tune
   ```

4. Após fine-tune externo com o JSONL gerado, aponte `OLLAMA_MODEL` para o tag configurado (`AGENT_FINE_TUNE_MODEL_TAG`, padrão `fincontrol-agent`).
5. Rollback: volte `OLLAMA_MODEL=llama3.2`.

Variáveis: `AGENT_FINE_TUNE_ENABLED`, `AGENT_FINE_TUNE_MODEL_TAG`, `AGENT_FINE_TUNE_MIN_SAMPLES` (mínimo de amostras para export).

O endpoint legado `POST /api/rag/ask` permanece disponível.

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
| `yarn agent:export-training-data` | Exporta JSONL anonimizado para fine-tune |
| `yarn agent:fine-tune` | Pipeline offline de export + instruções Ollama |

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
