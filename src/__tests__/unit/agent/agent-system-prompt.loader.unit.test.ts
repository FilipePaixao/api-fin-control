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
    expect(prompt).toContain('Quero falar sobre meus gastos');
    expect(prompt).toContain('sem perguntar qual mês');
    expect(prompt).toContain('coleta incremental');
    expect(prompt).toContain('Aula de inglês');
    expect(prompt).toContain('Inferência de categoria');
    expect(prompt).toContain('Nunca repita pergunta');
    expect(prompt).toContain('Confirmação única (UI)');
    expect(prompt).toContain('confirmação dupla no chat');
    expect(prompt).toContain('Está tudo correto para você');
  });

  it('Should return cached content on subsequent loads', () => {
    const firstLoad = loadAgentSystemPrompt();
    const secondLoad = loadAgentSystemPrompt();

    expect(firstLoad).toBe(secondLoad);
  });
});
