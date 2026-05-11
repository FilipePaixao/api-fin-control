# `AGENTS.md` – Padrões e arquitetura do st-node-boilerplate

Este guia descreve a **arquitetura real** do repositório: estrutura de pastas, convenções de nome, responsabilidades por camada e stubs de referência para contribuições consistentes.

---

## 1 Estrutura de pastas (como está no projeto)

| Camada | Caminho | Conteúdo / Exemplos |
|--------|---------|---------------------|
| **Domain** | `src/domain` | Lógica de negócio: entities, interfaces, contratos de repositório e serviço |
| └─ Por contexto | `src/domain/<contexto>/` | Ex.: `user` |
| └─ Entity | `src/domain/<contexto>/entity/` | `interfaces/*.interface.ts`, `<contexto>.entity.ts` |
| └─ Repository (contratos) | `src/domain/<contexto>/repository/` | `*.repository.read.ts`, `*.repository.write.ts` |
| └─ Service | `src/domain/<contexto>/service/` | `*.service.ts` |
| └─ Messaging (contratos) | `src/domain/<contexto>/messaging/<evento>/` | Ex.: `user-approved/producer.interface.kafka.ts` |
| └─ Common / Server | `src/domain/server/` | `server.ts`, `interfaces/IController.ts` |
| **Application** | `src/application` | Controllers |
| └─ Controllers | `src/application/controllers/` | `user.controller.ts` |
| **Infraestructure** | `src/infraestructure` | DB, repositórios (implementações), adapters, serviços externos, messaging |
| └─ DB Mongo | `src/infraestructure/db/mongo/` | `schema/*.schema.ts`, `models/*.model.ts`, `interfaces/*.interface.ts` |
| └─ Repository (impl.) | `src/infraestructure/repository/<contexto>/` | `*.repository.read.ts`, `*.repository.write.ts` |
| └─ Adapters | `src/infraestructure/repository/<contexto>/adapters/` | `*.adapter.ts` (`dbToInternal`, `internalToDb`) |
| └─ External services | `src/infraestructure/external/services/<serviço>/` | `*-external.service.ts` |
| └─ Messaging (impl.) | `src/infraestructure/messaging/<evento>/` | `consumer.kafka.ts`, `producer.kafka.ts` |
| **Configuration** | `src/configuration` | Env, constantes e **factories** (injeção de dependência) |
| └─ Factory | `src/configuration/factory/` | `*.controller.factory.ts`, `*.service.factory.ts` |
| └─ Factory messaging | `src/configuration/factory/messaging/` | `consumer.worker.factory.ts` |
| └─ Env | `src/configuration/env-constants/`, `dotenv.ts` | Constantes de ambiente |
| **Contracts** | `src/contracts` | OpenAPI/Swagger (ex.: `service.yaml`) |
| **Tests** | `src/__tests__` | Testes dentro de `src` |
| └─ Integration | `src/__tests__/integration/` | `controller/`, `service/`, `repository/`, `user/` |
| └─ Unit | `src/__tests__/unit/` | Testes unitários |
| └─ Mocks | `src/__tests__/__mocks__/` | Mocks compartilhados |

Notas importantes:

* O projeto usa **`infraestructure`** (com "e") e **`configuration`** (singular). Manter exatamente assim.
* Contratos de repositório (`I*RepositoryRead`, `I*RepositoryWrite`) ficam no **domain**; implementações concretas ficam na **infraestructure**.
* Interfaces de producers Kafka ficam no **domain** (`producer.interface.kafka.ts`); implementações ficam na **infraestructure**.

---

## 2 Convenções de nome

### 2.1 Interfaces e enums

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Interface de domínio | `I` | `IUser`, `IUserService` |
| Interface de modelo Mongo | `IM` | `IMUser` |
| Enum | `E` | `EStatus` |

Outras regras:

* Classes e funções: PascalCase / camelCase (sem prefixo).
* Variáveis e propriedades: `camelCase`.
* Constantes: `UPPER_SNAKE_CASE` ou objetos nomeados.

### 2.2 Padrão IM (persistência)

As interfaces de modelo Mongo estendem as de domínio, com campos específicos de persistência (`_id: ObjectId`, `createdAt`, `updatedAt`):

```ts
import { IUser } from "../../../../domain/user/entity/interfaces/user.interface";
import { Types } from "mongoose";

export interface IMUser extends IUser {
  _id: Types.ObjectId;
  updatedAt: Date;
}
```

Usar `IM*` em:

* `mongoose.Schema<IMUser>` e `model<IMUser>("User", UserSchema)`.

### 2.3 Repositório: Read vs Write

No **domain**, os contratos são separados em:

* `src/domain/<contexto>/repository/<contexto>.repository.read.ts` → `I*RepositoryRead`
* `src/domain/<contexto>/repository/<contexto>.repository.write.ts` → `I*RepositoryWrite`

Implementações em `src/infraestructure/repository/<contexto>/`.

### 2.4 Entity e Adapters

* **Entity**: classe no domain que implementa a interface de domínio e concentra validações no construtor (ex.: `UserServiceEntity`). Fica em `src/domain/<contexto>/entity/<contexto>.entity.ts`.
* **Adapters**: funções puras na infraestructure que convertem entre modelo de persistência (`IM*`) e domínio (`I*`). Ex.: `dbToInternal(IMUser): IUser` e `internalToDb(IUser)` em `src/infraestructure/repository/<contexto>/adapters/<contexto>.adapter.ts`.

---

## 3 Stubs de referência

### 3.1 Domain – Entity (interface + classe)

`src/domain/user/entity/interfaces/user.interface.ts`

```ts
export interface IUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

`src/domain/user/entity/user.entity.ts`

```ts
import { IUser } from './interfaces/user.interface';
import { Types } from 'mongoose';

export class UserServiceEntity implements IUser {
  constructor(user: IUser) {
    this.validateUser(user);
    this.id = user.id || new Types.ObjectId().toHexString();
    // ... atribuições
  }
  private validateUser(user: IUser): void {
    // regras de negócio
  }
}
```

### 3.2 Domain – Contratos de repositório

`src/domain/user/repository/user.repository.read.ts`

```ts
import { IUser } from '../entity/interfaces/user.interface';

export interface IUserRepositoryRead {
  findById(id: string): Promise<IUser | null>;
  findUserByEmail(email: string): Promise<IUser | null>;
  listUsers(filter: Partial<IUser>): Promise<IUser[]>;
}
```

`src/domain/user/repository/user.repository.write.ts`

```ts
import { IUser } from '../entity/interfaces/user.interface';

export interface IUserRepositoryWrite {
  createUser(user: IUser): Promise<IUser>;
  updateUserById(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
  deleteUserById(id: string): Promise<IUser | null>;
}
```

### 3.3 Infraestructure – Mongo (schema, interface e model)

`src/infraestructure/db/mongo/interfaces/user.interface.ts`

```ts
import { Types } from 'mongoose';
import { IUser } from '../../../../domain/user/entity/interfaces/user.interface';

export interface IMUser extends IUser {
  _id: Types.ObjectId;
  updatedAt: Date;
}
```

`src/infraestructure/db/mongo/schema/user.schema.ts`

```ts
import { Schema } from "mongoose";
import { IMUser } from "../interfaces/user.interface";

export const UserSchema = new Schema<IMUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
}, { timestamps: true });
```

`src/infraestructure/db/mongo/models/user.model.ts`

```ts
import { model } from "mongoose";
import { IMUser } from "../interfaces/user.interface";
import { UserSchema } from "../schema/user.schema";

export const UserModel = model<IMUser>("User", UserSchema);
```

### 3.4 Infraestructure – Adapter (DB ↔ Domain)

`src/infraestructure/repository/user/adapters/user.adapter.ts`

```ts
import { IUser } from '../../../../domain/user/entity/interfaces/user.interface';
import { IMUser } from '../../../db/mongo/interfaces/user.interface';

export function dbToInternal(user: IMUser): IUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function internalToDb(user: IUser): Omit<IMUser, '_id' | 'createdAt' | 'updatedAt'> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
```

### 3.5 Infraestructure – Implementação do repositório

`src/infraestructure/repository/user/user.repository.read.ts`

```ts
import { IUserRepositoryRead } from '../../../domain/user/repository/user.repository.read';
import { UserModel } from '../../db/mongo/models/user.model';
import { dbToInternal } from './adapters/user.adapter';

export class UserRepositoryRead implements IUserRepositoryRead {
  async findUserById(id: string): Promise<IUser | null> {
    const doc = await UserModel.findOne({ id });
    return doc ? dbToInternal(doc) : null;
  }
  // ...
}
```

### 3.6 Configuration – Factory

`src/configuration/factory/user.controller.factory.ts`

```ts
import { UserController } from '../../application/controllers/user.controller';
import { IController } from '../../domain/server/interfaces/IController';
import { UserServiceFactory } from './user.service.factory';

export class UserControllerFactory {
  static create(): IController {
    return new UserController(UserServiceFactory.create());
  }
}
```

### 3.7 Application – Bootstrap (`src/app.ts`)

```ts
import './configuration/dotenv';
import path from 'path';
import { Server } from './domain/server/server';
import { UserControllerFactory } from './configuration/factory/user.controller.factory';

const OPEN_API_SPEC_FILE_LOCATION = path.resolve(__dirname, './contracts/service.yaml');

const app = new Server({
  port: Number(process.env.PORT) || 3000,
  apiSpecLocation: OPEN_API_SPEC_FILE_LOCATION,
  controllers: [UserControllerFactory.create()],
  databaseURI: process.env.DATABASE_URI,
});

async function start() {
  await app.databaseSetup();
  app.listen();
}

start().catch((err) => {
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
```

Ordem: **database → HTTP server**.

---

## 4 Testes e lint

| Ferramenta | Uso | Comando (yarn) |
|------------|-----|----------------|
| Jest | Unit + integration | `yarn test` |
| Coverage | ≥ 80% linhas/ramos | `yarn test:coverage` |
| ESLint | Lint | `yarn lint` / `yarn lint:fix` |
| Prettier | Formatação | `yarn prettier` |

Testes ficam em **`src/__tests__`**:

* `src/__tests__/integration/user/repository/`, `controller/`
* `src/__tests__/unit/user/service/`
* `src/__tests__/__mocks__/` para mocks compartilhados.

---

## 5 Checklist de contribuição

Ao gerar ou editar código:

1. **Naming e arquivos**
   * Usar `I*` no domain, `IM*` nos modelos Mongo, `E*` para enums.
   * Entities: `src/domain/<contexto>/entity/` (interfaces em `entity/interfaces/`, classe em `<contexto>.entity.ts`).
   * Contratos de repositório: `src/domain/<contexto>/repository/*.repository.read.ts` e `*.repository.write.ts`.
   * Implementações e **adapters**: `src/infraestructure/repository/<contexto>/` e `.../adapters/`.
   * Schemas e models Mongo: `src/infraestructure/db/mongo/schema/` e `models/`.
   * Manter **`infraestructure`** e **`configuration`** como no projeto.

2. **Arquitetura**
   * Controllers finos: extrair dados do `req` e delegar aos services.
   * Injetar dependências via factories em `src/configuration/factory/`.
   * Services usam entity classes para validar; repositórios usam adapters para DB ↔ domínio.

3. **Qualidade**
   * Manter/criar testes em `src/__tests__/` e cobertura ≥ 80%.
   * Passar ESLint e Prettier.

4. **Documentação**
   * Atualizar `src/contracts/service.yaml` quando endpoints mudarem.

---

## 6 Messaging (Kafka) – Checklist

Ao adicionar producer/consumer:

1. **Interface no domain**: definir em `src/domain/<contexto>/messaging/<evento>/producer.interface.kafka.ts`.
2. **Implementação na infraestructure**: `src/infraestructure/messaging/<evento>/producer.kafka.ts`.
3. **Service**: injetar a interface do producer e chamar após operações de repositório bem-sucedidas.
4. **Factory**: registrar producer na factory correspondente.

---

## 7 Responsabilidades por camada

### 7.1 Controller

* Extrair dados do `req` e delegar aos services.
* Não conter lógica de negócio.
* Validação básica e mapeamento de erros.

### 7.2 Service

* Centro das regras de negócio e validações.
* Usar **entity** (ex.: `UserServiceEntity`) para construir e validar objetos.
* Garantir idempotência quando aplicável.

### 7.3 Repository

* Camada fina de CRUD; usar **adapters** para converter `IM*` ↔ `I*`.
* Não conter lógica de negócio.

### 7.4 Rotas

* Padrão: `/authorizers/{recurso}/{ação}` ou convencionado no `service.yaml`.
* Recursos em **kebab-case**.
