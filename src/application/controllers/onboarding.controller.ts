import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { OnboardingActionService } from '../../domain/onboarding/service/onboarding-action.service';
import { IOnboardingService } from '../../domain/onboarding/interfaces/onboarding.service.interface';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class OnboardingController implements IController {
  router: Router;
  private readonly onboardingService: IOnboardingService;
  private readonly onboardingActionService: OnboardingActionService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    onboardingService: IOnboardingService,
    onboardingActionService: OnboardingActionService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.onboardingService = onboardingService;
    this.onboardingActionService = onboardingActionService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      '/agent/onboarding/chat',
      this.authenticateMiddleware,
      this.chat,
    );
    this.router.post(
      '/agent/onboarding/actions/execute',
      this.authenticateMiddleware,
      this.executeAction,
    );
  }

  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await this.onboardingService.chat(req.userId!, {
        message: String(req.body.message ?? ''),
      });
      res.status(200).json(response);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  executeAction = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.onboardingActionService.executeAction(
        req.userId!,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
