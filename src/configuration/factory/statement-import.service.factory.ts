import { StatementImportService } from '../../domain/statement-import/service/statement-import.service';
import {
  OLLAMA_NUM_CTX,
  OLLAMA_TIMEOUT_MS,
} from '../env-constants/env.constants';
import { OllamaLlmProvider } from '../../infraestructure/agent/ollama-llm.provider';
import { PdfParseTextExtractor } from '../../infraestructure/statement-import/pdf-parse.extractor';
import { loadStatementImportPrompt } from '../../infraestructure/statement-import/statement-import-prompt.loader';
import { ExpenseServiceFactory } from './expense.service.factory';
import { IncomeServiceFactory } from './income.service.factory';
import { CreditCardServiceFactory } from './credit-card.service.factory';

export class StatementImportServiceFactory {
  static create(): StatementImportService {
    // Importação de PDF: prompts longos + muitas linhas → timeout e ctx menores que o default do agente.
    const llmProvider = new OllamaLlmProvider(
      undefined,
      undefined,
      Math.max(OLLAMA_TIMEOUT_MS, 300_000),
      Math.min(OLLAMA_NUM_CTX, 8192),
    );

    return new StatementImportService({
      pdfTextExtractor: new PdfParseTextExtractor(),
      llmProvider,
      expenseService: ExpenseServiceFactory.create(),
      incomeService: IncomeServiceFactory.create(),
      creditCardService: CreditCardServiceFactory.create(),
      systemPrompt: loadStatementImportPrompt(),
    });
  }
}
