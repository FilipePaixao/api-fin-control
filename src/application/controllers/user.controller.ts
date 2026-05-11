import { Request, Response, Router } from 'express';
import { EUserGroup, authorizeByGroup, handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { UserService } from '../../domain/user/service/user.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class UserController implements IController {
  router: Router;
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
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
        createdAt: createdAt ? new Date(createdAt) : new Date(),
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

  /**
   * Get the router with all routes
   */
  public getRoutes(): Router {
    return this.router;
  }
}
