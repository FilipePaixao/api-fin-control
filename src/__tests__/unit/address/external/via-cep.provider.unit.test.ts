import { ViaCepProvider } from '../../../../infraestructure/external/via-cep/via-cep.provider';

describe('When ViaCEP returns erro=true in ViaCepProvider', () => {
  it('Should return null', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ erro: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const provider = new ViaCepProvider('https://viacep.test.br/ws');
    const result = await provider.lookupZipCode('00000000');

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://viacep.test.br/ws/00000000/json/',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

describe('When ViaCEP returns a valid payload in ViaCepProvider', () => {
  it('Should map address fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'sp',
      }),
    }) as unknown as typeof fetch;

    const provider = new ViaCepProvider('https://viacep.test.br/ws');
    const result = await provider.lookupZipCode('01310100');

    expect(result).toEqual({
      zipCode: '01310100',
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
  });
});
