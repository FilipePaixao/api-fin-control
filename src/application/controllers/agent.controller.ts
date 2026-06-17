import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import {
  IAgentActionService,
  IAgentService,
} from '../../domain/agent/interfaces/agent.service.interface';
import { IConversationService } from '../../domain/agent/interfaces/conversation.service.interface';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class AgentController implements IController {
  router: Router;
  private readonly agentService: IAgentService;
  private readonly agentActionService: IAgentActionService;
  private readonly conversationService: IConversationService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    agentService: IAgentService,
    agentActionService: IAgentActionService,
    conversationService: IConversationService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.agentService = agentService;
    this.agentActionService = agentActionService;
    this.conversationService = conversationService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/agent/conversations',
      this.authenticateMiddleware,
      this.listConversations,
    );
    this.router.post(
      '/agent/conversations',
      this.authenticateMiddleware,
      this.createConversation,
    );
    this.router.get(
      '/agent/conversations/:id',
      this.authenticateMiddleware,
      this.getConversationById,
    );
    this.router.patch(
      '/agent/conversations/:id',
      this.authenticateMiddleware,
      this.renameConversation,
    );
    this.router.delete(
      '/agent/conversations/:id',
      this.authenticateMiddleware,
      this.deleteConversation,
    );
    this.router.post('/agent/chat', this.authenticateMiddleware, this.chat);
    this.router.post(
      '/agent/actions/execute',
      this.authenticateMiddleware,
      this.executeAction,
    );
  }

  listConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const conversations = await this.conversationService.listConversations(req.userId!);
      res.status(200).json(conversations);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  createConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const conversation = await this.conversationService.createConversation(req.userId!, {
        title: typeof req.body.title === 'string' ? req.body.title : undefined,
      });
      res.status(201).json(conversation);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getConversationById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const conversation = await this.conversationService.getConversationWithMessages(
        req.userId!,
        req.params.id,
      );
      res.status(200).json(conversation);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  renameConversation = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const conversation = await this.conversationService.renameConversation(
        req.userId!,
        req.params.id,
        String(req.body.title ?? ''),
      );
      res.status(200).json(conversation);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  deleteConversation = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      await this.conversationService.deleteConversation(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await this.agentService.chat(req.userId!, {
        conversationId:
          typeof req.body.conversationId === 'string'
            ? req.body.conversationId
            : undefined,
        message: String(req.body.message ?? ''),
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
