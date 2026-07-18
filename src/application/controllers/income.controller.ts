import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { EIncomeCategory } from '../../domain/income/entity/enums/EIncomeCategory';
import { EIncomeStatus } from '../../domain/income/entity/enums/EIncomeStatus';
import { IncomeService } from '../../domain/income/service/income.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class IncomeController implements IController {
  router: Router;
  private readonly incomeService: IncomeService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(incomeService: IncomeService, authenticateMiddleware: RequestHandler) {
    this.incomeService = incomeService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/incomes', this.authenticateMiddleware, this.createIncome);
    this.router.get('/incomes', this.authenticateMiddleware, this.getIncomes);
    this.router.get('/incomes/:id', this.authenticateMiddleware, this.getIncomeById);
    this.router.put('/incomes/:id', this.authenticateMiddleware, this.updateIncome);
    this.router.delete('/incomes/:id', this.authenticateMiddleware, this.deleteIncome);
    this.router.patch(
      '/incomes/:id/receive',
      this.authenticateMiddleware,
      this.receiveIncome,
    );
  }

  createIncome = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdIncome = await this.incomeService.createIncome(req.userId!, {
        ...req.body,
        receivedAt: req.body.receivedAt ? new Date(req.body.receivedAt) : undefined,
      });
      res.status(201).json(createdIncome);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getIncomes = async (req: Request, res: Response): Promise<void> => {
    try {
      const incomes = await this.incomeService.listIncomes(req.userId!, {
        category: req.query.category as EIncomeCategory | undefined,
        status: req.query.status as EIncomeStatus | undefined,
        referenceMonth: req.query.referenceMonth as string | undefined,
      });
      res.status(200).json(incomes);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getIncomeById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const income = await this.incomeService.getIncomeById(req.userId!, req.params.id);
      res.status(200).json(income);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  updateIncome = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const updatedIncome = await this.incomeService.updateIncomeById(
        req.userId!,
        req.params.id,
        {
          ...req.body,
          receivedAt: req.body.receivedAt ? new Date(req.body.receivedAt) : undefined,
        },
      );
      res.status(200).json(updatedIncome);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  deleteIncome = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      await this.incomeService.deleteIncomeById(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  receiveIncome = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const receivedIncome = await this.incomeService.receiveIncomeById(
        req.userId!,
        req.params.id,
        {
          receivedAt: req.body.receivedAt ? new Date(req.body.receivedAt) : undefined,
        },
      );
      res.status(200).json(receivedIncome);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
