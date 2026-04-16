
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IFormaPagamento, DestinoLancamento, TipoMovimentacao } from '../formas-pagamento.types';

interface Props {
  initialData: IFormaPagamento | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IFormaPagamento>) => void;
}

const FormasPagamentoForm: React.FC<Props> = ({ initialData, isSaving, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<IFormaPagamento>>({
    nome: '',
    tipo_movimentacao: 'PAGAMENTO', // Default para Pagamento (mais comum para Consignação)
    destino_lancamento: 'CAIXA',
    permite_parcelamento: false,
    qtd_max_parcelas: 1,
    observacoes: '',
    ativo: true,
    ...initialData
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'qtd_max_parcelas' ? Number(val) : (typeof val === 'string' ? val.toUpperCase() : val)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim()) return;
    onSubmit(formData);
  };

  // Lógica de Dicas Contextuais
  const getHint = (tipo: TipoMovimentacao, destino: DestinoLancamento) => {
    if (destino === 'CONSIGNACAO') return '💡 Modo Consignação: O sistema cria uma obrigação financeira pendente que só será liberada para pagamento após a venda do veículo associado.';

    if (tipo === 'RECEBIMENTO') {
      if (destino === 'CONTAS_RECEBER') return 'Ideal para: Cartão de Crédito, Boleto Bancário, Crediário Próprio. O valor não entra no caixa imediatamente.';
      if (destino === 'CAIXA') return 'Ideal para: Dinheiro, PIX, Débito. O valor fica disponível para uso no mesmo instante.';
      if (destino === 'ATIVO') return 'Ideal para: Troca. O veículo entra no estoque como parte do pagamento.';
    }
    if (tipo === 'PAGAMENTO') {
      if (destino === 'CONTAS_PAGAR') return 'Ideal para: Cartão Corporativo, Boleto de Fornecedor. Gera uma obrigação a pagar no futuro.';
      if (destino === 'CAIXA') return 'Ideal para: Pagamentos à vista com dinheiro do caixa ou transferência imediata.';
    }
    if (tipo === 'AMBOS') {
      if (destino === 'CAIXA') return 'Perfeito para: Dinheiro em Espécie e PIX. O sistema debita ou credita o caixa dependendo da operação.';
    }
    if (destino === 'NENHUM') return 'Uso apenas para registro. Não gera movimentação no módulo financeiro.';

    return null;
  };

  const currentHint = getHint(formData.tipo_movimentacao as TipoMovimentacao, formData.destino_lancamento as DestinoLancamento);
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {initialData ? 'Editar Regra' : 'Nova Regra Financeira'}
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Configuração de Pagamento/Recebimento</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Nome */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome da Modalidade</label>
            <input
              autoFocus
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              disabled={isSaving}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
              placeholder="Ex: Consignação, PIX, Dinheiro..."
              required
            />
          </div>

          {/* Tipo de Movimentação */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classificação da Movimentação</label>
            <div className="grid grid-cols-3 gap-4">
              <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${formData.tipo_movimentacao === 'RECEBIMENTO' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                <input type="radio" name="tipo_movimentacao" value="RECEBIMENTO" checked={formData.tipo_movimentacao === 'RECEBIMENTO'} onChange={handleChange} className="sr-only" />
                <span className="font-black text-xs uppercase mb-1">Recebimento</span>
                <span className="text-[9px] text-center opacity-70">Entrada de Valor</span>
              </label>

              <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${formData.tipo_movimentacao === 'PAGAMENTO' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                <input type="radio" name="tipo_movimentacao" value="PAGAMENTO" checked={formData.tipo_movimentacao === 'PAGAMENTO'} onChange={handleChange} className="sr-only" />
                <span className="font-black text-xs uppercase mb-1">Pagamento</span>
                <span className="text-[9px] text-center opacity-70">Saída de Valor</span>
              </label>

              <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${formData.tipo_movimentacao === 'AMBOS' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                <input type="radio" name="tipo_movimentacao" value="AMBOS" checked={formData.tipo_movimentacao === 'AMBOS'} onChange={handleChange} className="sr-only" />
                <span className="font-black text-xs uppercase mb-1">Ambos</span>
                <span className="text-[9px] text-center opacity-70">Entrada/Saída</span>
              </label>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Configurações Financeiras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Destino do Lançamento */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Destino Financeiro</label>
              <div className="relative">
                <select
                  name="destino_lancamento"
                  value={formData.destino_lancamento}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="CAIXA">Caixa Imediato (Disponível na hora)</option>
                  <option value="CONTAS_RECEBER">Contas a Receber (Gera título)</option>
                  <option value="CONTAS_PAGAR">Contas a Pagar (Gera obrigação)</option>
                  <option value="CONSIGNACAO">Consignação (Pagamento vinculado à venda)</option>
                  <option value="ATIVO">Ativo / Estoque (Entrada de Bem)</option>
                  <option value="NENHUM">Nada Financeiro (Apenas registro)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Dica Dinâmica */}
              {currentHint && (
                <div className={`mt-3 flex items-start space-x-2 p-3 rounded-xl border ${formData.destino_lancamento === 'CONSIGNACAO' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50/50 border-blue-100'}`}>
                  <svg className={`w-4 h-4 shrink-0 mt-0.5 ${formData.destino_lancamento === 'CONSIGNACAO' ? 'text-amber-500' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className={`text-[10px] font-medium leading-relaxed ${formData.destino_lancamento === 'CONSIGNACAO' ? 'text-amber-700' : 'text-blue-600'}`}>
                    {currentHint}
                  </p>
                </div>
              )}
            </div>

            {/* Parcelamento - Escondido se Consignação */}
            {formData.destino_lancamento !== 'CONSIGNACAO' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Permite Parcelamento?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="permite_parcelamento" checked={formData.permite_parcelamento} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
              </div>
            )}

            {/* Condicional de Parcelamento */}
            {formData.permite_parcelamento && formData.destino_lancamento !== 'CONSIGNACAO' && (
              <div className="animate-in slide-in-from-left-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Max. Parcelas</label>
                <input
                  type="number"
                  name="qtd_max_parcelas"
                  value={formData.qtd_max_parcelas}
                  onChange={handleChange}
                  min={1}
                  max={120}
                  className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-4 py-2.5 text-sm font-black text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Observações Internas</label>
              <textarea
                name="observacoes"
                value={formData.observacoes || ''}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                placeholder="Ex: Utilizar apenas para clientes com cadastro aprovado..."
              />
            </div>

          </div>

        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-white rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50 min-w-[140px] flex items-center justify-center hover:bg-indigo-700 transition-all"
          >
            {isSaving ? 'Salvando...' : 'Salvar Regra'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default FormasPagamentoForm;
