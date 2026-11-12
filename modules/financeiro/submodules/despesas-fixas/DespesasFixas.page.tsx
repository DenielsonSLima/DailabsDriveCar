import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DespesasFixasService } from './despesas-fixas.service';
import { FinanceiroService } from '../../financeiro.service';
import { ITituloFixa, FixasTab, IFixasFiltros, GroupByFixa } from './despesas-fixas.types';
import FixasFilters from './components/FixasFilters';
import FixasList from './components/FixasList';
import FixasKpis from './components/FixasKpis';
import DespesaFixaForm from './components/DespesaFixaForm';
import ModalBaixa from '../components/ModalBaixa';
import ConfirmModal from '../../../../components/ConfirmModal';

const DespesasFixasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FixasTab>('MES_ATUAL');
  const [titulos, setTitulos] = useState<ITituloFixa[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupByFixa>('nenhum');
  const [kpis, setKpis] = useState<any>(null);

  const [filtros, setFiltros] = useState<IFixasFiltros>({
    busca: '',
    dataInicio: '',
    dataFim: '',
    categoriaId: '',
    status: ''
  });

  const [selectedTitulo, setSelectedTitulo] = useState<ITituloFixa | null>(null);
  const [tituloEditando, setTituloEditando] = useState<ITituloFixa | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Sincroniza agrupamento padrão ao mudar de aba
  useEffect(() => {
    if (activeTab === 'TODOS') setGroupBy('mes');
    else setGroupBy('nenhum');
  }, [activeTab]);

  useEffect(() => {
    loadData();
    FinanceiroService.getCategorias().then(data =>
      setCategorias(data.filter(c => c.tipo === 'FIXA'))
    );
    const sub = DespesasFixasService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [activeTab, filtros]);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const results = await Promise.allSettled([
        DespesasFixasService.getAll(activeTab, filtros),
        DespesasFixasService.getKpis(activeTab, filtros)
      ]);

      if (results[0].status === 'fulfilled') {
        setTitulos(results[0].value);
      } else {
        console.error('Erro ao carregar despesas fixas:', results[0].reason);
        setTitulos([]);
      }

      if (results[1].status === 'fulfilled') {
        setKpis(results[1].value);
      } else {
        console.error('Erro ao carregar KPIs de despesas fixas:', results[1].reason);
        setKpis(null);
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

    // Forçar agrupamento por status se não for TODOS e nenhum groupBy definido? 
    // Na verdade, o requisito diz que quer abas em aberto, pagos e todos.
    // Vamos seguir o padrão de Contas Pagar/Receber: se for TODOS, agrupar por status se groupBy for nenhum?
    // Mas despesas fixas já tem groupBy mes/categoria.

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
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await DespesasFixasService.delete(deleteId);
      setDeleteId(null);
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

  return (
    <div className="dc-page space-y-6 animate-in fade-in duration-200 relative">
      {toast && (
        <div data-drivecar-ui className={`fixed top-6 right-6 z-[200] px-4 py-4 rounded-xl shadow-sm animate-in slide-in-from-right duration-200 border backdrop-blur-md ${toast.type === 'success' ? 'bg-slate-900/95 text-white border-emerald-500/50' : 'bg-rose-600 text-white'
          }`}>
          <span className="font-semibold text-sm tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="dc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="dc-page-title text-xl font-semibold text-slate-900 normal-case tracking-tight leading-none">Despesas Fixas</h2>
          <p className="dc-page-subtitle text-slate-500 text-xs font-medium normal-case tracking-normal mt-2">Custos recorrentes e manutenção estrutural</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="dc-button px-4 py-4 bg-indigo-600 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-700 transition-all shadow-sm active:scale-100 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Lançar Custo Fixo
        </button>
      </div>

      <FixasKpis kpis={kpis} />

      <div className="dc-tabs">
        <button onClick={() => setActiveTab('MES_ATUAL')} className={`dc-tab px-4 py-2.5 rounded-xl text-xs whitespace-nowrap font-semibold normal-case tracking-normal transition-all ${activeTab === 'MES_ATUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mês Atual</button>
        <button onClick={() => setActiveTab('FUTUROS')} className={`dc-tab px-4 py-2.5 rounded-xl text-xs whitespace-nowrap font-semibold normal-case tracking-normal transition-all ${activeTab === 'FUTUROS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Futuros</button>
        <button onClick={() => setActiveTab('PAGO')} className={`dc-tab px-4 py-2.5 rounded-xl text-xs whitespace-nowrap font-semibold normal-case tracking-normal transition-all ${activeTab === 'PAGO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Pago</button>
        <button onClick={() => setActiveTab('PENDENTES')} className={`dc-tab px-4 py-2.5 rounded-xl text-xs whitespace-nowrap font-semibold normal-case tracking-normal transition-all ${activeTab === 'PENDENTES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Pendentes</button>
        <button onClick={() => setActiveTab('TODOS')} className={`dc-tab px-4 py-2.5 rounded-xl text-xs whitespace-nowrap font-semibold normal-case tracking-normal transition-all ${activeTab === 'TODOS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Todos</button>
      </div>

      <FixasFilters
        filtros={filtros}
        onChange={setFiltros}
        categorias={categorias}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />

      <div className="dc-panel dc-panel-frame bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        <FixasList
          items={processedData}
          loading={loading}
          isGrouped={groupBy !== 'nenhum' || activeTab === 'TODOS'}
          onPagar={(t) => setSelectedTitulo(t as any)}
          onEdit={(t) => { setTituloEditando(t); setIsFormOpen(true); }}
          onDelete={setDeleteId}
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

      {isFormOpen && (
        <DespesaFixaForm
          tituloEditando={tituloEditando}
          onClose={() => { setIsFormOpen(false); setTituloEditando(null); }}
          onSuccess={() => { 
            setIsFormOpen(false); 
            setTituloEditando(null); 
            queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] });
            loadData(true); 
            setToast({ type: 'success', message: `Despesa fixa ${tituloEditando ? 'atualizada' : 'lançada'} com sucesso!` }); 
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Estornar Despesa?"
        message="Tem certeza que deseja estornar esta despesa fixa? Se houve pagamento, o valor será devolvido ao saldo da conta bancária automaticamente."
        confirmText="Sim, Estornar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DespesasFixasPage;
