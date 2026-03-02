
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IVeiculo } from '../../../../estoque/estoque.types';
import { CaracteristicasService } from '../../../../cadastros/caracteristicas/caracteristicas.service';
import { OpcionaisService } from '../../../../cadastros/opcionais/opcionais.service';
import { ICaracteristica } from '../../../../cadastros/caracteristicas/caracteristicas.types';
import { IOpcional } from '../../../../cadastros/opcionais/opcionais.types';

// Sub-componentes Reestruturados
import VehicleMediaSaleColumn from './sub/VehicleMediaSaleColumn';
import VehicleDataSaleColumn from './sub/VehicleDataSaleColumn';

interface Props {
  veiculo: IVeiculo;
  isConcluido: boolean;
  isConsignado?: boolean;
  onUnlink: () => void;
  onUpdatePrice: (newPrice: number) => void;
}

const VehicleInSaleCard: React.FC<Props> = ({ veiculo, isConcluido, isConsignado, onUnlink, onUpdatePrice }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID do Pedido de Venda

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [localPrice, setLocalPrice] = useState(veiculo.valor_venda || 0);
  const [car, setCar] = useState<ICaracteristica[]>([]);
  const [op, setOp] = useState<IOpcional[]>([]);

  useEffect(() => {
    setLocalPrice(veiculo.valor_venda || 0);
  }, [veiculo.valor_venda]);

  useEffect(() => {
    // Carrega dados auxiliares para as tags
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

  const handleStartEditPrice = (e: React.MouseEvent) => {
    if (!isConcluido) {
      e.stopPropagation();
      setIsEditingPrice(true);
    }
  };

  const handleSavePrice = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdatePrice(localPrice);
    setIsEditingPrice(false);
  };

  const handleCurrencyInput = (val: string) => {
    const numeric = Number(val.replace(/\D/g, '')) / 100;
    setLocalPrice(numeric);
  };

  const handleGoToDetails = () => {
    if (id && veiculo.id) {
      navigate(`/pedidos-venda/${id}/veiculo-detalhes/${veiculo.id}`);
    }
  };

  const handleUnlinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnlink();
  };

  return (
    <div
      className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-indigo-300 group animate-in slide-in-from-bottom-4"
    >
      {/* Grid Principal Simétrico - Proporção 380px para imagem para manter consistência com Compra */}
      <div
        onClick={handleGoToDetails}
        className="grid grid-cols-1 lg:grid-cols-[380px_1fr] items-stretch cursor-pointer min-h-[400px]"
      >
        {/* LADO ESQUERDO: Imagem e Tags */}
        <VehicleMediaSaleColumn
          veiculo={veiculo}
          allCaracteristicas={car}
          allOpcionais={op}
        />

        {/* LADO DIREITO: Dados, KPIs e Sócios */}
        <VehicleDataSaleColumn
          veiculo={veiculo}
          isConcluido={isConcluido}
          isConsignado={isConsignado}
          isEditingPrice={isEditingPrice}
          localPrice={localPrice}
          onStartEditPrice={handleStartEditPrice}
          onCurrencyInput={handleCurrencyInput}
          onSavePrice={handleSavePrice}
          onUnlink={handleUnlinkClick}
        />
      </div>
    </div>
  );
};

export default VehicleInSaleCard;
