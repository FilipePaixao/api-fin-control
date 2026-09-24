import { ILlmToolDefinition } from '../../agent/interfaces/llm-provider.interface';

export const ENRICH_MERCHANT_NAMES_TOOL: ILlmToolDefinition = {
  name: 'enrich_merchant_names',
  description:
    'Recebe nomes crus de fatura/extrato BR e devolve o nome comercial legível de cada um. Chame uma vez com todos os itens.',
  parameters: {
    type: 'object',
    required: ['merchants'],
    properties: {
      merchants: {
        type: 'array',
        items: {
          type: 'object',
          required: ['original', 'displayName'],
          properties: {
            original: {
              type: 'string',
              description: 'Nome exatamente como veio no documento',
            },
            displayName: {
              type: 'string',
              description: 'Nome amigável da empresa/serviço em português',
            },
          },
        },
      },
    },
  },
};

export const ENRICH_MERCHANT_NAMES_SYSTEM_PROMPT = `Você normaliza nomes de lançamentos de fatura/extrato brasileiro.
Remova prefixos de gateway (MP *, Ifd*, Ebn*, Pag*, Net Pgt*, Vindi *, etc.) e devolva o nome comercial legível.
Exemplos: "MP *Betelbarbeari" → "Betel Barbearia"; "Ifd*William Flores da" → "iFood - William Flores"; "Ebn*Tiktok Sh" → "TikTok"; "Transação de NuTag" → "NuTag".
Responda SOMENTE chamando enrich_merchant_names uma vez, com um item por original recebido.
Não invente valores, datas ou categorias. Se não souber, use o original limpo (sem prefixo técnico).`;
