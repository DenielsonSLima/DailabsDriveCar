
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
  onBack: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  loadingAction: boolean;
  canConfirm?: boolean;
  onManageLote?: () => void;
}

const HeaderVenda: React.FC<Props> = ({ pedido, onBack, onEdit, onConfirm, onDelete, loadingAction, canConfirm, onManageLote }) => {
  const isConcluido = pedido.status === 'CONCLUIDO';
  const isCancelado = pedido.status === 'CANCELADO';
  const isRascunho = pedido.status === 'RASCUNHO';

  return (
    <div className="dc-panel animate-in slide-in-from-top-4 duration-500">
      <div className="dc-page-header">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={onBack}
            className="dc-button group p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-all shrink-0 shadow-sm"
          >
            <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold normal-case tracking-normal border border-slate-200">
                VENDA #{pedido.numero_venda}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold normal-case tracking-normal flex items-center gap-1.5 ${isConcluido ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConcluido ? 'bg-emerald-500' : pedido.status === 'CANCELADO' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`}></div>
                {isConcluido ? 'FATURADA' : pedido.status === 'CANCELADO' ? 'CANCELADA' : 'RASCUNHO'}
              </span>
            </div>
            <h1 className="dc-page-title">
              {pedido.cliente?.nome || 'CLIENTE NÃO INFORMADO'}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0">
          {pedido.lote_id && <button onClick={onManageLote} className="dc-button px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold">Gerenciar lote</button>}
          {!pedido.lote_id && <button
            onClick={onDelete}
            disabled={loadingAction}
            className="dc-button px-4 py-2.5 text-rose-500 font-semibold text-xs normal-case tracking-normal rounded-xl hover:bg-rose-50 transition-all disabled:opacity-50"
          >
            Excluir
          </button>}

          {isRascunho && !pedido.lote_id && (
            <>
              <button
                onClick={onEdit}
                disabled={loadingAction}
                className="dc-button px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-semibold text-xs normal-case tracking-normal rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center shadow-sm disabled:opacity-50"
              >
                Editar Pedido
              </button>

              <button
                onClick={onConfirm}
                disabled={loadingAction || !canConfirm}
                className={`dc-button px-8 py-4 text-white font-semibold text-xs normal-case tracking-normal rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center ${canConfirm ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-300 cursor-not-allowed'
                  }`}
              >
                {loadingAction && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                Faturar Venda
              </button>
            </>
          )}

          {isConcluido && (
            <div className="px-4 py-2.5 bg-emerald-50 text-emerald-600 font-semibold text-xs normal-case tracking-normal rounded-xl border border-emerald-100 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
              Venda Concluída
            </div>
          )}

          {isCancelado && (
            <div className="px-4 py-2.5 bg-rose-50 text-rose-600 font-semibold text-xs normal-case tracking-normal rounded-xl border border-rose-100 flex items-center text-center">
              Venda Cancelada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderVenda;
