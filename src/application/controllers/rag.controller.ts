import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { RagService } from '../../domain/rag/service/rag.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class RagController implements IController {
  router: Router;
  private readonly ragService: RagService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(ragService: RagService, authenticateMiddleware: RequestHandler) {
    this.ragService = ragService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/rag/ask', this.authenticateMiddleware, this.askQuestion);
  }

  askQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await this.ragService.askFinancialQuestion(
        req.userId!,
        req.body.question,
      );
      res.status(200).json(response);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
