import path from 'path';
import { Server } from '../domain/server/server';
import { AddressControllerFactory } from '../configuration/factory/address.controller.factory';
import { AgentControllerFactory } from '../configuration/factory/agent.controller.factory';
import { AuthControllerFactory } from '../configuration/factory/auth.controller.factory';
import { DashboardControllerFactory } from '../configuration/factory/dashboard.controller.factory';
import { ExpenseControllerFactory } from '../configuration/factory/expense.controller.factory';
import { OnboardingControllerFactory } from '../configuration/factory/onboarding.controller.factory';
import { RagControllerFactory } from '../configuration/factory/rag.controller.factory';
import { UserControllerFactory } from '../configuration/factory/user.controller.factory';

const OPEN_API_SPEC_FILE_LOCATION = path.resolve(
  __dirname,
  '../contracts/service.yaml',
);

export const app = new Server({
  port: Number(process.env.PORT) || 3000,
  controllers: [
    UserControllerFactory.create(),
    AuthControllerFactory.create(),
    ExpenseControllerFactory.create(),
    DashboardControllerFactory.create(),
    RagControllerFactory.create(),
    AgentControllerFactory.create(),
    AddressControllerFactory.create(),
    OnboardingControllerFactory.create(),
  ],
  databaseURI: process.env.DATABASE_URI,
  apiSpecLocation: OPEN_API_SPEC_FILE_LOCATION,
  pathRoute: '/api',
});
