
import React, { useState, useEffect, useMemo } from 'react';
import { RetiradasService } from './retiradas.service';
import { IRetirada, RetiradaTab, IRetiradaFiltros, GroupByRetirada } from './retiradas.types';
import { SociosService } from '../../../ajustes/socios/socios.service';
import RetiradasKpis from './components/RetiradasKpis';
import RetiradasFilters from './components/RetiradasFilters';
import RetiradasList from './components/RetiradasList';
import RetiradaForm from './components/RetiradaForm';
import ConfirmModal from '../../../../components/ConfirmModal';

const RetiradasSociosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RetiradaTab>('MES_ATUAL');
  const [retiradas, setRetiradas] = useState<IRetirada[]>([]);
  const [socios, setSocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupByRetirada>('socio');

  const [filtros, setFiltros] = useState<IRetiradaFiltros>({
    busca: '',
    dataInicio: '',
    dataFim: '',
    socioId: '',
    tipo: ''
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<IRetirada | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [saldosSocios, setSaldosSocios] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'OUTROS') setGroupBy('mes');
    else setGroupBy('socio');
  }, [activeTab]);

  useEffect(() => {
    loadData();
    SociosService.getAll().then(setSocios);
    const sub = RetiradasService.subscribe(() => loadData(true));
    return () => { sub.unsubscribe(); };
  }, [activeTab, filtros]);

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [data, saldos] = await Promise.all([
        RetiradasService.getAll(activeTab, filtros),
        RetiradasService.getSaldosSocios()
      ]);
      setRetiradas(data);
      setSaldosSocios(saldos);
    } finally {
      setLoading(false);
    }
  }

  const processedData = useMemo(() => {
    if (groupBy === 'nenhum') return retiradas;

    return retiradas.reduce((acc: any, r) => {
      let key = 'Diversos';
      if (groupBy === 'mes') {
        const d = new Date(r.data);
        key = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
      } else if (groupBy === 'socio') {
        key = r.socio?.nome || 'SÓCIO NÃO IDENTIFICADO';
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
  }, [retiradas, groupBy]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await RetiradasService.delete(deleteId);
      setDeleteId(null);
      setToast({ type: 'success', message: 'Retirada estornada com sucesso!' });
      loadData(true);
    } catch (e) {
      setToast({ type: 'error', message: 'Erro ao estornar lançamento.' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleEdit = (retirada: IRetirada) => {
    setEditItem(retirada);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditItem(null);
    setIsFormOpen(true);
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
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Retiradas de Sócios</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Distribuição de dividendos e pró-labore</p>
        </div>

        <button
          onClick={handleNew}
          className="px-8 py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl active:scale-95 flex items-center shadow-amber-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Lançar Retirada
        </button>
      </div>

      <RetiradasKpis retiradas={retiradas} saldosSocios={saldosSocios} />

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm">
        <button onClick={() => setActiveTab('MES_ATUAL')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MES_ATUAL' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Mês Atual</button>
        <button onClick={() => setActiveTab('OUTROS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'OUTROS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Todos os Meses</button>
      </div>

      <RetiradasFilters
        filtros={filtros}
        onChange={setFiltros}
        socios={socios}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
      />

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <RetiradasList
          items={processedData}
          loading={loading}
          isGrouped={groupBy !== 'nenhum'}
          onEdit={handleEdit}
          onDelete={setDeleteId}
        />
      </div>

      {isFormOpen && (
        <RetiradaForm
          editItem={editItem}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => { setIsFormOpen(false); loadData(true); setToast({ type: 'success', message: 'Lançamento salvo com sucesso!' }); }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Estornar Retirada?"
        message="Deseja realmente apagar este lançamento? O valor será devolvido ao saldo da conta bancária de origem automaticamente."
        confirmText="Sim, Estornar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RetiradasSociosPage;
