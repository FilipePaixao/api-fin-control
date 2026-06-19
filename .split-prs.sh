#!/usr/bin/env bash
set -euo pipefail

SOURCE="temp-split-source"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

create_pr() {
  local branch="$1"
  local commit_msg="$2"
  local pr_title="$3"
  local pr_body="$4"
  shift 4
  local files=("$@")

  git checkout main -q
  git branch -D "$branch" 2>/dev/null || true

  git checkout -b "$branch"
  git checkout "$SOURCE" -- "${files[@]}"
  git add "${files[@]}"
  git commit -m "$commit_msg"

  git push -u origin "$branch" --force-with-lease 2>/dev/null || git push -u origin "$branch"

  gh pr create \
    --title "$pr_title" \
    --body "$pr_body" \
    --head "$branch" \
    --base main 2>/dev/null || echo "PR may already exist for $branch"
}

# --- DOMAIN ---

create_pr "feat/platform-domain" \
  "feat: add common utils and error codes for profile and onboarding" \
  "feat: platform domain — common utils and error codes" \
  "## Summary
- Adiciona utilitários compartilhados (generate-id, reference-month)
- Expande catálogo de erros e códigos de domínio

## Test plan
- [ ] yarn test --testPathPattern=common" \
  src/domain/common/errors/enums/EErrorCode.ts \
  src/domain/common/utils/generate-id.ts \
  src/domain/common/utils/reference-month.ts \
  src/infraestructure/i18n/error-catalog.ts

create_pr "feat/user-domain" \
  "feat: add user profile, verification and personalization domain" \
  "feat: user domain — profile, verification and personalization" \
  "## Summary
- Estende entidade de usuário com perfil financeiro e endereço
- Adiciona enums de verificação, perfil de investimento e situação de moradia
- Implementa updateProfile e utilitários de contexto personalizado

## Test plan
- [ ] yarn test --testPathPattern=user" \
  src/domain/user/entity/enums/EInvestmentProfile.ts \
  src/domain/user/entity/enums/ELivingSituation.ts \
  src/domain/user/entity/enums/EUserVerificationStatus.ts \
  src/domain/user/entity/interfaces/address.interface.ts \
  src/domain/user/entity/interfaces/user-profile.interface.ts \
  src/domain/user/entity/interfaces/user.interface.ts \
  src/domain/user/entity/user.entity.ts \
  src/domain/user/interfaces/user.service.interface.ts \
  src/domain/user/service/user.service.ts \
  src/domain/user/utils/regional-context.utils.ts \
  src/domain/user/utils/user-personalization-context.utils.ts \
  src/domain/user/utils/user-profile-context.utils.ts \
  src/domain/user/utils/user-profile.utils.ts \
  src/domain/user/utils/user-verification-state.utils.ts

create_pr "feat/address-domain" \
  "feat: add address lookup domain service" \
  "feat: address domain — CEP lookup service" \
  "## Summary
- Adiciona serviço de endereço com integração ViaCEP

## Test plan
- [ ] yarn test --testPathPattern=address" \
  src/domain/address/interfaces/address.service.interface.ts \
  src/domain/address/interfaces/via-cep.provider.interface.ts \
  src/domain/address/service/address.service.ts

create_pr "feat/regional-economics-domain" \
  "feat: add regional economics cost profile domain" \
  "feat: regional-economics domain — cost profiles and fallbacks" \
  "## Summary
- Adiciona serviço de economia regional com perfis de custo por cidade

## Test plan
- [ ] yarn test --testPathPattern=regional-economics" \
  src/domain/regional-economics/entity/enums/ERegionalConfidence.ts \
  src/domain/regional-economics/entity/enums/ERegionalDataSource.ts \
  src/domain/regional-economics/entity/enums/ERegionalFallbackLevel.ts \
  src/domain/regional-economics/entity/interfaces/regional-cost-profile.interface.ts \
  src/domain/regional-economics/interfaces/fipe-zap-data.provider.interface.ts \
  src/domain/regional-economics/interfaces/regional-economics.service.interface.ts \
  src/domain/regional-economics/interfaces/zoneval.provider.interface.ts \
  src/domain/regional-economics/service/regional-economics.service.ts

create_pr "feat/expense-domain" \
  "feat: add expense indexing utils and service sync hooks" \
  "feat: expense domain — indexing utils and RAG sync hooks" \
  "## Summary
- Adiciona utilitários de documento de índice e labels
- Estende serviço de despesas com hooks de sincronização

## Test plan
- [ ] yarn test --testPathPattern=expense" \
  src/domain/expense/entity/expense.entity.ts \
  src/domain/expense/interfaces/expense.service.interface.ts \
  src/domain/expense/repository/expense.repository.read.ts \
  src/domain/expense/service/expense.service.ts \
  src/domain/expense/utils/expense-index-document.utils.ts \
  src/domain/expense/utils/expense-labels.utils.ts

create_pr "feat/expense-search-domain" \
  "feat: add hybrid expense search with reciprocal rank fusion" \
  "feat: expense-search domain — hybrid search service" \
  "## Summary
- Adiciona busca híbrida de despesas com RRF

## Test plan
- [ ] yarn test --testPathPattern=expense-search" \
  src/domain/expense-search/interfaces/expense-index.repository.ts \
  src/domain/expense-search/interfaces/expense-search.service.interface.ts \
  src/domain/expense-search/service/expense-search.service.ts \
  src/domain/expense-search/utils/reciprocal-rank-fusion.utils.ts

create_pr "feat/rag-domain" \
  "feat: add expense sync and filtered vector search to RAG" \
  "feat: rag domain — expense sync and filtered search" \
  "## Summary
- Adiciona sincronização de despesas no RAG
- Estende busca vetorial com filtros por usuário

## Test plan
- [ ] yarn test --testPathPattern=rag" \
  src/domain/rag/interfaces/rag.service.interface.ts \
  src/domain/rag/repository/vector-store.repository.ts \
  src/domain/rag/service/rag.service.ts \
  src/domain/rag/utils/expense-rag-content.utils.ts

create_pr "feat/onboarding-domain" \
  "feat: add onboarding flow domain with agent actions" \
  "feat: onboarding domain — profile onboarding flow" \
  "## Summary
- Adiciona fluxo de onboarding com ações e ferramentas dedicadas

## Test plan
- [ ] yarn test --testPathPattern=onboarding" \
  src/domain/onboarding/interfaces/onboarding.service.interface.ts \
  src/domain/onboarding/service/onboarding-action.service.ts \
  src/domain/onboarding/service/onboarding.service.ts \
  src/domain/onboarding/tools/onboarding-tools.ts

create_pr "feat/agent-domain" \
  "feat: add onboarding conversations and agent response guard" \
  "feat: agent domain — onboarding chat and response guard" \
  "## Summary
- Adiciona tipo de conversa de onboarding e prompt dedicado
- Refatora exportação de treino e guard de resposta do agente
- Atualiza auth para suportar fluxo de onboarding

## Test plan
- [ ] yarn test --testPathPattern=agent" \
  src/domain/agent/entity/enums/EAgentActionType.ts \
  src/domain/agent/entity/enums/EConversationType.ts \
  src/domain/agent/entity/interfaces/conversation.interface.ts \
  src/domain/agent/interfaces/conversation.service.interface.ts \
  src/domain/agent/interfaces/training-dataset-writer.interface.ts \
  src/domain/agent/prompts/agent-system-prompt.md \
  src/domain/agent/prompts/onboarding-system-prompt.md \
  src/domain/agent/repository/chat-message.repository.read.ts \
  src/domain/agent/repository/chat-message.repository.write.ts \
  src/domain/agent/repository/conversation.repository.read.ts \
  src/domain/agent/service/agent-action.service.ts \
  src/domain/agent/service/agent-training-export.service.ts \
  src/domain/agent/service/agent.service.ts \
  src/domain/agent/service/conversation.service.ts \
  src/domain/agent/tools/agent-tools.ts \
  src/domain/agent/utils/agent-response-guard.ts \
  src/domain/auth/interfaces/auth.service.interface.ts \
  src/domain/auth/service/auth.service.ts

# --- INFRAESTRUCTURE ---

create_pr "feat/user-infraestructure" \
  "feat: add user profile schema and adapter mappings" \
  "feat: user infraestructure — profile schema and adapter" \
  "## Summary
- Estende schema MongoDB e adapter de usuário para perfil

## Test plan
- [ ] yarn test --testPathPattern=user/repository" \
  src/infraestructure/db/mongo/schema/user.schema.ts \
  src/infraestructure/repository/user/adapters/user.adapter.ts

create_pr "feat/address-infraestructure" \
  "feat: add ViaCEP external provider" \
  "feat: address infraestructure — ViaCEP provider" \
  "## Summary
- Implementa provider HTTP para consulta de CEP

## Test plan
- [ ] yarn test --testPathPattern=via-cep" \
  src/infraestructure/external/via-cep/via-cep.provider.ts

create_pr "feat/regional-economics-infraestructure" \
  "feat: add FipeZap and Zoneval data providers" \
  "feat: regional-economics infraestructure — data providers" \
  "## Summary
- Adiciona providers de dados regionais FipeZap e Zoneval

## Test plan
- [ ] yarn test --testPathPattern=regional-economics" \
  src/infraestructure/data/fipe-zap-data.provider.ts \
  src/infraestructure/data/regional/fipe-zap-rent-by-city.json \
  src/infraestructure/external/zoneval/zoneval.provider.ts

create_pr "feat/expense-infraestructure" \
  "feat: add expense repository read extensions" \
  "feat: expense infraestructure — repository read extensions" \
  "## Summary
- Estende repositório de leitura de despesas

## Test plan
- [ ] yarn test --testPathPattern=expense/repository" \
  src/infraestructure/db/mongo/schema/expense.schema.ts \
  src/infraestructure/repository/expense/expense.repository.read.ts

create_pr "feat/expense-search-infraestructure" \
  "feat: add OpenSearch client and expense index repository" \
  "feat: expense-search infraestructure — OpenSearch index" \
  "## Summary
- Adiciona client OpenSearch e repositório de índice de despesas

## Test plan
- [ ] yarn test --testPathPattern=expense-search" \
  src/infraestructure/clients/opensearch.client.ts \
  src/infraestructure/repository/search/opensearch-expense-index.repository.ts

create_pr "feat/rag-infraestructure" \
  "feat: add Ollama embedding provider and pgvector filters" \
  "feat: rag infraestructure — embedding provider and filters" \
  "## Summary
- Adiciona provider de embeddings Ollama
- Estende migrations Postgres com filtros de busca

## Test plan
- [ ] yarn test --testPathPattern=pg-vector" \
  src/infraestructure/db/postgres/init/002_financial_embeddings.sql \
  src/infraestructure/db/postgres/init/003_global_knowledge_embeddings.sql \
  src/infraestructure/db/postgres/init/004_financial_embeddings_filters.sql \
  src/infraestructure/rag/ollama-embedding.provider.ts \
  src/infraestructure/repository/rag/pg-vector-store.repository.ts

create_pr "feat/agent-infraestructure" \
  "refactor: add onboarding prompt loader and conversation repos" \
  "feat: agent infraestructure — onboarding loader and repos" \
  "## Summary
- Adiciona loader de prompt de onboarding e writer de dataset
- Estende repositórios de conversa e mensagens

## Test plan
- [ ] yarn test --testPathPattern=agent" \
  src/infraestructure/agent/fs-training-dataset.writer.ts \
  src/infraestructure/agent/ollama-llm.provider.ts \
  src/infraestructure/agent/onboarding-system-prompt.loader.ts \
  src/infraestructure/db/mongo/schema/conversation.schema.ts \
  src/infraestructure/repository/agent/adapters/conversation.adapter.ts \
  src/infraestructure/repository/agent/chat-message.repository.read.ts \
  src/infraestructure/repository/agent/chat-message.repository.write.ts \
  src/infraestructure/repository/agent/conversation.repository.read.ts

# --- CONFIGURATION ---

create_pr "feat/user-configuration" \
  "feat: add user service factory with profile dependencies" \
  "feat: user configuration — service factory" \
  "## Summary
- Atualiza factory do serviço de usuário

## Test plan
- [ ] yarn build" \
  src/configuration/factory/user.service.factory.ts

create_pr "feat/address-configuration" \
  "feat: add address service and controller factories" \
  "feat: address configuration — factories" \
  "## Summary
- Adiciona factories de endereço

## Test plan
- [ ] yarn build" \
  src/configuration/factory/address.controller.factory.ts \
  src/configuration/factory/address.service.factory.ts

create_pr "feat/onboarding-configuration" \
  "feat: add onboarding service and controller factories" \
  "feat: onboarding configuration — factories" \
  "## Summary
- Adiciona factories de onboarding

## Test plan
- [ ] yarn build" \
  src/configuration/factory/onboarding-action.service.factory.ts \
  src/configuration/factory/onboarding.controller.factory.ts \
  src/configuration/factory/onboarding.service.factory.ts

create_pr "feat/expense-search-configuration" \
  "feat: add expense search service factory" \
  "feat: expense-search configuration — service factory" \
  "## Summary
- Adiciona factory de busca de despesas

## Test plan
- [ ] yarn build" \
  src/configuration/factory/expense-search.service.factory.ts

create_pr "feat/regional-economics-configuration" \
  "feat: add regional economics service factory" \
  "feat: regional-economics configuration — service factory" \
  "## Summary
- Adiciona factory de economia regional

## Test plan
- [ ] yarn build" \
  src/configuration/factory/regional-economics.service.factory.ts

create_pr "feat/rag-configuration" \
  "feat: add embedding provider and RAG service factory updates" \
  "feat: rag configuration — embedding and service factories" \
  "## Summary
- Adiciona factory de embedding e atualiza RAG

## Test plan
- [ ] yarn build" \
  src/configuration/factory/embedding-provider.factory.ts \
  src/configuration/factory/rag.service.factory.ts

create_pr "feat/agent-configuration" \
  "refactor: update agent factories for onboarding flow" \
  "feat: agent configuration — onboarding factory updates" \
  "## Summary
- Atualiza factories do agente para onboarding

## Test plan
- [ ] yarn build" \
  src/configuration/factory/agent-action.service.factory.ts \
  src/configuration/factory/agent-knowledge.service.factory.ts \
  src/configuration/factory/agent.service.factory.ts

create_pr "feat/expense-configuration" \
  "feat: update expense service factory with search sync" \
  "feat: expense configuration — service factory" \
  "## Summary
- Atualiza factory de despesas

## Test plan
- [ ] yarn build" \
  src/configuration/factory/expense.service.factory.ts

create_pr "feat/platform-configuration" \
  "feat: add OpenSearch, onboarding routes and env constants" \
  "feat: platform configuration — bootstrap, env and docker" \
  "## Summary
- Registra controllers de endereço e onboarding
- Adiciona OpenSearch ao docker-compose e variáveis de ambiente

## Test plan
- [ ] docker compose up -d
- [ ] yarn dev" \
  .env.example \
  .env.test \
  docker-compose.yml \
  package.json \
  yarn.lock \
  README.md \
  src/app.ts \
  src/configuration/env-constants/env.constants.ts \
  scripts/reindex-expenses.ts

# --- APPLICATION ---

create_pr "feat/user-application" \
  "feat: add profile update endpoints to user controller" \
  "feat: user application — profile endpoints" \
  "## Summary
- Adiciona endpoints de perfil no UserController

## Test plan
- [ ] yarn test --testPathPattern=user/controller" \
  src/application/controllers/user.controller.ts

create_pr "feat/address-application" \
  "feat: add address lookup controller" \
  "feat: address application — AddressController" \
  "## Summary
- Adiciona controller de consulta de CEP

## Test plan
- [ ] yarn test --testPathPattern=address" \
  src/application/controllers/address.controller.ts

create_pr "feat/onboarding-application" \
  "feat: add onboarding controller" \
  "feat: onboarding application — OnboardingController" \
  "## Summary
- Adiciona controller de onboarding

## Test plan
- [ ] yarn test --testPathPattern=onboarding-flow" \
  src/application/controllers/onboarding.controller.ts

create_pr "feat/expense-application" \
  "feat: add expense search endpoint to expense controller" \
  "feat: expense application — search endpoint" \
  "## Summary
- Adiciona endpoint de busca no ExpenseController

## Test plan
- [ ] yarn test --testPathPattern=expense/controller" \
  src/application/controllers/expense.controller.ts

# --- CONTRACTS ---

create_pr "feat/platform-contracts" \
  "feat: add OpenAPI contracts for profile, address and onboarding" \
  "feat: platform contracts — profile, address and onboarding API" \
  "## Summary
- Atualiza service.yaml com novos endpoints

## Test plan
- [ ] Validar spec OpenAPI" \
  src/contracts/service.yaml

# --- TESTS ---

create_pr "feat/user-tests" \
  "feat: add user profile and verification unit and integration tests" \
  "feat: user tests — profile and verification" \
  "## Summary
- Adiciona testes de perfil, verificação e utils de usuário

## Test plan
- [ ] yarn test --testPathPattern=user" \
  src/__tests__/integration/user/controller/create-user.int.test.ts \
  src/__tests__/integration/user/controller/delete-user.int.test.ts \
  src/__tests__/integration/user/controller/get-user-by-id.int.test.ts \
  src/__tests__/integration/user/controller/get-users.int.test.ts \
  src/__tests__/integration/user/controller/update-user.int.test.ts \
  src/__tests__/integration/user/repository/read/find-user-by-document.int.test.ts \
  src/__tests__/integration/user/repository/write/update-user-by-id.int.test.ts \
  src/__tests__/integration/user/service/update-profile.int.test.ts \
  src/__tests__/unit/user/entity/user.entity.unit.test.ts \
  src/__tests__/unit/user/service/update-profile.unit.test.ts \
  src/__tests__/unit/user/service/update-user-by-id.unit.test.ts \
  src/__tests__/unit/user/utils/regional-context.utils.unit.test.ts \
  src/__tests__/unit/user/utils/user-personalization-context.utils.unit.test.ts \
  src/__tests__/unit/user/utils/user-profile-context.utils.unit.test.ts \
  src/__tests__/unit/user/utils/user-profile.utils.unit.test.ts \
  src/__tests__/unit/user/utils/user-verification-state.utils.unit.test.ts

create_pr "feat/address-tests" \
  "feat: add address service and ViaCEP unit tests" \
  "feat: address tests — service and provider" \
  "## Summary
- Adiciona testes unitários de endereço

## Test plan
- [ ] yarn test --testPathPattern=address" \
  src/__tests__/unit/address/external/via-cep.provider.unit.test.ts \
  src/__tests__/unit/address/service/address.service.unit.test.ts

create_pr "feat/onboarding-tests" \
  "feat: add onboarding flow integration test" \
  "feat: onboarding tests — flow integration" \
  "## Summary
- Adiciona teste de integração do fluxo de onboarding

## Test plan
- [ ] yarn test --testPathPattern=onboarding-flow" \
  src/__tests__/integration/user/controller/onboarding-flow.int.test.ts

create_pr "feat/expense-search-tests" \
  "feat: add expense search unit tests" \
  "feat: expense-search tests — service and RRF" \
  "## Summary
- Adiciona testes de busca híbrida

## Test plan
- [ ] yarn test --testPathPattern=expense-search" \
  src/__tests__/unit/expense-search/service/expense-search.service.unit.test.ts \
  src/__tests__/unit/expense-search/utils/reciprocal-rank-fusion.unit.test.ts

create_pr "feat/regional-economics-tests" \
  "feat: add regional economics service unit tests" \
  "feat: regional-economics tests — service unit" \
  "## Summary
- Adiciona testes do serviço de economia regional

## Test plan
- [ ] yarn test --testPathPattern=regional-economics" \
  src/__tests__/unit/regional-economics/service/regional-economics.service.unit.test.ts

create_pr "feat/rag-tests" \
  "feat: add RAG sync and vector search unit tests" \
  "feat: rag tests — sync expense and vector search" \
  "## Summary
- Adiciona testes de sync e busca vetorial

## Test plan
- [ ] yarn test --testPathPattern=rag" \
  src/__tests__/unit/rag/repository/pg-vector-store-search.unit.test.ts \
  src/__tests__/unit/rag/service/sync-expense.unit.test.ts \
  src/__tests__/unit/rag/utils/expense-rag-content.unit.test.ts

create_pr "feat/agent-tests" \
  "feat: add agent onboarding and conversation unit tests" \
  "feat: agent tests — onboarding and conversation" \
  "## Summary
- Atualiza e adiciona testes do agente

## Test plan
- [ ] yarn test --testPathPattern=agent" \
  src/__tests__/unit/agent/agent-system-prompt.loader.unit.test.ts \
  src/__tests__/unit/agent/onboarding-system-prompt.loader.unit.test.ts \
  src/__tests__/unit/agent/service/agent-action.unit.test.ts \
  src/__tests__/unit/agent/service/agent-chat.unit.test.ts \
  src/__tests__/unit/agent/service/agent-training-export.unit.test.ts \
  src/__tests__/unit/agent/service/conversation.service.unit.test.ts \
  src/__tests__/unit/agent/utils/agent-response-guard.unit.test.ts

create_pr "feat/platform-tests" \
  "refactor: update test helpers and config for new features" \
  "feat: platform tests — helpers and config updates" \
  "## Summary
- Atualiza configApp, testUtils e mocks compartilhados

## Test plan
- [ ] yarn test" \
  src/__tests__/configApp.ts \
  src/__tests__/testUtils.ts \
  src/__tests__/integration/helpers/auth.helper.ts \
  src/__tests__/unit/helpers/service-mocks.helper.ts \
  src/__tests__/unit/common/utils/reference-month.unit.test.ts

create_pr "feat/auth-tests" \
  "refactor: update auth tests for profile flow" \
  "feat: auth tests — register and login updates" \
  "## Summary
- Atualiza testes de auth para novo fluxo

## Test plan
- [ ] yarn test --testPathPattern=auth" \
  src/__tests__/integration/auth/controller/login-user.int.test.ts \
  src/__tests__/integration/auth/controller/register-user.int.test.ts \
  src/__tests__/integration/auth/service/register-user.int.test.ts \
  src/__tests__/unit/auth/service/register-user.unit.test.ts

create_pr "feat/expense-tests" \
  "refactor: update expense integration tests" \
  "feat: expense tests — delete and pay updates" \
  "## Summary
- Atualiza testes de integração de despesas

## Test plan
- [ ] yarn test --testPathPattern=expense" \
  src/__tests__/integration/expense/controller/delete-expense.int.test.ts \
  src/__tests__/integration/expense/service/delete-expense-by-id.int.test.ts \
  src/__tests__/integration/expense/service/pay-expense-by-id.int.test.ts

create_pr "feat/dashboard-tests" \
  "refactor: update dashboard tests for profile context" \
  "feat: dashboard tests — summary updates" \
  "## Summary
- Atualiza testes do dashboard

## Test plan
- [ ] yarn test --testPathPattern=dashboard" \
  src/__tests__/integration/dashboard/controller/get-dashboard.int.test.ts \
  src/__tests__/integration/dashboard/service/get-dashboard-summary.int.test.ts \
  src/__tests__/unit/dashboard/service/get-dashboard-summary.unit.test.ts

git checkout main -q
echo "Done! All branches and PRs created."
