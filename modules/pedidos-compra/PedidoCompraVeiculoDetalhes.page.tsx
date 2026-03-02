import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IVeiculo, IVeiculoDespesa } from '../estoque/estoque.types';
import { EstoqueService } from '../estoque/estoque.service';
import { CaracteristicasService } from '../cadastros/caracteristicas/caracteristicas.service';
import { OpcionaisService } from '../cadastros/opcionais/opcionais.service';
import { CoresService } from '../cadastros/cores/cores.service';
import { ICaracteristica } from '../cadastros/caracteristicas/caracteristicas.types';
import { IOpcional } from '../cadastros/opcionais/opcionais.types';
import { ICor } from '../cadastros/cores/cores.types';

// Reutilizando componentes modulares do Estoque
import HeaderDetails from '../estoque/components/details/HeaderDetails';
import GalleryCard from '../estoque/components/details/GalleryCard';
import FeaturesCard from '../estoque/components/details/FeaturesCard';
import FinancialCard from '../estoque/components/details/FinancialCard';
import SpecsCard from '../estoque/components/details/SpecsCard';
import VehicleExpensesCard from '../estoque/components/details/VehicleExpensesCard';
import VehicleQuickInfoCard from '../estoque/components/details/VehicleQuickInfoCard';
import ModalEditarDespesaVeiculo from '../estoque/components/details/ModalEditarDespesaVeiculo';

const PedidoCompraVeiculoDetalhesPage: React.FC = () => {
  const navigate = useNavigate();
  const { id, veiculoId } = useParams(); // id é o ID do pedido de compra

  const [veiculo, setVeiculo] = useState<IVeiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<IVeiculoDespesa | null>(null);

  const [allCaracteristicas, setAllCaracteristicas] = useState<ICaracteristica[]>([]);
  const [allOpcionais, setAllOpcionais] = useState<IOpcional[]>([]);
  const [cores, setCores] = useState<ICor[]>([]);

  useEffect(() => {
    loadData();
  }, [veiculoId]);

  async function loadData() {
    if (!veiculoId) return;
    setLoading(true);
    try {
      const [vData, carData, opData, coresData] = await Promise.all([
        EstoqueService.getById(veiculoId),
        CaracteristicasService.getAll(),
        OpcionaisService.getAll(),
        CoresService.getAll()
      ]);

      setVeiculo(vData);
      setAllCaracteristicas(carData);
      setAllOpcionais(opData);
      setCores(coresData);

    } catch (error) {
      console.error(error);
      handleBack();
    } finally {
      setLoading(false);
    }
  }

  const handleBack = () => {
    navigate(`/pedidos-compra/${id}`);
  };

  const handleEdit = () => {
    navigate(`/pedidos-compra/${id}/veiculo/editar/${veiculoId}`);
  };

  const handleAddExpense = async (expenses: Partial<IVeiculoDespesa>[]) => {
    alert('Funcionalidade de lançamento direto no pedido de compra em desenvolvimento.');
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Deseja remover este lançamento?')) {
      // Lógica delete
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!veiculo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="text-slate-400">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Veículo não encontrado</h2>
        <p className="text-slate-500 text-sm max-w-md text-center">Não foi possível carregar os dados deste veículo. Ele pode ter sido removido ou você não tem permissão para acessá-lo.</p>
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest"
        >
          Voltar para o Pedido
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20 animate-in fade-in duration-500 max-w-screen-2xl mx-auto px-4 md:px-8">

      <HeaderDetails
        veiculo={veiculo}
        onBack={handleBack}
        onEdit={handleEdit}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">

        <div className="lg:col-span-7 space-y-6">
          <VehicleQuickInfoCard veiculo={veiculo} />
          <GalleryCard fotos={veiculo.fotos || []} />
          <FeaturesCard
            veiculo={veiculo}
            allCaracteristicas={allCaracteristicas}
            allOpcionais={allOpcionais}
          />
        </div>

        <div className="lg:col-span-5 space-y-6 sticky top-6">
          <FinancialCard veiculo={veiculo} />
          <SpecsCard veiculo={veiculo} cores={cores} />
        </div>
      </div>

      <div className="w-full">
        <VehicleExpensesCard
          veiculo={veiculo}
          onAddExpense={handleAddExpense}
          onEditExpense={setEditingExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      </div>

      {editingExpense && (
        <ModalEditarDespesaVeiculo
          despesa={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default PedidoCompraVeiculoDetalhesPage;