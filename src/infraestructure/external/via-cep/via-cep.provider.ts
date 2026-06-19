import { IAddressLookupResult } from '../../../domain/user/entity/interfaces/address.interface';
import { IViaCepProvider } from '../../../domain/address/interfaces/via-cep.provider.interface';

const VIA_CEP_BASE_URL = 'https://viacep.com.br/ws';
const VIA_CEP_TIMEOUT_MS = 5000;

interface ViaCepApiResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export class ViaCepProvider implements IViaCepProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl = VIA_CEP_BASE_URL, timeoutMs = VIA_CEP_TIMEOUT_MS) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  async lookupZipCode(zipCode: string): Promise<IAddressLookupResult | null> {
    const normalizedZipCode = zipCode.replace(/\D/g, '');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(
        `${this.baseUrl}/${normalizedZipCode}/json/`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as ViaCepApiResponse;
      if (data.erro || !data.logradouro || !data.localidade || !data.uf) {
        return null;
      }

      return {
        zipCode: normalizedZipCode,
        street: data.logradouro.trim(),
        neighborhood: (data.bairro ?? '').trim(),
        city: data.localidade.trim(),
        state: data.uf.trim().toUpperCase(),
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
