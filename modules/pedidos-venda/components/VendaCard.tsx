
import { getVendaUnits } from '../utils/venda-values';
import React from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
  onClick: () => void;
}

const VendaCard: React.FC<Props> = ({ pedido, onClick }) => {
  const v = pedido.veiculo as any;
  const capaUrl = v?.fotos?.find((f: any) => f.is_capa)?.url || v?.fotos?.[0]?.url;
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div 
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-video bg-slate-900 relative">
        {capaUrl ? (
          <img src={capaUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Veículo" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700 font-black text-xs uppercase tracking-widest">Sem Foto</div>
        )}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-lg">
          {pedido.status}
        </div>
      </div>
      <div className="p-6">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pedido #{pedido.numero_venda}</p>
        <h3 className="text-lg font-black text-slate-900 uppercase truncate">{pedido.lote_id ? `${getVendaUnits(pedido)} unidades do lote` : `${v?.modelo?.nome || ''} ${v?.versao?.nome || ''}`}</h3>
        <p className="text-xs font-bold text-slate-500 mt-1">{pedido.cliente?.nome}</p>
        
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end">
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Preço de Venda</p>
            <p className="text-xl font-black text-emerald-600">{fmt(pedido.valor_venda)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M9 5l7 7-7 7" /></svg></div>
        </div>
      </div>
    </div>
  );
};

export default VendaCard;
