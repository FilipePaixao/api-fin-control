import {
  loadOnboardingSystemPrompt,
  resetOnboardingSystemPromptCache,
} from '../../../infraestructure/agent/onboarding-system-prompt.loader';

describe('When loading onboarding system prompt from markdown', () => {
  beforeEach(() => {
    resetOnboardingSystemPromptCache();
  });

  it('Should load non-empty content with onboarding rules and single confirmation', () => {
    const prompt = loadOnboardingSystemPrompt();

    expect(prompt.length).toBeGreaterThan(200);
    expect(prompt).toContain('propose_update_profile');
    expect(prompt).toContain('propose_complete_onboarding');
    expect(prompt).toContain('servidor define a etapa atual');
    expect(prompt).toContain('confirmação dupla por campo');
    expect(prompt).toContain('Posso confirmar e concluir');
  });

  it('Should return cached content on subsequent loads', () => {
    const firstLoad = loadOnboardingSystemPrompt();
    const secondLoad = loadOnboardingSystemPrompt();

    expect(firstLoad).toBe(secondLoad);
  });
});
