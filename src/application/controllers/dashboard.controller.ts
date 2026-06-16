import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { DashboardService } from '../../domain/dashboard/service/dashboard.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class DashboardController implements IController {
  router: Router;
  private readonly dashboardService: DashboardService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    dashboardService: DashboardService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.dashboardService = dashboardService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/dashboard', this.authenticateMiddleware, this.getDashboard);
  }

  getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const dashboardSummary = await this.dashboardService.getDashboardSummary(
        req.userId!,
        req.query.referenceMonth as string | undefined,
      );
      res.status(200).json(dashboardSummary);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
