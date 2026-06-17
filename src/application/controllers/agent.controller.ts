import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import {
  IAgentActionService,
  IAgentService,
} from '../../domain/agent/interfaces/agent.service.interface';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class AgentController implements IController {
  router: Router;
  private readonly agentService: IAgentService;
  private readonly agentActionService: IAgentActionService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    agentService: IAgentService,
    agentActionService: IAgentActionService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.agentService = agentService;
    this.agentActionService = agentActionService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/agent/chat', this.authenticateMiddleware, this.chat);
    this.router.post(
      '/agent/actions/execute',
      this.authenticateMiddleware,
      this.executeAction,
    );
  }

  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await this.agentService.chat(req.userId!, {
        messages: req.body.messages ?? [],
      });
      res.status(200).json(response);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  executeAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.agentActionService.executeAction(req.userId!, req.body);
      res.status(200).json(result);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
