import { NextFunction, Request, Response, RequestHandler } from 'express';
import { handleTranslatedError } from '@sauvvitech/st-packages';
import { IAuthTokenProvider } from '../../domain/auth/interfaces/auth-token-provider.interface';
import { EErrorCode } from '../../domain/common/errors/enums/EErrorCode';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

export function createAuthenticateMiddleware(
  authTokenProvider: IAuthTokenProvider,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      handleTranslatedError(
        {
          status: 401,
          errorCode: EErrorCode.AUTH_UNAUTHORIZED,
          message: 'Missing or invalid authorization header',
        },
        ErrorCatalog,
        res,
      );
      return;
    }

    const accessToken = authorizationHeader.slice('Bearer '.length).trim();

    if (!accessToken) {
      handleTranslatedError(
        {
          status: 401,
          errorCode: EErrorCode.AUTH_UNAUTHORIZED,
          message: 'Missing access token',
        },
        ErrorCatalog,
        res,
      );
      return;
    }

    try {
      const payload = authTokenProvider.verifyAccessToken(accessToken);
      req.userId = payload.sub;
      next();
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };
}
