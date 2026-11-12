import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { FinanceiroService } from '../../../financeiro/financeiro.service';
import { FormasPagamentoService } from '../../../cadastros/formas-pagamento/formas-pagamento.service';
import { ContasBancariasService } from '../../../ajustes/contas-bancarias/contas.service';
import { ICategoriaFinanceira } from '../../../financeiro/financeiro.types';
import { IFormaPagamento } from '../../../cadastros/formas-pagamento/formas-pagamento.types';
import { IContaBancaria } from '../../../ajustes/contas-bancarias/contas.types';
import { IVeiculoDespesa } from '../../estoque.types';

interface IParcelaDespesa {
  id_temp: string;
  numero: number;
  vencimento: string;
  valor: number;
}

interface Props {
  onClose: () => void;
  onSubmit: (data: Partial<IVeiculoDespesa>[]) => void;
}

const ExpenseForm: React.FC<Props> = ({ onClose, onSubmit }) => {
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<ICategoriaFinanceira[]>([]);
  const [formas, setFormas] = useState<IFormaPagamento[]>([]);
  const [contas, setContas] = useState<IContaBancaria[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Estado Principal
  const [valorTotalStr, setValorTotalStr] = useState('R$ 0,00');
  const [qtdParcelas, setQtdParcelas] = useState(1);
  const [formaId, setFormaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [contaId, setContaId] = useState('');
  const [dataOperacao, setDataOperacao] = useState(new Date().toISOString().split('T')[0]);

  // Lista de Parcelas Geradas
  const [parcelas, setParcelas] = useState<IParcelaDespesa[]>([]);

  const loadCategorias = async () => {
    const catData = await FinanceiroService.getCategorias();
    const filtered = catData.filter(c => c.natureza === 'SAIDA' && c.tipo === 'VARIAVEL');
    setCategorias(filtered);
    return filtered;
  };

  useEffect(() => {
    async function loadInitial() {
      const [, fData, cData] = await Promise.all([
        loadCategorias(),
        FormasPagamentoService.getAll(),
        ContasBancariasService.getAll()
      ]);
      setFormas(fData.filter(f => f.ativo && f.tipo_movimentacao !== 'RECEBIMENTO'));

      const activeContas = cData.filter(c => c.ativo);
      setContas(activeContas);
      if (activeContas.length === 1) {
        setContaId(activeContas[0].id);
      }

      setLoading(false);
    }
    loadInitial();
  }, []);

  const selectedForma = useMemo(() => formas.find(f => f.id === formaId), [formaId, formas]);

  const isPrazo = selectedForma?.destino_lancamento === 'CONTAS_PAGAR' || selectedForma?.destino_lancamento === 'CONSIGNACAO';
  const isCaixa = selectedForma?.destino_lancamento === 'CAIXA';

  // Lógica de Geração de Parcelas
  useEffect(() => {
    const valorNumerico = Number(valorTotalStr.replace(/\D/g, '')) / 100;
    if (valorNumerico <= 0 || !formaId) {
      setParcelas([]);
      return;
    }

    const novas: IParcelaDespesa[] = [];
    const valorBaseParcela = Number((valorNumerico / qtdParcelas).toFixed(2));
    const dataRef = new Date(dataOperacao);

    for (let i = 0; i < qtdParcelas; i++) {
      const vcto = new Date(dataRef);
      vcto.setMonth(vcto.getMonth() + i);

      novas.push({
        id_temp: Math.random().toString(36).substr(2, 9),
        numero: i + 1,
        vencimento: vcto.toISOString().split('T')[0],
        valor: i === qtdParcelas - 1
          ? Number((valorNumerico - (valorBaseParcela * (qtdParcelas - 1))).toFixed(2))
          : valorBaseParcela
      });
    }
    setParcelas(novas);
  }, [valorTotalStr, qtdParcelas, formaId, dataOperacao]);

  const handleCurrencyChange = (val: string) => {
    const numeric = Number(val.replace(/\D/g, '')) / 100;
    setValorTotalStr(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric));
  };

  const updateParcelaDate = (id: string, date: string) => {
    setParcelas(prev => prev.map(p => p.id_temp === id ? { ...p, vencimento: date } : p));
  };

  const handleCreateCategory = async () => {
    const nome = newCategoryName.trim().toUpperCase();
    if (!nome) {
      alert('Informe o nome da nova categoria.');
      return;
    }

    const existing = categorias.find(c => c.nome.trim().toUpperCase() === nome);
    if (existing) {
      setCategoriaId(existing.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
      return;
    }

    setIsSavingCategory(true);
    try {
      const created = await FinanceiroService.saveCategoria({
        nome,
        tipo: 'VARIAVEL',
        natureza: 'SAIDA'
      });
      await loadCategorias();
      setCategoriaId(created.id);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (error: any) {
      console.error('Erro ao criar categoria financeira:', error);
      alert(`Erro ao criar categoria: ${error?.message || 'verifique os dados e tente novamente.'}`);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parcelas.length === 0 || !categoriaId || !descricao) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (isCaixa && !contaId) {
      alert("Selecione a conta de saída para o pagamento à vista.");
      return;
    }

    // Mapeia parcelas para o formato de persistência
    const payload: Partial<IVeiculoDespesa>[] = parcelas.map(p => ({
      data: dataOperacao,
      data_vencimento: p.vencimento,
      status_pagamento: isCaixa ? 'PAGO' : 'PENDENTE',
      tipo: 'VARIAVEL',
      categoria_id: categoriaId,
      descricao: parcelas.length > 1 ? `${descricao} (${p.numero}/${parcelas.length})` : descricao,
      quantidade: 1,
      valor_unitario: p.valor,
      valor_total: p.valor,
      forma_pagamento_id: formaId,
      conta_bancaria_id: isCaixa ? contaId : undefined
    }));

    onSubmit(payload);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div data-drivecar-ui className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="dc-panel bg-white w-full max-w-2xl rounded-2xl shadow-sm overflow-hidden animate-in zoom-in-95 border border-slate-100 flex flex-col max-h-[95vh]">

        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="dc-section-title text-xl font-semibold text-slate-900 normal-case tracking-normal">Lançamento de Despesa</h2>
            <p className="text-xs text-slate-600 font-bold normal-case tracking-normal mt-1">Gestão de custos integrada ao financeiro</p>
          </div>
          <button onClick={onClose} className="dc-button p-2 hover:bg-white rounded-full text-slate-600 hover:text-rose-500 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">

          {/* Identificação Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Descrição do Serviço / Compra</label>
              <input
                autoFocus
                value={descricao}
                onChange={e => setDescricao(e.target.value.toUpperCase())}
                className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Ex: Troca de Pneus, Higienização, Martelinho..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Data da Nota/Serviço</label>
              <input
                type="date"
                value={dataOperacao}
                onChange={e => setDataOperacao(e.target.value)}
                className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Classificação (Categoria)</label>
              <div className="flex gap-2">
                <select
                  value={categoriaId}
                  onChange={e => setCategoriaId(e.target.value)}
                  className="dc-input min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 font-medium outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(prev => !prev)}
                  className="dc-button w-12 shrink-0 rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
                  title="Cadastrar nova categoria"
                  aria-label="Cadastrar nova categoria"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" /></svg>
                </button>
              </div>
              {isAddingCategory && (
                <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-3">
                  <input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value.toUpperCase())}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                    className="dc-input w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="NOME DA NOVA CATEGORIA"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="dc-button px-4 py-2 rounded-xl text-xs font-semibold normal-case tracking-normal text-slate-600 hover:text-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={isSavingCategory}
                      className="dc-button px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold normal-case tracking-normal shadow-sm shadow-indigo-100 disabled:opacity-50"
                    >
                      {isSavingCategory ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Financeiro Estrutural */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Valor Total Negociado</label>
              <input
                type="text"
                value={valorTotalStr}
                onChange={e => handleCurrencyChange(e.target.value)}
                className="dc-input w-full bg-slate-900 border-2 border-slate-800 rounded-xl px-5 py-3 text-2xl font-semibold text-emerald-400 outline-none focus:border-indigo-500 transition-all text-center shadow-inner"
              />
            </div>

            <div className="md:col-span-7">
              <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 ml-1 tracking-normal">Modalidade de Pagamento</label>
              <select
                value={formaId}
                onChange={e => { setFormaId(e.target.value); setQtdParcelas(1); }}
                className="dc-input w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                required
              >
                <option value="">Como será pago?</option>
                {formas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Seção de Parcelamento */}
          {isPrazo && (
            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between px-1">
                <label className="block text-xs font-semibold text-rose-500 normal-case tracking-normal">Parcelas / Vencimentos</label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-600">Dividir em:</span>
                  <select
                    value={qtdParcelas}
                    onChange={e => setQtdParcelas(Number(e.target.value))}
                    className="dc-input bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-600 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 10, 12].map(n => <option key={n} value={n}>{n}x</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {parcelas.map((p) => (
                  <div key={p.id_temp} className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl hover:bg-white hover:border-indigo-200 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-semibold text-slate-600 text-xs shadow-sm">
                      {p.numero}º
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-600 normal-case mb-1">Previsão Vencimento</p>
                      <input
                        type="date"
                        value={p.vencimento}
                        onChange={(e) => updateParcelaDate(p.id_temp, e.target.value)}
                        className="dc-input bg-transparent font-semibold text-slate-800 outline-none cursor-pointer focus:text-indigo-600 w-full"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-600 normal-case mb-1">Valor Parcela</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.valor)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção À Vista / Caixa */}
          {isCaixa && (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl space-y-4 animate-in slide-in-from-left duration-500">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-200 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-800 normal-case tracking-normal mb-1">Baixa Imediata</h4>
                  <p className="text-xs text-emerald-600 font-medium leading-relaxed">Esta despesa será debitada agora do saldo da conta selecionada abaixo.</p>
                </div>
              </div>
              <select
                required
                value={contaId}
                onChange={e => setContaId(e.target.value)}
                className="dc-input w-full bg-white border-2 border-emerald-200 rounded-xl px-5 py-3 text-xs font-semibold text-emerald-700 outline-none shadow-sm"
              >
                <option value="">Selecione o Caixa de Saída...</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} - {c.titular} | Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saldo_atual || 0)}</option>)}
              </select>
            </div>
          )}

        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={parcelas.length === 0}
            className="dc-button w-full py-5 bg-slate-900 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-indigo-600 shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {isPrazo ? (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Agendar Títulos Financeiros</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                <span>Efetivar Lançamento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ExpenseForm;
