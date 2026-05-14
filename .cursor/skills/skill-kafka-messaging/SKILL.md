---
name: skill-boilerplate-kafka-messaging
description: >-
  Checklist para adicionar producer/consumer Kafka no st-node-boilerplate: contrato no domain,
  implementação na infraestructure, injeção na factory e chamada no service após persistência.
  Use quando o utilizador pedir evento Kafka, mensagem assíncrona ou integração com messaging.
disable-model-invocation: true
---

# Skill: Kafka (messaging) no st-node-boilerplate

Segue a secção **Messaging (Kafka)** de [AGENTS.md](../../../AGENTS.md).

## Passos

1. **Domain** — `src/domain/<contexto>/messaging/<evento>/`
   - Interface do producer, ex.: `producer.interface.kafka.ts` (`I*` adequado ao evento)

2. **Infraestructure** — `src/infraestructure/messaging/<evento>/`
   - `producer.kafka.ts` e/ou `consumer.kafka.ts` implementando o contrato

3. **Service** — injetar a interface do producer; chamar **após** operação de repositório bem-sucedida (quando fizer sentido ao negócio)

4. **Configuration** — registar producer (e consumer/worker se existir) na factory correspondente, ex. `src/configuration/factory/messaging/`

5. **Testes** — mocks da interface do producer nos testes de service quando aplicável

## Regras

- Contrato **sempre** no domain; implementação **sempre** na infraestructure.
- Não importar Kafka concreto no domain.
