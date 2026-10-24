
import { getVendaCost, getVendaValue, getVendaPartnerResults } from '../../utils/venda-values';
import React from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const VendaSocios: React.FC<Props> = ({ pedido }) => {
  const v = pedido.veiculo as any;
  const socios = getVendaPartnerResults(pedido);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (socios.length === 0) return null;

  // Regra de Lucro: Venda - (Custo Aquisição + Serviços)
  const custoTotal = getVendaCost(pedido);
  const vendaEfetiva = getVendaValue(pedido);
  const lucroTotal = vendaEfetiva - custoTotal;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          RESULTADO POR INVESTIDOR
        </h3>
        <div className={`px-4 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-widest ${lucroTotal >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
           LUCRO DO LOTE: {formatCurrency(lucroTotal)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {socios.map((socio: any, idx: number) => {
          const lucroSocio = socio.retorno;
          return (
            <div key={idx} className="flex items-center p-5 rounded-[1.8rem] bg-slate-50 border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform shrink-0 uppercase">
                  {socio.nome.charAt(0)}
               </div>
               <div className="flex-1 ml-4 min-w-0">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{socio.nome}</p>
                  <div className="flex justify-between items-center mt-1">
                     <span className="text-[10px] font-black text-indigo-500">{socio.porcentagem.toFixed(1)}% Cota</span>
                     <span className={`text-sm font-black ${lucroSocio >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(lucroSocio)}
                     </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full mt-3 overflow-hidden p-0.5">
                     <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${socio.porcentagem}%` }}></div>
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase mt-2 tracking-widest">Ganhos Proporcionais</p>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendaSocios;
