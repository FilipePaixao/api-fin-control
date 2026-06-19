import { Client } from '@opensearch-project/opensearch';
import { OPENSEARCH_URL } from '../../configuration/env-constants/env.constants';

let opensearchClient: Client | null = null;

export function getOpenSearchClient(): Client {
  if (!opensearchClient) {
    opensearchClient = new Client({
      node: OPENSEARCH_URL,
    });
  }

  return opensearchClient;
}
