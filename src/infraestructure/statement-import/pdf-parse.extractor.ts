import { PDFParse } from 'pdf-parse';
import { IPdfTextExtractor } from '../../domain/statement-import/interfaces/pdf-text-extractor.interface';

export class PdfParseTextExtractor implements IPdfTextExtractor {
  async extract(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return (result.text ?? '').trim();
    } finally {
      await parser.destroy?.();
    }
  }
}
