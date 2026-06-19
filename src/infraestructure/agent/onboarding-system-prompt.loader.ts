import { readFileSync } from 'fs';
import path from 'path';

const PROMPT_RELATIVE_PATH = '../../domain/agent/prompts/onboarding-system-prompt.md';

let cachedPrompt: string | null = null;

export function loadOnboardingSystemPrompt(): string {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  const promptPath = path.resolve(__dirname, PROMPT_RELATIVE_PATH);
  cachedPrompt = readFileSync(promptPath, 'utf8').trim();
  return cachedPrompt;
}

export function resetOnboardingSystemPromptCache(): void {
  cachedPrompt = null;
}
