export interface IPdfTextExtractor {
  extract(buffer: Buffer): Promise<string>;
}
