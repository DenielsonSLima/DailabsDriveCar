import React, { useState, useEffect, useCallback } from 'react';
import { AnotacoesService } from './anotacoes.service';
import { IAnotacao, IAnotacaoForm } from './anotacoes.types';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (iso: string) => {
  // data vem como YYYY-MM-DD do banco
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const EMPTY_FORM: IAnotacaoForm = { data: todayISO(), descricao: '', valor: '' };

const AnotacoesPage: React.FC = () => {
  const [anotacoes, setAnotacoes] = useState<IAnotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<IAnotacaoForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AnotacoesService.getAll();
      setAnotacoes(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar anotações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleEdit = (a: IAnotacao) => {
    setEditingId(a.id);
    setForm({
      data: a.data.split('T')[0],
      descricao: a.descricao,
      valor: a.valor !== null ? String(a.valor).replace('.', ',') : '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricao.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await AnotacoesService.update(editingId, form);
      } else {
        await AnotacoesService.create(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar anotação.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await AnotacoesService.delete(id);
      await load();
    } catch (e: any) {
      setError(e.message || 'Erro ao excluir anotação.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Anotações</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
            Registros livres — sem movimentação financeira • Aparecem no PDF do Caixa
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center space-x-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nova Anotação</span>
        </button>
      </div>

      {/* Info badge */}
      <div className="flex items-start gap-3 bg-violet-50 border border-violet-200 rounded-2xl px-5 py-4">
        <svg className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <div>
          <p className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Como funciona</p>
          <p className="text-[11px] text-violet-600 mt-0.5 leading-relaxed">
            Anotações são registros informativos com data, descrição e valor (opcional). Elas <strong>não movimentam</strong> nenhuma conta financeira e aparecem como seção separada no PDF do Caixa.
          </p>
        </div>
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div className="bg-white border border-violet-200 rounded-2xl p-6 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-5">
            {editingId ? '✏️ Editar Anotação' : '+ Nova Anotação'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Data */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Data <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                />
              </div>
              {/* Valor (opcional) */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Valor <span className="text-slate-400 font-medium normal-case">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    placeholder="0,00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-[12px] font-semibold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            {/* Descrição */}
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Descrição <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                required
                rows={3}
                placeholder="Descreva a anotação com detalhes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all resize-none"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-[11px] font-bold text-rose-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !form.descricao.trim()}
                className="flex items-center space-x-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span>{saving ? 'Salvando...' : 'Salvar Anotação'}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-14 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-50 rounded w-1/2" />
                </div>
                <div className="w-24 h-8 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : anotacoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma anotação</h3>
          <p className="text-[10px] text-slate-300 mt-1">Clique em "Nova Anotação" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anotacoes.map(a => (
            <div
              key={a.id}
              className="group bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all duration-200 px-5 py-4"
            >
              <div className="flex items-start gap-4">
                {/* Data badge */}
                <div className="shrink-0 bg-violet-50 rounded-xl px-3 py-2 text-center min-w-[56px]">
                  <p className="text-[18px] font-black text-violet-600 leading-none">{fmtDate(a.data).split('/')[0]}</p>
                  <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mt-0.5">
                    {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(fmtDate(a.data).split('/')[1]) - 1]}
                  </p>
                  <p className="text-[8px] font-bold text-violet-300">/{fmtDate(a.data).split('/')[2]}</p>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 leading-snug">{a.descricao}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Registrado em {new Date(a.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Valor e Ações */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {a.valor !== null && (
                    <span className="text-[13px] font-black text-emerald-600">{fmt(a.valor)}</span>
                  )}
                  {a.valor === null && (
                    <span className="text-[10px] font-bold text-slate-300 italic">sem valor</span>
                  )}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(a)}
                      className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-violet-100 hover:text-violet-600 transition-colors"
                      title="Editar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-rose-100 hover:text-rose-600 transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      {deletingId === a.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnotacoesPage;
