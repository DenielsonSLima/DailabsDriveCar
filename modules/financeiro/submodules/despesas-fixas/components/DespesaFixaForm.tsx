import React, { useState, useEffect } from 'react';
import { DespesasFixasService } from '../despesas-fixas.service';
import { ContasBancariasService } from '../../../../ajustes/contas-bancarias/contas.service';
import { FormasPagamentoService } from '../../../../cadastros/formas-pagamento/formas-pagamento.service';
import { TiposDespesasService } from '../../../../cadastros/tipos-despesas/tipos-despesas.service';
import { IGrupoDespesa } from '../../../../cadastros/tipos-despesas/tipos-despesas.types';
import { ITituloFixa } from '../despesas-fixas.types';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  tituloEditando?: ITituloFixa | null;
}

const DespesaFixaForm: React.FC<Props> = ({ onClose, onSuccess, tituloEditando }) => {
  const [grupos, setGrupos] = useState<IGrupoDespesa[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [formas, setFormas] = useState<any[]>([]);
  const [formaSelecionada, setFormaSelecionada] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [valorFormatado, setValorFormatado] = useState('R$ 0,00');

  const [formData, setFormData] = useState({
    data_vencimento: new Date().toISOString().split('T')[0],
    descricao: '',
    valor_total: 0,
    grupo_id: '',
    categoria_id: '',
    documento_ref: '',

    // Novos campos
    pago_avista: false,
    qtd_parcelas: 1,
    dias_intervalo: 30, // Padrão mensal
    conta_id: '',
    forma_pagamento_id: '',
  });

  useEffect(() => {
    if (tituloEditando && grupos.length > 0) {
      let grupoId = tituloEditando.grupo_id || '';

      if (!grupoId && tituloEditando.categoria_id) {
        const grupoRelacionado = grupos.find(g =>
          g.categorias?.some((c: any) => c.id === tituloEditando.categoria_id)
        );
        if (grupoRelacionado) grupoId = grupoRelacionado.id;
      }

      setFormData(prev => ({
        ...prev,
        data_vencimento: tituloEditando.data_vencimento,
        descricao: tituloEditando.descricao,
        valor_total: tituloEditando.valor_total,
        grupo_id: grupoId,
        categoria_id: tituloEditando.categoria_id || '',
        documento_ref: tituloEditando.documento_ref || '',
      }));
      setValorFormatado(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tituloEditando.valor_total));
    }
  }, [tituloEditando, grupos]);

  useEffect(() => {
    async function loadData() {
      const [gruposData, cData, fData] = await Promise.all([
        TiposDespesasService.getByTipo('FIXA'),
        ContasBancariasService.getAll(),
        FormasPagamentoService.getAll()
      ]);
      setGrupos(gruposData || []);
      setContas(cData.filter(c => c.ativo));
      setFormas(fData.filter(f => f.ativo && f.destino_lancamento !== 'CONSIGNACAO'));
    }
    loadData();
  }, []);

  useEffect(() => {
    if (formData.forma_pagamento_id && formas.length > 0) {
      const forma = formas.find(f => f.id === formData.forma_pagamento_id);
      setFormaSelecionada(forma || null);

      if (forma) {
        const isAvista = forma.destino_lancamento === 'CAIXA';
        setFormData(prev => ({
          ...prev,
          pago_avista: isAvista,
          qtd_parcelas: (isAvista || !forma.permite_parcelamento) ? 1 : prev.qtd_parcelas
        }));
      }
    } else {
      setFormaSelecionada(null);
    }
  }, [formData.forma_pagamento_id, formas]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cleaned = val.replace(/[^\d,\.]/g, '');
    if (cleaned === '' || cleaned === ',' || cleaned === '.') {
      setValorFormatado('');
      setFormData(prev => ({ ...prev, valor_total: 0 }));
      return;
    }
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      setValorFormatado(cleaned); // Mantém o que o usuário digitou (com vírgula se for o caso)
      setFormData(prev => ({ ...prev, valor_total: parsed }));
    }
  };

  const handleBlur = () => {
    setValorFormatado(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor_total)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoria_id || formData.valor_total <= 0 || !formData.descricao) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!tituloEditando) {
      if (!formData.forma_pagamento_id) {
        alert('Informe a Forma de Pagamento.');
        return;
      }

      if (formData.pago_avista && !formData.conta_id) {
        alert('Para pagamentos à vista, informe a Conta Bancária / Caixa Origem.');
        return;
      }

      if (!formData.pago_avista && formData.qtd_parcelas <= 0) {
        alert('A quantidade de parcelas deve ser maior que zero.');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (tituloEditando) {
        await DespesasFixasService.update(tituloEditando.id, formData);
      } else {
        await DespesasFixasService.save(formData);
      }
      onSuccess();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const categoriasDoGrupo = grupos.find(g => g.id === formData.grupo_id)?.categorias || [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-50 bg-slate-900 text-white shrink-0">
          <h3 className="text-xl font-black uppercase tracking-tighter">{tituloEditando ? 'Editar Custo Fixo' : 'Lançar Custo Fixo'}</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">
            Custos recorrentes e manutenção estrutural
          </p>
        </div>

        {/* Form Scrollable Area */}
        <div className="overflow-y-auto shrink p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Grupo e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Grupo
                </label>
                <select
                  required
                  value={formData.grupo_id}
                  onChange={e => setFormData({ ...formData, grupo_id: e.target.value, categoria_id: '' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none appearance-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="">Selecione o grupo...</option>
                  {grupos.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Categoria (Subgrupo)
                </label>
                <select
                  required
                  value={formData.categoria_id}
                  onChange={e => setFormData({ ...formData, categoria_id: e.target.value })}
                  disabled={!formData.grupo_id}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none appearance-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                >
                  <option value="">Selecione a categoria...</option>
                  {categoriasDoGrupo.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                Descrição / Motivo
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={e => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })}
                placeholder="Ex: Aluguel, Internet, Contador, Seguros..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-2 focus:ring-slate-500"
                required
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                Valor Total Previsto
              </label>
              <input
                type="text"
                value={valorFormatado}
                onChange={handleCurrencyChange}
                onBlur={handleBlur}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 text-2xl font-black text-slate-800 outline-none focus:border-slate-500 text-center transition-all"
                required
              />
            </div>

            {/* Forma de Pagamento */}
            {!tituloEditando && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Forma de Movimentação / Pagamento
                </label>
                <select
                  required
                  value={formData.forma_pagamento_id}
                  onChange={e => setFormData({ ...formData, forma_pagamento_id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-500 appearance-none cursor-pointer"
                >
                  <option value="">Selecione a forma de pagamento...</option>
                  {formas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
            )}

            {/* Campos Dinâmicos (Parcelado vs À Vista) */}
            {(formaSelecionada || tituloEditando) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                    {(formData.pago_avista && !tituloEditando) ? 'Data de Pagamento' : (tituloEditando ? 'Vencimento' : 'Primeiro Vencimento')}
                  </label>
                  <input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  />
                </div>

                {!formData.pago_avista && !tituloEditando && formaSelecionada?.permite_parcelamento && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                      Qtd. de Parcelas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formaSelecionada?.qtd_max_parcelas || 120}
                      value={formData.qtd_parcelas}
                      onChange={e => setFormData({ ...formData, qtd_parcelas: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {!formData.pago_avista && formData.qtd_parcelas > 1 && !tituloEditando && formaSelecionada?.permite_parcelamento && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                  Intervalo entre Parcelas (Dias)
                </label>
                <select
                  value={formData.dias_intervalo}
                  onChange={e => setFormData({ ...formData, dias_intervalo: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none appearance-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                >
                  <option value={30}>Mensal (30 dias)</option>
                  <option value={15}>Quinzenal (15 dias)</option>
                  <option value={7}>Semanal (7 dias)</option>
                  <option value={365}>Anual (365 dias)</option>
                </select>
              </div>
            )}

            {formData.pago_avista && !tituloEditando && (
              <div className="space-y-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div>
                  <label className="block text-[10px] font-black text-emerald-700 uppercase mb-2 ml-1">
                    Conta Bancária / Caixa Origem
                  </label>
                  <select
                    required={formData.pago_avista}
                    value={formData.conta_id}
                    onChange={e => setFormData({ ...formData, conta_id: e.target.value })}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="">Selecione a conta...</option>
                    {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} - {c.titular} | Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saldo_atual || 0)}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Documento Referência */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                Documento / Referência <span className="text-slate-300">(opcional)</span>
              </label>
              <input
                type="text"
                value={formData.documento_ref}
                onChange={e => setFormData({ ...formData, documento_ref: e.target.value })}
                placeholder="Ex: NF-1234, Boleto-5678..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 pb-2">
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
                className={`flex-1 py-4 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center ${formData.pago_avista ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
              >
                {isSaving ? 'Gravando...' : (tituloEditando ? 'Salvar Alterações' : (formData.pago_avista ? 'Liquidar Lançamento' : 'Confirmar Lançamento'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DespesaFixaForm;
