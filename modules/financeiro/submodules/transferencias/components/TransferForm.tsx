import React, { useState, useEffect } from 'react';
import { ContasBancariasService } from '../../../../ajustes/contas-bancarias/contas.service';
import { TransferenciasService } from '../transferencias.service';
import { IContaBancaria } from '../../../../ajustes/contas-bancarias/contas.types';
import { ITransferencia } from '../transferencias.types';

interface Props {
  initialData?: ITransferencia | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TransferForm: React.FC<Props> = ({ initialData, onClose, onSuccess }) => {
  const [contas, setContas] = useState<IContaBancaria[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [valorFormatado, setValorFormatado] = useState('R$ 0,00');

  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    data: new Date().toISOString().split('T')[0],
    descricao: 'Movimentação entre contas',
    valor: 0,
    conta_origem_id: '',
    conta_destino_id: ''
  });

  useEffect(() => {
    ContasBancariasService.getAll().then(data => setContas(data.filter(c => c.ativo)));

    if (initialData) {
      setFormData({
        id: initialData.id,
        data: initialData.data,
        descricao: initialData.descricao,
        valor: initialData.valor,
        conta_origem_id: initialData.conta_origem_id,
        conta_destino_id: initialData.conta_destino_id
      });
      setValorFormatado(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialData.valor));
    }
  }, [initialData]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    const numericValue = Number(value) / 100;
    setValorFormatado(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue));
    setFormData(prev => ({ ...prev, valor: numericValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.conta_origem_id || !formData.conta_destino_id || formData.valor <= 0) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    if (formData.conta_origem_id === formData.conta_destino_id) {
      alert("A conta de destino deve ser diferente da conta de origem.");
      return;
    }

    setIsSaving(true);
    try {
      await TransferenciasService.save(formData);
      onSuccess();
    } catch (err: any) {
      alert("Erro ao salvar transferência: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              {initialData ? 'Editar Movimentação' : 'Nova Movimentação'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ajuste de saldo entre carteiras</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Data</label>
              <input type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Valor</label>
              <input type="text" value={valorFormatado} onChange={handleCurrencyChange} className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-5 py-3.5 text-lg font-black text-indigo-600 outline-none focus:border-indigo-500 text-center" required />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Descrição</label>
            <input type="text" value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <label className="block text-[10px] font-black text-rose-500 uppercase mb-2 ml-1 tracking-widest">Origem (SAÍDA)</label>
              <select required value={formData.conta_origem_id} onChange={e => setFormData({ ...formData, conta_origem_id: e.target.value })} className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-xs font-bold text-rose-700 outline-none">
                <option value="">Selecione...</option>
                {contas.map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={c.id === formData.conta_destino_id}
                  >
                    {c.banco_nome} - {c.titular} | Saldo: {formatCurrency(c.saldo_atual || 0)}
                    {c.id === formData.conta_destino_id && ' (Já selecionada)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <label className="block text-[10px] font-black text-emerald-500 uppercase mb-2 ml-1 tracking-widest">Destino (ENTRADA)</label>
              <select required value={formData.conta_destino_id} onChange={e => setFormData({ ...formData, conta_destino_id: e.target.value })} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-xs font-bold text-emerald-700 outline-none">
                <option value="">Selecione...</option>
                {contas.map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={c.id === formData.conta_origem_id}
                  >
                    {c.banco_nome} - {c.titular} | Saldo: {formatCurrency(c.saldo_atual || 0)}
                    {c.id === formData.conta_origem_id && ' (Já selecionada)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={isSaving} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center space-x-3">
            {isSaving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Confirmar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransferForm;
