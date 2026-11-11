
import React from 'react';
import { IFormaPagamento, TipoMovimentacao, DestinoLancamento } from '../formas-pagamento.types';

interface Props {
  items: IFormaPagamento[];
  onEdit: (item: IFormaPagamento) => void;
  onDelete: (id: string) => void;
}

const FormasPagamentoList: React.FC<Props> = ({ items, onEdit, onDelete }) => {
  
  const getMovimentacaoStyle = (tipo: TipoMovimentacao) => {
    switch (tipo) {
      case 'RECEBIMENTO': return { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-600', 
        border: 'border-emerald-100',
        label: 'Recebimento',
        icon: 'M19 14l-7 7m0 0l-7-7m7 7V3' 
      }; 
      case 'PAGAMENTO': return { 
        bg: 'bg-rose-50', 
        text: 'text-rose-600', 
        border: 'border-rose-100',
        label: 'Pagamento',
        icon: 'M5 10l7-7m0 0l7 7m-7-7v18' 
      }; 
      default: return { 
        bg: 'bg-indigo-50', 
        text: 'text-indigo-600', 
        border: 'border-indigo-100',
        label: 'Ambos',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' 
      }; 
    }
  };

  const formatDestino = (destino: DestinoLancamento) => {
    switch(destino) {
      case 'CAIXA': return 'Caixa Imediato';
      case 'CONTAS_RECEBER': return 'Contas a Receber';
      case 'CONTAS_PAGAR': return 'Contas a Pagar';
      case 'ATIVO': return 'Ativo / Estoque';
      case 'CONSIGNACAO': return 'Consignação (Venda)';
      case 'NENHUM': return 'Sem Financeiro';
      default: return destino;
    }
  };

  const getDestinoBadgeColor = (destino: DestinoLancamento) => {
    if (destino === 'CONSIGNACAO') return 'bg-amber-100 text-amber-700';
    if (destino === 'ATIVO') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map(item => {
        const style = getMovimentacaoStyle(item.tipo_movimentacao);
        
        return (
          <div key={item.id} className="group relative bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-sm hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between h-full">
            
            <div className="space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
                   </svg>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium normal-case tracking-normal border ${style.border} ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 text-lg leading-tight mb-1">
                  {item.nome}
                </h3>
                {item.ativo ? (
                  <span className="text-xs font-medium text-emerald-500 normal-case tracking-normal flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></div>
                    Ativo
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 normal-case tracking-normal flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1.5"></div>
                    Inativo
                  </span>
                )}
              </div>

              <div className="h-px bg-slate-50 w-full my-2"></div>

              {/* Detalhes Financeiros */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 normal-case tracking-normal">Destino</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getDestinoBadgeColor(item.destino_lancamento)}`}>
                    {formatDestino(item.destino_lancamento)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 normal-case tracking-normal">Parcelamento</span>
                  {item.permite_parcelamento ? (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      Até {item.qtd_max_parcelas}x
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      Não
                    </span>
                  )}
                </div>
              </div>

              {/* Observações */}
              {item.observacoes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                  <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">
                    "{item.observacoes}"
                  </p>
                </div>
              )}
            </div>
            
            {/* Actions Toolbar */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                title="Editar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Excluir"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FormasPagamentoList;
