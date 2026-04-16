
import { IMontadora } from '../montadoras/montadoras.types';
import { ITipoVeiculo } from '../tipos-veiculos/tipos-veiculos.types';

export interface IModelo {
  id: string;
  user_id?: string;
  nome: string;
  montadora_id: string;
  tipo_veiculo_id?: string;
  foto_url?: string;
  created_at: string;
  updated_at?: string;
  ativo?: boolean;
  // Joins
  montadora?: IMontadora;
  tipo_veiculo?: ITipoVeiculo;
}

export interface IModelosAgrupados {
  [montadoraNome: string]: {
    montadora: IMontadora;
    modelos: IModelo[];
  };
}
