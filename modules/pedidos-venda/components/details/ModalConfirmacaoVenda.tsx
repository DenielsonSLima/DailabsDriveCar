
import React, { useState, useEffect } from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';
import { ContasBancariasService } from '../../../ajustes/contas-bancarias/contas.service';
import { formatDateOnly, todayLocal } from '../../../../utils/date';

interface Props {
  pedido: IPedidoVenda;
  valorVendaEfetivo: number;
  onClose: () => void;
  onConfirm: (params: { condicao: any, contaId?: string }) => void;
  isLoading: boolean;
}

const ModalConfirmacaoVenda: React.FC<Props> = ({ pedido, valorVendaEfetivo, onClose, onConfirm, isLoading }) => {
  const [contas, setContas] = useState<any[]>([]);
  const [selectedContaId, setSelectedContaId] = useState('');
  const parcelasPrevia = (pedido.pagamentos || []).map((p, index) => ({
    ...p, numero: index + 1, data_vencimento: p.data_recebimento,
  }));
  const totalComposto = parcelasPrevia.reduce((sum, p) => sum + Math.round(p.valor * 100), 0);
  const composicaoValida = parcelasPrevia.length > 0 && (pedido.is_consignado
    ? totalComposto > 0
    : totalComposto === Math.round(valorVendaEfetivo * 100));

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  useEffect(() => {
    ContasBancariasService.getAll().then(data => {
      const active = data.filter((c: any) => c.ativo);
      setContas(active);
      if (active.length === 1) {
        setSelectedContaId(active[0].id);
      }
    });
  }, [pedido.forma_pagamento_id]);

  const hoje = todayLocal();
  const requiresAccount = parcelasPrevia.some(p => p.data_vencimento <= hoje && !p.conta_bancaria_id);

  return (
    <div data-drivecar-ui className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="dc-modal bg-white w-full max-w-2xl rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="dc-modal-header flex justify-between items-center">
          <div>
            <h3 className="dc-modal-title">Faturar Venda</h3>
            <p className="text-xs text-slate-600 font-semibold normal-case tracking-normal mt-1">Lançamento de Recebíveis</p>
          </div>
          <button onClick={onClose} className="dc-button p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="dc-modal-body flex-1 overflow-y-auto p-4 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Preço de Venda</p>
              <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(valorVendaEfetivo)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal">Modalidade</p>
              <p className="text-lg font-semibold text-slate-900 normal-case">{pedido.forma_pagamento?.nome}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-600">
              Confira os lançamentos da composição do recebimento. Estes valores e vencimentos serão gerados no financeiro.
            </p>
            {!composicaoValida && (
              <p role="alert" className="text-xs font-semibold text-rose-600">
                A composição precisa totalizar {formatCurrency(valorVendaEfetivo)}. Feche esta janela e ajuste os lançamentos antes de faturar.
              </p>
            )}

            {requiresAccount && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl animate-in slide-in-from-right">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-xs text-blue-800 font-semibold normal-case leading-relaxed">Entrada de Caixa: Selecione a conta de destino para o valor à vista.</p>
                </div>
                <select
                  value={selectedContaId}
                  onChange={e => setSelectedContaId(e.target.value)}
                  className="dc-input w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-blue-700 outline-none"
                >
                  <option value="">Destino do Dinheiro...</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.banco_nome} - {c.titular} | Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.saldo_atual || 0)}</option>)}
                </select>
              </div>
            )}

            {parcelasPrevia.length > 0 && (
              <div className="space-y-2">
                <h4 className="dc-section-title font-semibold text-slate-400 normal-case tracking-normal px-1">Cronograma de Créditos</h4>
                <div className="grid grid-cols-1 gap-2">
                  {parcelasPrevia.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-500 shadow-sm">{p.numero}</span>
                        <span className="text-xs font-semibold text-slate-700">{formatDateOnly(p.data_vencimento)} • {p.forma_pagamento?.nome}</span>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">{formatCurrency(p.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dc-modal-footer p-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              if (!composicaoValida) return;
              if (requiresAccount && !selectedContaId) return alert('Selecione a conta de destino.');
              onConfirm({ condicao: undefined, contaId: requiresAccount ? selectedContaId : undefined });
            }}
            disabled={isLoading || !composicaoValida || (requiresAccount && !selectedContaId)}
            className="dc-button w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold normal-case tracking-normal hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-30"
          >
            {isLoading ? 'Faturando...' : 'Finalizar Venda e Gerar Recebíveis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoVenda;
