
import React, { useState, useEffect } from 'react';
import { IFormaPagamento } from '../../formas-pagamento/formas-pagamento.types';
import { ICondicaoRecebimento } from '../condicoes-recebimento.types';
import { CondicoesRecebimentoService } from '../condicoes-recebimento.service';

interface Props {
  forma: IFormaPagamento;
  onBack: () => void;
}

const ReceiptConditionManager: React.FC<Props> = ({ forma, onBack }) => {
  const [condicoes, setCondicoes] = useState<ICondicaoRecebimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ICondicaoRecebimento>>({
    nome: '',
    qtd_parcelas: 1,
    dias_primeira_parcela: 0,
    dias_entre_parcelas: 0, // Default 0 para ativos
    ativo: true
  });

  // Verifica se é uma movimentação de Ativo (não financeira pura)
  const isAtivoOrNone = forma.destino_lancamento === 'ATIVO' || forma.destino_lancamento === 'NENHUM';

  useEffect(() => {
    loadCondicoes();
    const sub = CondicoesRecebimentoService.subscribe(forma.id, () => loadCondicoes());
    return () => { sub.unsubscribe(); };
  }, [forma.id]);

  const loadCondicoes = async () => {
    const data = await CondicoesRecebimentoService.getByFormaPagamento(forma.id);
    setCondicoes(data);
    setLoading(false);
  };

  const handleEdit = (c: ICondicaoRecebimento) => {
    setEditingId(c.id);
    setFormData(c);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      qtd_parcelas: 1,
      dias_primeira_parcela: 0,
      dias_entre_parcelas: 0,
      ativo: true
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta condição?')) {
      await CondicoesRecebimentoService.remove(id);
    }
  };

  const handleToggleStatus = async (c: ICondicaoRecebimento) => {
    try {
      await CondicoesRecebimentoService.toggleStatus(c.id, c.ativo);
    } catch (error) {
      alert('Erro ao alterar status.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await CondicoesRecebimentoService.save({
        ...formData,
        // Força valores padrão para Ativos se o usuário tentar burlar
        qtd_parcelas: isAtivoOrNone ? 1 : formData.qtd_parcelas,
        dias_entre_parcelas: isAtivoOrNone ? 0 : formData.dias_entre_parcelas,
        forma_pagamento_id: forma.id,
        id: editingId || undefined
      });
      handleCancelEdit();
    } catch (error) {
      alert('Erro ao salvar regra.');
    }
  };

  // Sugestão de nome automático
  useEffect(() => {
    if (!editingId) {
      let nomeSugerido = '';

      if (isAtivoOrNone) {
        // Lógica de nome para Ativos (Carros, Imóveis)
        nomeSugerido = formData.dias_primeira_parcela === 0
          ? 'Entrega Imediata'
          : `Entrega em ${formData.dias_primeira_parcela} Dias`;
      } else {
        // Lógica Financeira (Boletos, Cartão)
        if (formData.qtd_parcelas === 1) {
          nomeSugerido = formData.dias_primeira_parcela === 0 ? 'À Vista' : `${formData.dias_primeira_parcela} Dias Direto`;
        } else {
          nomeSugerido = `${formData.qtd_parcelas}x (A cada ${formData.dias_entre_parcelas} dias)`;
        }
      }

      if (nomeSugerido) {
        setFormData(prev => ({ ...prev, nome: nomeSugerido }));
      }
    }
  }, [formData.qtd_parcelas, formData.dias_primeira_parcela, formData.dias_entre_parcelas, editingId, isAtivoOrNone]);

  return (
    <div className="animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={onBack}
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isAtivoOrNone ? 'Condições de Entrega/Entrada' : 'Condições de Recebimento'}
          </p>
          <h2 className="text-3xl font-black text-slate-900 leading-none mt-1">{forma.nome}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Lista */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div></div>
          ) : condicoes.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhuma regra definida.</p>
              <p className="text-slate-400 text-xs mt-1">
                {isAtivoOrNone
                  ? 'Defina se a entrada do veículo é imediata ou agendada.'
                  : 'Crie regras como "À Vista", "30/60 Dias", etc.'}
              </p>
            </div>
          ) : (
            condicoes.map(c => (
              <div key={c.id} className={`bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center group hover:border-emerald-300 transition-all hover:shadow-md ${!c.ativo ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-slate-800 text-lg">{c.nome}</h4>
                    {!c.ativo && <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded uppercase">Inativo</span>}
                  </div>

                  <div className="flex items-center space-x-2 mt-2">
                    {!isAtivoOrNone && (
                      <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 font-black uppercase tracking-wide">{c.qtd_parcelas}x Parcelas</span>
                    )}

                    {!isAtivoOrNone && c.qtd_parcelas > 1 && (
                      <span className="text-[10px] text-slate-400 font-bold">Intervalo: {c.dias_entre_parcelas} dias</span>
                    )}

                    {c.dias_primeira_parcela === 0 ? (
                      <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wide">
                        Entrada Imediata
                      </span>
                    ) : (
                      <span className="text-[10px] text-indigo-600 font-black bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wide">
                        {isAtivoOrNone ? `Entra em ${c.dias_primeira_parcela} dias` : `1ª em ${c.dias_primeira_parcela} dias`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleStatus(c)}
                    className={`p-2.5 rounded-xl transition-all ${c.ativo ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                    title={c.ativo ? 'Desativar Regra' : 'Ativar Regra'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button onClick={() => handleEdit(c)} className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulário */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl sticky top-6">

            {/* Form Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <h3 className="text-lg font-black uppercase text-slate-900 tracking-tighter">
                  {editingId ? 'Editar Regra' : 'Nova Regra'}
                </h3>
              </div>

              {/* Status Toggle in Form */}
              <label className="flex items-center cursor-pointer space-x-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.ativo ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formData.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <div className="relative">
                  <input type="checkbox" checked={formData.ativo} onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </label>
            </div>

            {isAtivoOrNone && (
              <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start space-x-3">
                <svg className="w-5 h-5 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-xs text-indigo-800 leading-relaxed">
                  <span className="font-bold">Modo Ativo/Estoque:</span> Como este item representa um bem físico (ex: Veículo), as opções de parcelamento foram ocultadas. Configure apenas o prazo de entrada.
                </div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">

              {!isAtivoOrNone && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Qtd. Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="360"
                      value={formData.qtd_parcelas}
                      onChange={e => setFormData(prev => ({ ...prev, qtd_parcelas: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-center focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-[#111827]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Dias p/ 1ª</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.dias_primeira_parcela}
                      onChange={e => setFormData(prev => ({ ...prev, dias_primeira_parcela: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-center focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-[#111827]"
                    />
                  </div>
                </div>
              )}

              {isAtivoOrNone && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Dias para Entrega/Posse</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.dias_primeira_parcela}
                      onChange={e => setFormData(prev => ({ ...prev, dias_primeira_parcela: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-[#111827] pl-12"
                    />
                    <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">Dias:</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 ml-1">0 = Entrega Imediata (No ato da negociação)</p>
                </div>
              )}

              {!isAtivoOrNone && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Intervalo (Dias)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={formData.qtd_parcelas === 1}
                    value={formData.dias_entre_parcelas}
                    onChange={e => setFormData(prev => ({ ...prev, dias_entre_parcelas: Number(e.target.value) }))}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-black text-center focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-slate-100 transition-all text-[#111827]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome (Exibição)</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder={isAtivoOrNone ? "Ex: Entrega Imediata" : "Ex: Entrada + 30 Dias"}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                {editingId && (
                  <button type="button" onClick={handleCancelEdit} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
                )}
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95">
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceiptConditionManager;
