import { guardAssistantResponse } from '../../../../domain/agent/utils/agent-response-guard';
import { EAgentActionType } from '../../../../domain/agent/entity/enums/EAgentActionType';

describe('guardAssistantResponse', () => {
  it('should append confirmation notice when proposed actions exist', () => {
    const result = guardAssistantResponse('Proponho cadastrar a despesa.', [
      {
        id: 'action-1',
        type: EAgentActionType.CREATE_EXPENSE,
        summary: 'Cadastrar despesa "Mercado" — R$ 150.00 (FOOD)',
        payload: {},
      },
    ]);

    expect(result).toContain('Confirme no card abaixo');
    expect(result).toContain('Mercado');
  });

  it('should warn when assistant claims persistence without proposed actions', () => {
    const result = guardAssistantResponse('Pronto, cadastrei sua despesa!', []);

    expect(result).toContain('Ainda não salvei nada no sistema');
  });

  it('should keep content unchanged when confirmation is already explicit', () => {
    const content =
      'Proponho cadastrar a despesa. Confirme no card da interface usando o botão Confirmar.';
    const result = guardAssistantResponse(content, [
      {
        id: 'action-1',
        type: EAgentActionType.CREATE_EXPENSE,
        summary: 'Cadastrar despesa',
        payload: {},
      },
    ]);

    expect(result).toBe(content);
  });
});
