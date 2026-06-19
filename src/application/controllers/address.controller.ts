import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { IAddressService } from '../../domain/address/interfaces/address.service.interface';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export class AddressController implements IController {
  router: Router;
  private readonly addressService: IAddressService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    addressService: IAddressService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.addressService = addressService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/address/zip/:zipCode',
      this.authenticateMiddleware,
      this.lookupZipCode,
    );
  }

  lookupZipCode = async (
    req: Request<{ zipCode: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const address = await this.addressService.lookupZipCode(req.params.zipCode);
      res.status(200).json(address);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
