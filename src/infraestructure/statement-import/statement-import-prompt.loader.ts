import { readFileSync } from 'fs';
import path from 'path';

const PROMPT_RELATIVE_PATH = '../../domain/statement-import/prompts/statement-import-prompt.md';

let cachedPrompt: string | null = null;

export function loadStatementImportPrompt(): string {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const promptPath = path.resolve(__dirname, PROMPT_RELATIVE_PATH);
  cachedPrompt = readFileSync(promptPath, 'utf8').trim();
  return cachedPrompt;
}

export function resetStatementImportPromptCache(): void {
  cachedPrompt = null;
}
