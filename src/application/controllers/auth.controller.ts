import { Request, Response, Router, RequestHandler } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { AuthService } from '../../domain/auth/service/auth.service';
import { UserService } from '../../domain/user/service/user.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class AuthController implements IController {
  router: Router;
  private readonly authService: AuthService;
  private readonly userService: UserService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    authService: AuthService,
    userService: UserService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.authService = authService;
    this.userService = userService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post('/auth/register', this.registerUser);
    this.router.post('/auth/login', this.loginUser);
    this.router.post('/auth/refresh', this.refreshSession);
    this.router.post('/auth/logout', this.logoutUser);
    this.router.get('/me', this.authenticateMiddleware, this.getAuthenticatedProfile);
  }

  registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const registeredUser = await this.authService.registerUser(req.body);
      res.status(201).json(registeredUser);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const authTokens = await this.authService.loginUser(req.body);
      res.status(200).json(authTokens);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  refreshSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const authTokens = await this.authService.refreshSession(req.body);
      res.status(200).json(authTokens);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  logoutUser = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.authService.logout(req.body);
      res.status(204).send();
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getAuthenticatedProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userProfile = await this.userService.getAuthenticatedProfile(req.userId!);
      res.status(200).json(userProfile);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
