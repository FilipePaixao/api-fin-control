/// <reference path="./types/express.d.ts" />
import './configuration/dotenv';
import path from 'path';
import { Server } from './domain/server/server';
import { validateEnv } from './configuration/env-constants/validate-env';
import {
  PORT,
  DATABASE_URI,
  OLLAMA_TIMEOUT_MS,
} from './configuration/env-constants/env.constants';
import { postgresSetup } from './infraestructure/db/postgres/postgres.setup';

import { UserControllerFactory } from './configuration/factory/user.controller.factory';
import { AuthControllerFactory } from './configuration/factory/auth.controller.factory';
import { ExpenseControllerFactory } from './configuration/factory/expense.controller.factory';
import { IncomeControllerFactory } from './configuration/factory/income.controller.factory';
import { DashboardControllerFactory } from './configuration/factory/dashboard.controller.factory';
import { RagControllerFactory } from './configuration/factory/rag.controller.factory';
import { AgentControllerFactory } from './configuration/factory/agent.controller.factory';
import { AddressControllerFactory } from './configuration/factory/address.controller.factory';
import { OnboardingControllerFactory } from './configuration/factory/onboarding.controller.factory';
import { StatementImportControllerFactory } from './configuration/factory/statement-import.controller.factory';
import { CreditCardControllerFactory } from './configuration/factory/credit-card.controller.factory';

validateEnv();

const OPEN_API_SPEC_FILE_LOCATION = path.resolve(
  __dirname,
  './contracts/service.yaml',
);

/** Agent pode fazer até 5 iterações de LLM; HTTP precisa sobreviver ao pior caso. */
const HTTP_TIMEOUT_MS = Math.max(OLLAMA_TIMEOUT_MS * 5, 180_000);

const app = new Server({
  port: PORT,
  controllers: [
    UserControllerFactory.create(),
    AuthControllerFactory.create(),
    ExpenseControllerFactory.create(),
    IncomeControllerFactory.create(),
    CreditCardControllerFactory.create(),
    DashboardControllerFactory.create(),
    RagControllerFactory.create(),
    AgentControllerFactory.create(),
    AddressControllerFactory.create(),
    OnboardingControllerFactory.create(),
    StatementImportControllerFactory.create(),
  ],
  databaseURI: DATABASE_URI,
  apiSpecLocation: OPEN_API_SPEC_FILE_LOCATION,
  pathRoute: '/api',
  timeoutMilliseconds: HTTP_TIMEOUT_MS,
});

async function start() {
  await app.databaseSetup();
  await postgresSetup();
  app.listen();
}

start();
