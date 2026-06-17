import { readFileSync } from 'fs';
import path from 'path';

const PROMPT_RELATIVE_PATH = '../../domain/agent/prompts/agent-system-prompt.md';

let cachedPrompt: string | null = null;

export function loadAgentSystemPrompt(): string {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const promptPath = path.resolve(__dirname, PROMPT_RELATIVE_PATH);
  cachedPrompt = readFileSync(promptPath, 'utf8').trim();
  return cachedPrompt;
}

/** Expõe cache para testes que precisam resetar entre casos. */
export function resetAgentSystemPromptCache(): void {
  cachedPrompt = null;
}
