import { Request, RequestHandler, Response, Router } from 'express';
import { handleTranslatedError, IThrowedError } from '@sauvvitech/st-packages';
import { IController } from '../../domain/server/interfaces/IController';
import { EErrorCode } from '../../domain/common/errors/enums/EErrorCode';
import { EImportDocumentType } from '../../domain/statement-import/entity/enums/EImportDocumentType';
import { StatementImportService } from '../../domain/statement-import/service/statement-import.service';
import { ErrorCatalog } from '../../infraestructure/i18n/error-catalog';

type UploadedFile = {
  fieldname: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
  path?: string;
};

function resolveUploadedPdf(req: Request): UploadedFile | undefined {
  const single = req.file as UploadedFile | undefined;
  if (single?.buffer?.length || single?.path) {
    return single;
  }

  const files = req.files as UploadedFile[] | undefined;
  if (Array.isArray(files) && files.length) {
    return files.find((item) => item.fieldname === 'file') ?? files[0];
  }

  return undefined;
}

export class StatementImportController implements IController {
  router: Router;
  private readonly statementImportService: StatementImportService;
  private readonly authenticateMiddleware: RequestHandler;

  constructor(
    statementImportService: StatementImportService,
    authenticateMiddleware: RequestHandler,
  ) {
    this.statementImportService = statementImportService;
    this.authenticateMiddleware = authenticateMiddleware;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      '/imports/analyze',
      this.authenticateMiddleware,
      this.analyzeImport,
    );
    this.router.post(
      '/imports/confirm',
      this.authenticateMiddleware,
      this.confirmImport,
    );
  }

  analyzeImport = async (req: Request, res: Response): Promise<void> => {
    try {
      const documentType = String(req.body?.documentType ?? '') as EImportDocumentType;
      if (!Object.values(EImportDocumentType).includes(documentType)) {
        throw {
          status: 400,
          errorCode: EErrorCode.FIELD_INVALID,
          message: 'documentType is required',
        } as IThrowedError;
      }

      const file = resolveUploadedPdf(req);
      let fileBuffer: Buffer | undefined =
        file?.buffer && file.buffer.length ? Buffer.from(file.buffer) : undefined;

      if (!fileBuffer?.length && file?.path) {
        const { readFileSync } = await import('fs');
        fileBuffer = readFileSync(file.path);
      }

      if (!fileBuffer?.length) {
        throw {
          status: 400,
          errorCode: EErrorCode.IMPORT_INVALID_PDF,
          message: 'PDF file is required',
        } as IThrowedError;
      }

      const result = await this.statementImportService.analyze(req.userId!, {
        documentType,
        fileBuffer,
        mimeType: file?.mimetype,
      });
      res.status(200).json(result);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  confirmImport = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.statementImportService.confirm(req.userId!, req.body);
      res.status(201).json(result);
    } catch (error) {
      handleTranslatedError(error, ErrorCatalog, res);
    }
  };

  getRoutes(): Router {
    return this.router;
  }
}
