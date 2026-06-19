import { Request, Response, Router, RequestHandler } from 'express';
import { EUserGroup, authorizeByGroup, handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { UserService } from '../../domain/user/service/user.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';
import { ECurrency } from '../../domain/user/entity/enums/ECurrency';

export class UserController implements IController {
  router: Router;
  private readonly userService: UserService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(userService: UserService, authenticateMiddleware: RequestHandler) {
    this.userService = userService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/users',
      authorizeByGroup([EUserGroup.BACKOFFICE, EUserGroup.ADMIN]),
      this.getUsers,
    );
    this.router.get('/users/:id', this.getUserById);
    this.router.post('/users', this.createUser);
    this.router.put('/users/:id', this.updateUser);
    this.router.delete('/users/:id', this.deleteUser);
    this.router.put(
      '/users/me/salary',
      this.authenticateMiddleware,
      this.updateSalary,
    );
    this.router.put(
      '/users/me/profile/address',
      this.authenticateMiddleware,
      this.updateProfileAddress,
    );
    this.router.get(
      '/users/me/onboarding',
      this.authenticateMiddleware,
      this.getOnboardingStatus,
    );
  }

  /**
   * Fetch all users
   */
  getUsers = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const users = await this.userService.listUsers();
      res.status(200).json(users);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  /**
   * Fetch a user by ID
   */
  getUserById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const user = await this.userService.getUserById(id);
      res.status(200).json(user);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  /**
   * Create a new user
   */
  createUser = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const { id, name, email, createdAt } = req.body;
    try {
      const newUser = await this.userService.createUser({
        id,
        name,
        email,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      });
      res.status(201).json(newUser);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  /**
   * Update a user's information by ID
   */
  updateUser = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const updatedUser = await this.userService.updateUserById(id, {
        userData: updateData,
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  /**
   * Delete a user by ID
   */
  deleteUser = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      await this.userService.deleteUserById(id);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  updateSalary = async (req: Request, res: Response): Promise<void> => {
    try {
      const salary = await this.userService.updateSalary(req.userId!, {
        amount: req.body.amount,
        currency: req.body.currency as ECurrency,
        paymentDay: req.body.paymentDay,
        source: req.body.source,
      });
      res.status(200).json(salary);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  updateProfileAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const address = await this.userService.updateProfileAddress(req.userId!, {
        zipCode: String(req.body.zipCode ?? ''),
        street: String(req.body.street ?? ''),
        neighborhood: String(req.body.neighborhood ?? ''),
        city: String(req.body.city ?? ''),
        state: String(req.body.state ?? ''),
        number: String(req.body.number ?? ''),
        complement:
          typeof req.body.complement === 'string' ? req.body.complement : undefined,
      });
      res.status(200).json(address);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getOnboardingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.userService.getOnboardingStatus(req.userId!);
      res.status(200).json(status);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  /**
   * Get the router with all routes
   */
  public getRoutes(): Router {
    return this.router;
  }
}
