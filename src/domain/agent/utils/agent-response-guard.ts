import { IProposedAction } from '../interfaces/agent.service.interface';

const CONFIRMATION_KEYWORDS = /confirm/i;
const FALSE_PERSISTENCE_PATTERNS =
  /\b(cadastr(?:ei|ada|ado|amos)|salv(?:ei|a|amos)|registr(?:ei|ada|ado|amos)|pronto[,.]?\s*(?:j[aá]|foi)?|j[aá]\s+(?:est[aá]|foi)\s+(?:cadastrad|salv|registrad)|alterei|atualizei|exclu[ií])\b/i;

export function guardAssistantResponse(
  content: string,
  proposedActions: IProposedAction[],
): string {
  const trimmed = content.trim() || 'Como posso ajudar?';

  if (proposedActions.length > 0) {
    return ensureConfirmationNotice(trimmed, proposedActions);
  }

  if (FALSE_PERSISTENCE_PATTERNS.test(trimmed)) {
    return `${trimmed}\n\n⚠️ Ainda não salvei nada no sistema. Para cadastrar ou alterar dados, preciso propor a ação e você deve confirmar no card da interface.`;
  }

  return trimmed;
}

function ensureConfirmationNotice(
  content: string,
  proposedActions: IProposedAction[],
): string {
  if (CONFIRMATION_KEYWORDS.test(content) && /interface|bot[aã]o|card|confirmar/i.test(content)) {
    return content;
  }

  const summaries = proposedActions.map((action) => `• ${action.summary}`).join('\n');
  return `${content}\n\n**Confirme no card abaixo** para salvar no sistema:\n${summaries}`;
}
