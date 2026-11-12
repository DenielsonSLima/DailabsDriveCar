
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IVeiculo } from '../../../../estoque/estoque.types';
import { CaracteristicasService } from '../../../../cadastros/caracteristicas/caracteristicas.service';
import { OpcionaisService } from '../../../../cadastros/opcionais/opcionais.service';
import { ICaracteristica } from '../../../../cadastros/caracteristicas/caracteristicas.types';
import { IOpcional } from '../../../../cadastros/opcionais/opcionais.types';

// Sub-componentes Modulares
import VehicleMediaColumn from './sub/VehicleMediaColumn';
import VehicleDataColumn from './sub/VehicleDataColumn';

interface Props {
  veiculo: IVeiculo;
  pedidoId: string;
  isConcluido: boolean;
  onUnlink: (id: string) => void;
}

const VehicleInOrderCard: React.FC<Props> = ({ veiculo, pedidoId, isConcluido, onUnlink }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [car, setCar] = useState<ICaracteristica[]>([]);
  const [op, setOp] = useState<IOpcional[]>([]);

  useEffect(() => {
    if (veiculo.caracteristicas_ids?.length || veiculo.opcionais_ids?.length) {
      Promise.all([
        CaracteristicasService.getAll(),
        OpcionaisService.getAll()
      ]).then(([cData, oData]) => {
        setCar(cData);
        setOp(oData);
      });
    }
  }, [veiculo.id, veiculo.caracteristicas_ids, veiculo.opcionais_ids]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/pedidos-compra/${pedidoId}/veiculo/editar/${veiculo.id}`);
  };

  const handleViewDetails = () => {
    navigate(`/pedidos-compra/${pedidoId}/veiculo-detalhes/${veiculo.id}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-500 hover:shadow-sm hover:border-indigo-300 group animate-in slide-in-from-bottom-4">

      {/* Barra de Ações Flutuante */}
      <div className="absolute top-6 right-6 z-20 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        {!isConcluido && (
          <button
            onClick={handleEdit}
            className="dc-button p-3 bg-white border border-slate-200 text-indigo-500 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
            title="Editar Ficha Técnica"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}

        {!isConcluido && (
          <button
            onClick={(e) => { e.stopPropagation(); onUnlink(veiculo.id); }}
            className="dc-button p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
            title="Remover do Pedido"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Grid Principal Layout Horizontal - Proporção 35% / 65% */}
      <div
        onClick={handleViewDetails}
        className="grid grid-cols-1 lg:grid-cols-[380px_1fr] items-stretch cursor-pointer min-h-[400px]"
      >
        <VehicleMediaColumn
          veiculo={veiculo}
          allCaracteristicas={car}
          allOpcionais={op}
        />

        <VehicleDataColumn
          veiculo={veiculo}
        />
      </div>
    </div>
  );
};

export default VehicleInOrderCard;
