import {
  loadAgentSystemPrompt,
  resetAgentSystemPromptCache,
} from '../../../infraestructure/agent/agent-system-prompt.loader';

describe('When loading agent system prompt from markdown', () => {
  beforeEach(() => {
    resetAgentSystemPromptCache();
  });

  it('Should load non-empty content with FinControl identity', () => {
    const prompt = loadAgentSystemPrompt();

    expect(prompt.length).toBeGreaterThan(500);
    expect(prompt).toContain('FinControl');
    expect(prompt).toContain('get_financial_summary');
    expect(prompt).toContain('propose_create_expense');
    expect(prompt).toContain('Nunca');
  });

  it('Should return cached content on subsequent loads', () => {
    const firstLoad = loadAgentSystemPrompt();
    const secondLoad = loadAgentSystemPrompt();

    expect(firstLoad).toBe(secondLoad);
  });
});
