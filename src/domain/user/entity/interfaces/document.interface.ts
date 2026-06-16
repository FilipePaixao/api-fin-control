import { EDocumentType } from '../enums/EDocumentType';

export interface IDocument {
  type: EDocumentType;
  value: string;
}
