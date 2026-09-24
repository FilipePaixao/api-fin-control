declare global {
  namespace Express {
    interface Request {
      userId?: string;
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
        path?: string;
      };
      files?:
        | {
            fieldname: string;
            originalname: string;
            encoding: string;
            mimetype: string;
            size: number;
            buffer: Buffer;
            path?: string;
          }[]
        | {
            [fieldname: string]: {
              fieldname: string;
              originalname: string;
              encoding: string;
              mimetype: string;
              size: number;
              buffer: Buffer;
              path?: string;
            }[];
          };
    }
  }
}

export {};
