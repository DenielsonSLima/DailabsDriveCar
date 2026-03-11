import { supabase } from '../../../lib/supabase';

export interface VeiculoConsultaReponse {
  user: {
    first_name: string;
    email: string;
    cellphone: string;
    notification: string;
  };
  balance: string;
  error: boolean;
  message: string;
  tax: string;
  valor_consulta: number;
  api_limit_for: string;
  homolog: boolean;
  data: {
    resultados: {
      anoFabricacao: number;
      anoModelo: string;
      categoria: string;
      chassi: string;
      codigoFipe: string;
      combustivel: string;
      cor: string;
      extra: any;
      historico: {
        mes: string;
        valor: number;
      }[];
      marca: string;
      mesReferencia: string;
      modelo: string;
      principal: boolean;
      url: string;
      valor: number;
    }[];
  };
}

export const consultaPlacaService = {
  async consultar(placa: string): Promise<VeiculoConsultaReponse> {
    const limpaPlaca = placa.replace(/[^a-zA-Z0-9]/g, '');

    const token = import.meta.env.VITE_APIBRASIL_BEARER_TOKEN;

    if (!token) {
      throw new Error('Token da API Brasil não configurado. Verifique a variável VITE_APIBRASIL_BEARER_TOKEN.');
    }

    try {
      const response = await fetch('https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo: 'fipe-chassi',
          placa: limpaPlaca,
          homolog: false // Produção — R$ 0,06 por consulta
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na API Brasil:', errorData);

        // Tratamento específico para saldo insuficiente
        if (response.status === 402 || (errorData.message && errorData.message.toLowerCase().includes('saldo'))) {
          throw new Error('SALDO_INSUFICIENTE');
        }

        throw new Error(errorData.message || 'Falha ao consultar a placa na API Brasil.');
      }

      const data: VeiculoConsultaReponse = await response.json();
      
      if (data.error) {
        if (data.message && data.message.toLowerCase().includes('saldo')) {
           throw new Error('SALDO_INSUFICIENTE');
        }
        throw new Error(data.message || 'A API retornou erro para esta consulta.');
      }

      return data;
    } catch (error: any) {
      console.error('Erro no consultaPlacaService:', error);
      throw error;
    }
  }
};
