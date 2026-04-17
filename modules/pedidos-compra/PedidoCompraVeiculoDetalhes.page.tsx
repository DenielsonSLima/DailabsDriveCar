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
import { PedidosCompraService } from './pedidos-compra.service';
import { IPedidoCompra } from './pedidos-compra.types';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

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
  const [pedido, setPedido] = useState<IPedidoCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<IVeiculoDespesa | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

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
      const [vData, carData, opData, coresData, pData] = await Promise.all([
        EstoqueService.getById(veiculoId),
        CaracteristicasService.getAll(),
        OpcionaisService.getAll(),
        CoresService.getAll(),
        id ? PedidosCompraService.getById(id) : Promise.resolve(null)
      ]);
      
      setVeiculo(vData);
      setAllCaracteristicas(carData);
      setAllOpcionais(opData);
      setCores(coresData);
      setPedido(pData);

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
    if (!veiculoId) return;
    
    if (pedido?.status === 'RASCUNHO') {
      toast.error('Este pedido ainda é um rascunho. Confirme o pedido para liberar o lançamento de despesas financeiras.');
      return;
    }

    try {
      await EstoqueService.saveExpensesBatch(veiculoId, expenses);
      toast.success('Lançamento realizado com sucesso!');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar despesas.');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setDeleteExpenseId(expenseId);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseId) return;
    try {
      await EstoqueService.deleteExpense(deleteExpenseId);
      toast.success('Despesa removida!');
      setDeleteExpenseId(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover despesa.');
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

      {pedido?.status === 'RASCUNHO' && (
        <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] flex items-center space-x-6 animate-in fade-in slide-in-from-top duration-500">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-900 uppercase tracking-tighter">Pedido em Rascunho</h3>
            <p className="text-amber-700 text-sm font-medium leading-relaxed">
              Este veículo faz parte de um <span className="font-bold underline">Pedido de Compra não confirmado</span>. 
              Para realizar lançamentos financeiros definitivos, você deve primeiro efetivar o pedido na tela anterior.
            </p>
          </div>
        </div>
      )}

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

      <ConfirmModal
        isOpen={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={confirmDeleteExpense}
        title="Excluir Lançamento?"
        message="Deseja realmente remover esta despesa do veículo? Esta ação não pode ser desfeita."
        confirmText="Sim, Remover"
        variant="danger"
      />
    </div>
  );
};

export default PedidoCompraVeiculoDetalhesPage;