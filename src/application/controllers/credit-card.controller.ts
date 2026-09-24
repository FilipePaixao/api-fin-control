import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { CreditCardService } from '../../domain/credit-card/service/credit-card.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class CreditCardController implements IController {
  router: Router;
  private readonly creditCardService: CreditCardService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    creditCardService: CreditCardService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.creditCardService = creditCardService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/credit-cards', this.authenticateMiddleware, this.create);
    this.router.get('/credit-cards', this.authenticateMiddleware, this.list);
    this.router.get('/credit-cards/:id', this.authenticateMiddleware, this.getById);
    this.router.put('/credit-cards/:id', this.authenticateMiddleware, this.update);
    this.router.delete('/credit-cards/:id', this.authenticateMiddleware, this.remove);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const card = await this.creditCardService.create(req.userId!, {
        name: req.body.name,
        lastFourDigits: req.body.lastFourDigits,
      });
      res.status(201).json(card);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const cards = await this.creditCardService.list(req.userId!);
      res.status(200).json(cards);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const card = await this.creditCardService.getById(req.userId!, req.params.id);
      res.status(200).json(card);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const card = await this.creditCardService.update(req.userId!, req.params.id, {
        name: req.body.name,
        lastFourDigits: req.body.lastFourDigits,
      });
      res.status(200).json(card);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  remove = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      await this.creditCardService.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getRoutes(): Router {
    return this.router;
  }
}
