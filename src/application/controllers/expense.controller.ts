import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { EExpenseCategory } from '../../domain/expense/entity/enums/EExpenseCategory';
import { EExpenseStatus } from '../../domain/expense/entity/enums/EExpenseStatus';
import { EPaymentMethod } from '../../domain/expense/entity/enums/EPaymentMethod';
import { ExpenseService } from '../../domain/expense/service/expense.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class ExpenseController implements IController {
  router: Router;
  private readonly expenseService: ExpenseService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(expenseService: ExpenseService, authenticateMiddleware: RequestHandler) {
    this.expenseService = expenseService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/expenses', this.authenticateMiddleware, this.createExpense);
    this.router.get('/expenses', this.authenticateMiddleware, this.getExpenses);
    this.router.get('/expenses/:id', this.authenticateMiddleware, this.getExpenseById);
    this.router.put('/expenses/:id', this.authenticateMiddleware, this.updateExpense);
    this.router.delete('/expenses/:id', this.authenticateMiddleware, this.deleteExpense);
    this.router.patch(
      '/expenses/:id/pay',
      this.authenticateMiddleware,
      this.payExpense,
    );
  }

  createExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      const createdExpense = await this.expenseService.createExpense(req.userId!, {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });
      res.status(201).json(createdExpense);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
      const expenses = await this.expenseService.listExpenses(req.userId!, {
        category: req.query.category as EExpenseCategory | undefined,
        status: req.query.status as EExpenseStatus | undefined,
        referenceMonth: req.query.referenceMonth as string | undefined,
        from: req.query.from ? new Date(String(req.query.from)) : undefined,
        to: req.query.to ? new Date(String(req.query.to)) : undefined,
      });
      res.status(200).json(expenses);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getExpenseById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const expense = await this.expenseService.getExpenseById(req.userId!, req.params.id);
      res.status(200).json(expense);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  updateExpense = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const updatedExpense = await this.expenseService.updateExpenseById(
        req.userId!,
        req.params.id,
        {
          ...req.body,
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        },
      );
      res.status(200).json(updatedExpense);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  deleteExpense = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      await this.expenseService.deleteExpenseById(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  payExpense = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const paidExpense = await this.expenseService.payExpenseById(
        req.userId!,
        req.params.id,
        {
          paidAt: req.body.paidAt ? new Date(req.body.paidAt) : undefined,
          paymentMethod: req.body.paymentMethod as EPaymentMethod | undefined,
        },
      );
      res.status(200).json(paidExpense);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
