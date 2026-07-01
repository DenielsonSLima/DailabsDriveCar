import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DespesasVariaveisService } from './despesas-variaveis.service';
import { DespesasFixasService } from '../despesas-fixas/despesas-fixas.service';
import { FinanceiroService } from '../../financeiro.service';
import { ITituloVariavel, VariaveisTab, IVariaveisFiltros, GroupByVariavel } from './despesas-variaveis.types';
import { ITituloFixa } from '../despesas-fixas/despesas-fixas.types';
import VariaveisFilters from './components/VariaveisFilters';
import VariaveisList from './components/VariaveisList';
import VariaveisKpis from './components/VariaveisKpis';
import DespesaVariavelForm from './components/DespesaVariavelForm';
import DespesaFixaForm from '../despesas-fixas/components/DespesaFixaForm';
import ModalBaixa from '../components/ModalBaixa';
import ConfirmModal from '../../../../components/ConfirmModal';

interface DespesasVariaveisPageProps {
  modoUnificado?: boolean;
}

type TipoDespesaForm = 'FIXA' | 'VARIAVEL';
type TituloDespesa = ITituloVariavel | ITituloFixa;

const DespesasVariaveisPage: React.FC<DespesasVariaveisPageProps> = ({ modoUnificado = false }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<VariaveisTab>('MES_ATUAL');
  const [titulos, setTitulos] = useState<TituloDespesa[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupByVariavel>('nenhum');
  const [kpis, setKpis] = useState<any>(null);

  const [filtros, setFiltros] = useState<IVariaveisFiltros>({
    busca: '',
    dataInicio: '',
    dataFim: '',
    categoriaId: '',
    status: ''
  });

  const [selectedTitulo, setSelectedTitulo] = useState<TituloDespesa | null>(null);
  const [tituloEditando, setTituloEditando] = useState<TituloDespesa | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; tipo: TipoDespesaForm } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTipo, setFormTipo] = useState<TipoDespesaForm>('VARIAVEL');
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Sincroniza agrupamento padrão ao mudar de aba
  useEffect(() => {
    if (activeTab === 'TODOS') setGroupBy('mes');
    else setGroupBy('nenhum');
  }, [activeTab]);

  useEffect(() => {
    loadData();
    FinanceiroService.getCategorias().then(data =>
      setCategorias(data.filter(c => modoUnificado ? ['FIXA', 'VARIAVEL'].includes(c.tipo) : c.tipo === 'VARIAVEL'))
    );
    const subVariaveis = DespesasVariaveisService.subscribe(() => loadData(true));
    const subFixas = modoUnificado ? DespesasFixasService.subscribe(() => loadData(true)) : null;
    return () => {
      subVariaveis.unsubscribe();
      subFixas?.unsubscribe();
    };
  }, [activeTab, filtros, modoUnificado]);

  const getTituloTipo = (titulo: TituloDespesa): TipoDespesaForm =>
    titulo.origem_tipo === 'DESPESA_FIXA' ? 'FIXA' : 'VARIAVEL';

  const sumKpis = (fixas?: any, variaveis?: any) => ({
    valor_total: (fixas?.valor_total || 0) + (variaveis?.valor_total || 0),
    valor_pago: (fixas?.valor_pago || 0) + (variaveis?.valor_pago || 0),
    valor_pendente: (fixas?.valor_pendente || 0) + (variaveis?.valor_pendente || 0),
  });

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      if (modoUnificado) {
        const results = await Promise.allSettled([
          DespesasFixasService.getAll(activeTab as any, filtros as any),
          DespesasVariaveisService.getAll(activeTab, filtros),
          DespesasFixasService.getKpis(activeTab as any, filtros as any),
          DespesasVariaveisService.getKpis(activeTab, filtros),
        ]);

        const fixas = results[0].status === 'fulfilled' ? results[0].value as ITituloFixa[] : [];
        const variaveis = results[1].status === 'fulfilled' ? results[1].value as ITituloVariavel[] : [];
        const merged = [...fixas, ...variaveis].sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));

        if (results[0].status === 'rejected') console.error('Erro ao carregar despesas fixas:', results[0].reason);
        if (results[1].status === 'rejected') console.error('Erro ao carregar despesas variáveis:', results[1].reason);
        if (results[2].status === 'rejected') console.error('Erro ao carregar KPIs de despesas fixas:', results[2].reason);
        if (results[3].status === 'rejected') console.error('Erro ao carregar KPIs de despesas variáveis:', results[3].reason);

        setTitulos(merged);
        setKpis(sumKpis(
          results[2].status === 'fulfilled' ? results[2].value : null,
          results[3].status === 'fulfilled' ? results[3].value : null,
        ));
      } else {
        const results = await Promise.allSettled([
          DespesasVariaveisService.getAll(activeTab, filtros),
          DespesasVariaveisService.getKpis(activeTab, filtros)
        ]);

        if (results[0].status === 'fulfilled') {
          setTitulos(results[0].value);
        } else {
          console.error('Erro ao carregar despesas variáveis:', results[0].reason);
          setTitulos([]);
        }

        if (results[1].status === 'fulfilled') {
          setKpis(results[1].value);
        } else {
          console.error('Erro ao carregar KPIs de despesas variáveis:', results[1].reason);
          setKpis(null);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  }

  const processedData = useMemo(() => {
    if (activeTab !== 'TODOS' && groupBy === 'nenhum') return titulos;

    if (activeTab === 'TODOS' && groupBy === 'nenhum') {
      return titulos.reduce((acc: any, t) => {
        const key = t.status === 'PAGO' ? 'PAGO' : 'EM ABERTO';
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {});
    }

    return titulos.reduce((acc: any, t) => {
      let key = 'DIVERSOS';
      if (groupBy === 'mes') {
        const d = new Date(t.data_vencimento);
        key = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
      } else if (groupBy === 'categoria') {
        key = t.categoria?.nome || 'SEM CATEGORIA';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});
  }, [titulos, groupBy, activeTab]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.tipo === 'FIXA') {
        await DespesasFixasService.delete(deleteTarget.id);
      } else {
        await DespesasVariaveisService.delete(deleteTarget.id);
      }
      setDeleteTarget(null);
      setToast({ type: 'success', message: 'Despesa estornada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
      loadData(true);
    } catch (e) {
      setToast({ type: 'error', message: 'Erro ao estornar lançamento.' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleOpenCreate = () => {
    setTituloEditando(null);
    if (modoUnificado) {
      setShowTipoModal(true);
      return;
    }

    setFormTipo('VARIAVEL');
    setIsFormOpen(true);
  };

  const handleSelectTipo = (tipo: TipoDespesaForm) => {
    setFormTipo(tipo);
    setShowTipoModal(false);
    setIsFormOpen(true);
  };

  const handleEdit = (titulo: TituloDespesa) => {
    setTituloEditando(titulo);
    setFormTipo(getTituloTipo(titulo));
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setTituloEditando(null);
    queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
    loadData(true);
    setToast({ type: 'success', message: `Despesa ${tituloEditando ? 'atualizada' : 'lançada'} com sucesso!` });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 border backdrop-blur-md ${toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white'
          }`}>
          <span className="font-bold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{modoUnificado ? 'Despesas' : 'Despesas Variáveis'}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">{modoUnificado ? 'Gestão simplificada de despesas financeiras' : 'Gestão de gastos operacionais e eventuais'}</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-8 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl active:scale-95 flex items-center shadow-orange-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Lançar Despesa
        </button>
      </div>

      <VariaveisKpis kpis={kpis} />

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm overflow-x-auto max-w-full gap-1">
        <button onClick={() => setActiveTab('MES_ATUAL')} className={`px-6 py-2.5 rounded-xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${activeTab === 'MES_ATUAL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Mês Atual</button>
        <button onClick={() => setActiveTab('FUTUROS')} className={`px-6 py-2.5 rounded-xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${activeTab === 'FUTUROS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Futuros</button>
        <button onClick={() => setActiveTab('PAGO')} className={`px-6 py-2.5 rounded-xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${activeTab === 'PAGO' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Pago</button>
        <button onClick={() => setActiveTab('PENDENTES')} className={`px-6 py-2.5 rounded-xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${activeTab === 'PENDENTES' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Pendentes</button>
        <button onClick={() => setActiveTab('TODOS')} className={`px-6 py-2.5 rounded-xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${activeTab === 'TODOS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Todos</button>
      </div>

      <VariaveisFilters
        filtros={filtros}
        onChange={setFiltros}
        categorias={categorias}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <VariaveisList
          items={processedData as any}
          loading={loading}
          isGrouped={groupBy !== 'nenhum' || activeTab === 'TODOS'}
          onPagar={(t) => setSelectedTitulo(t as any)}
          onEdit={(t) => handleEdit(t as TituloDespesa)}
          onDelete={(id, titulo) => setDeleteTarget({ id, tipo: getTituloTipo(titulo as TituloDespesa) })}
          modoUnificado={modoUnificado}
        />
      </div>

      {selectedTitulo && (
        <ModalBaixa
          titulo={selectedTitulo as any}
          onClose={() => setSelectedTitulo(null)}
          onSuccess={() => { 
            setSelectedTitulo(null); 
            queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
            loadData(true); 
            setToast({ type: 'success', message: 'Baixa realizada com sucesso!' }); 
          }}
        />
      )}

      {isFormOpen && formTipo === 'VARIAVEL' && (
        <DespesaVariavelForm
          tituloEditando={tituloEditando as ITituloVariavel | null}
          onClose={() => { setIsFormOpen(false); setTituloEditando(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      {isFormOpen && formTipo === 'FIXA' && (
        <DespesaFixaForm
          tituloEditando={tituloEditando as ITituloFixa | null}
          onClose={() => { setIsFormOpen(false); setTituloEditando(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showTipoModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-200">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tipo da despesa</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Escolha como o lançamento será classificado</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectTipo('VARIAVEL')}
                className="p-5 rounded-2xl border border-orange-100 bg-orange-50 text-left hover:border-orange-300 hover:bg-orange-100 transition-all"
              >
                <span className="block text-sm font-black text-orange-700 uppercase tracking-tight">Variável</span>
                <span className="block text-[10px] text-orange-600/80 font-bold uppercase mt-1">Gasto eventual</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTipo('FIXA')}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 text-left hover:border-slate-400 hover:bg-slate-100 transition-all"
              >
                <span className="block text-sm font-black text-slate-800 uppercase tracking-tight">Fixa</span>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mt-1">Custo recorrente</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowTipoModal(false)}
              className="w-full mt-5 py-3 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Estornar Despesa?"
        message="Tem certeza que deseja estornar esta despesa? Se houve pagamento, o valor será devolvido ao saldo da conta bancária automaticamente."
        confirmText="Sim, Estornar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DespesasVariaveisPage;
