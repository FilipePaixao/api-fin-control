import './configuration/dotenv';
import path from 'path';
import { Server } from './domain/server/server';
import { validateEnv } from './configuration/env-constants/validate-env';
import { PORT, DATABASE_URI } from './configuration/env-constants/env.constants';

import { UserControllerFactory } from './configuration/factory/user.controller.factory';
import { AuthControllerFactory } from './configuration/factory/auth.controller.factory';
import { ExpenseControllerFactory } from './configuration/factory/expense.controller.factory';
import { DashboardControllerFactory } from './configuration/factory/dashboard.controller.factory';
import { RagControllerFactory } from './configuration/factory/rag.controller.factory';

validateEnv();

const OPEN_API_SPEC_FILE_LOCATION = path.resolve(
  __dirname,
  './contracts/service.yaml',
);

const app = new Server({
  port: PORT,
  controllers: [
    UserControllerFactory.create(),
    AuthControllerFactory.create(),
    ExpenseControllerFactory.create(),
    DashboardControllerFactory.create(),
    RagControllerFactory.create(),
  ],
  databaseURI: DATABASE_URI,
  apiSpecLocation: OPEN_API_SPEC_FILE_LOCATION,
  pathRoute: '/api',
});

async function start() {
  app.databaseSetup();
  app.listen();
}

start();
