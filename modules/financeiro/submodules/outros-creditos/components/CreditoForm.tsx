import React, { useState, useEffect } from 'react';
import { ContasBancariasService } from '../../../../ajustes/contas-bancarias/contas.service';
import { SociosService } from '../../../../ajustes/socios/socios.service';
import { OutrosCreditosService } from '../outros-creditos.service';
import { ITituloCredito } from '../outros-creditos.types';

interface ISocioSplit {
  socio_id: string;
  nome: string;
  porcentagem: number;
  valor: number;
}

interface Props {
  editData?: ITituloCredito;
  onClose: () => void;
  onSuccess: () => void;
}

const CreditoForm: React.FC<Props> = ({ editData, onClose, onSuccess }) => {
  const isEditing = !!editData;
  const [contas, setContas] = useState<any[]>([]);
  const [sociosDisponiveis, setSociosDisponiveis] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [valorFormatado, setValorFormatado] = useState(
    editData ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editData.valor_total) : 'R$ 0,00'
  );
  const [dividirSocios, setDividirSocios] = useState(false);
  const [sociosVinculados, setSociosVinculados] = useState<ISocioSplit[]>([]);

  const [formData, setFormData] = useState({
    data_vencimento: editData?.data_vencimento || new Date().toISOString().split('T')[0],
    descricao: editData?.descricao || '',
    valor_total: editData?.valor_total || 0,
    conta_id: editData?.transacoes?.[0]?.conta_origem ? '' : '',
    documento_ref: editData?.documento_ref || '',
  });

  useEffect(() => {
    Promise.all([
      ContasBancariasService.getAll(),
      SociosService.getAll(),
    ]).then(([cData, sData]) => {
      setContas(cData.filter(c => c.ativo));
      setSociosDisponiveis(sData.filter(s => s.ativo));
    });
  }, []);

  // Recalculate valores when valor_total changes
  useEffect(() => {
    if (sociosVinculados.length > 0 && formData.valor_total >= 0) {
      const recalculado = sociosVinculados.map(s => ({
        ...s,
        valor: parseFloat(((s.porcentagem / 100) * formData.valor_total).toFixed(2))
      }));
      if (JSON.stringify(recalculado) !== JSON.stringify(sociosVinculados)) {
        setSociosVinculados(recalculado);
      }
    }
  }, [formData.valor_total]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    const numericValue = Number(value) / 100;
    setValorFormatado(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue)
    );
    setFormData(prev => ({ ...prev, valor_total: numericValue }));
  };

  const toggleSocio = (socio: any) => {
    const exists = sociosVinculados.some(s => s.socio_id === socio.id);
    if (exists) {
      setSociosVinculados(sociosVinculados.filter(s => s.socio_id !== socio.id));
    } else {
      setSociosVinculados([...sociosVinculados, {
        socio_id: socio.id,
        nome: socio.nome,
        porcentagem: 0,
        valor: 0
      }]);
    }
  };

  const dividirIgualmente = () => {
    if (sociosVinculados.length === 0) return;
    const count = sociosVinculados.length;
    const basePercent = Math.floor((100 / count) * 100) / 100;
    const leftover = parseFloat((100 - (basePercent * count)).toFixed(2));
    const novos = sociosVinculados.map((s, i) => {
      const p = i === count - 1 ? parseFloat((basePercent + leftover).toFixed(2)) : basePercent;
      return { ...s, porcentagem: p, valor: parseFloat(((p / 100) * formData.valor_total).toFixed(2)) };
    });
    setSociosVinculados(novos);
  };

  const updateSocioPorcentagem = (socioId: string, value: string) => {
    const totalOutros = sociosVinculados.filter(s => s.socio_id !== socioId).reduce((acc, s) => acc + s.porcentagem, 0);
    let pNum = parseFloat(value || '0');
    if (pNum + totalOutros > 100) pNum = 100 - totalOutros;
    pNum = isNaN(pNum) ? 0 : Math.max(0, parseFloat(pNum.toFixed(2)));
    const novoValor = parseFloat(((pNum / 100) * formData.valor_total).toFixed(2));
    setSociosVinculados(sociosVinculados.map(s =>
      s.socio_id === socioId ? { ...s, porcentagem: pNum, valor: novoValor } : s
    ));
  };

  const totalPorcentagem = parseFloat(sociosVinculados.reduce((acc, s) => acc + s.porcentagem, 0).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      // Edit mode: only update description, date, document
      if (!formData.descricao.trim()) { alert('Informe a descrição.'); return; }
      setIsSaving(true);
      try {
        await OutrosCreditosService.update(editData!.id, {
          descricao: formData.descricao,
          data_vencimento: formData.data_vencimento,
          documento_ref: formData.documento_ref,
        });
        onSuccess();
      } catch (err: any) {
        alert('Erro ao atualizar: ' + err.message);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Create mode
    if (formData.valor_total <= 0) {
      alert('Informe um valor maior que zero.');
      return;
    }
    if (!formData.conta_id) {
      alert('Selecione uma conta bancária de destino.');
      return;
    }
    if (dividirSocios && sociosVinculados.length === 0) {
      alert('Selecione pelo menos um sócio para dividir.');
      return;
    }
    if (dividirSocios && totalPorcentagem < 99.99) {
      alert('A soma das porcentagens deve ser 100%.');
      return;
    }

    setIsSaving(true);
    try {
      await OutrosCreditosService.save({
        ...formData,
        socios: dividirSocios ? sociosVinculados.map(s => ({
          socio_id: s.socio_id,
          valor: s.valor,
          porcentagem: s.porcentagem,
        })) : undefined,
      });
      onSuccess();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const gradients = [
    'from-indigo-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-purple-500 to-violet-500',
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 bg-teal-600 text-white shrink-0">
          <h3 className="text-xl font-black uppercase tracking-tighter">{isEditing ? 'Editar Crédito' : 'Lançar Crédito'}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
            {isEditing ? 'Alterar dados do crédito lançado' : 'Aportes, rendimentos e entradas extraordinárias'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
          {/* Data + Valor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={formData.data_vencimento}
                onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                Valor
              </label>
              <input
                type="text"
                value={valorFormatado}
                onChange={handleCurrencyChange}
                className="w-full bg-white border-2 border-teal-100 rounded-2xl px-5 py-3.5 text-lg font-black text-teal-600 outline-none focus:border-teal-500 text-center"
                required
              />
            </div>
          </div>

          {/* Conta Bancária de Destino - OBRIGATÓRIA */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
              Conta Bancária de Destino
            </label>
            <select
              required
              value={formData.conta_id}
              onChange={e => setFormData({ ...formData, conta_id: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-[#111827] outline-none appearance-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Selecione a conta...</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.banco_nome} - Saldo:{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saldo_atual || 0)}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
              Descrição / Motivo
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })}
              placeholder="Ex: Rendimento aplicação, aporte sócio, bonificação..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Documento Referência */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
              Documento / Referência <span className="text-slate-300">(opcional)</span>
            </label>
            <input
              type="text"
              value={formData.documento_ref}
              onChange={e => setFormData({ ...formData, documento_ref: e.target.value })}
              placeholder="Ex: NF-1234, TED-5678..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Toggle Dividir Sócios */}
          <div
            className={`border-2 rounded-2xl p-4 transition-all cursor-pointer ${dividirSocios ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50'}`}
            onClick={() => { setDividirSocios(!dividirSocios); if (dividirSocios) setSociosVinculados([]); }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-6 rounded-full flex items-center transition-all duration-300 ${dividirSocios ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md mx-0.5 transition-transform`} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Dividir entre Sócios</p>
                  <p className="text-[9px] text-slate-400 font-bold">Distribuir o valor entre os sócios da empresa</p>
                </div>
              </div>
              {dividirSocios && (
                <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg uppercase tracking-widest">
                  Ativo
                </span>
              )}
            </div>
          </div>

          {/* Partner Split Section */}
          {dividirSocios && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Progress Bar */}
              {sociosVinculados.length > 0 && (
                <div className="bg-slate-900 rounded-2xl p-4 text-white">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Alocado</p>
                      <h4 className="text-xl font-black tracking-tight">
                        {totalPorcentagem.toFixed(1)}<span className="text-xs text-indigo-400 ml-0.5">%</span>
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Livre</p>
                      <h4 className={`text-xl font-black tracking-tight ${(100 - totalPorcentagem) <= 0.01 ? 'text-slate-600' : 'text-emerald-400'}`}>
                        {Math.max(0, 100 - totalPorcentagem).toFixed(1)}<span className="text-xs opacity-50 ml-0.5">%</span>
                      </h4>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    {sociosVinculados.map((s, i) => (
                      <div
                        key={s.socio_id}
                        className={`h-full bg-gradient-to-r ${gradients[i % gradients.length]}`}
                        style={{ width: `${s.porcentagem}%`, transition: 'width 0.3s ease' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {sociosVinculados.length >= 2 && (
                <button
                  type="button"
                  onClick={dividirIgualmente}
                  className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-indigo-200/50 transition-all"
                >
                  ⚡ Dividir Igualmente
                </button>
              )}

              {/* Partner List */}
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {sociosDisponiveis.map((socio) => {
                  const vinculado = sociosVinculados.find(v => v.socio_id === socio.id);

                  return (
                    <div
                      key={socio.id}
                      className={`border-2 rounded-2xl p-4 transition-all duration-200 ${vinculado
                        ? 'bg-white border-indigo-100 shadow-lg'
                        : 'bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-100'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleSocio(socio)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${vinculado
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                              : 'border-slate-200 bg-white hover:border-indigo-400'
                              }`}
                          >
                            {vinculado && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <p className={`text-xs font-black uppercase tracking-tight truncate ${vinculado ? 'text-slate-900' : 'text-slate-400'}`}>
                            {socio.nome}
                          </p>
                        </div>

                        {vinculado && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vinculado.valor)}
                            </span>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={vinculado.porcentagem === 0 ? '' : vinculado.porcentagem.toString()}
                                onChange={(e) => updateSocioPorcentagem(socio.id, e.target.value)}
                                className="w-16 bg-indigo-50/50 border border-indigo-100 rounded-xl py-1.5 pl-2 pr-6 text-xs font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                                placeholder="0"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400">%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-slate-500 font-black text-xs uppercase bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-4 bg-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center"
            >
              {isSaving ? 'Gravando...' : isEditing ? 'Salvar Alterações' : 'Confirmar Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditoForm;
