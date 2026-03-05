
import React from 'react';
import { ISocio } from '../../ajustes/socios/socios.types';

interface Props {
  stats: any;
  socios: ISocio[];
}

const EstoqueDashboard: React.FC<Props> = ({ stats, socios }) => {

  const analytics = stats || {
    totalVenda: 0,
    totalCustoBase: 0,
    totalServicos: 0,
    totalInvestido: 0,
    ticketMedioVenda: 0,
    socioStats: [],
    count: 0
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(val);

  return (
    <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">

      {/* Dashboard Visual de Sócios e KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* KPIs (Substituindo Ticket Médio) */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
          {/* Linha 1 */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="relative overflow-hidden bg-slate-900 p-5 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col justify-center group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Total Investido (Estoque)</p>
              <h3 className="text-lg lg:text-xl font-black text-white relative z-10">{formatCurrency(analytics.totalInvestido)}</h3>
            </div>
            <div className="relative overflow-hidden bg-indigo-600 p-5 rounded-[2rem] border border-indigo-500 shadow-xl flex flex-col justify-center group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1 relative z-10">Veículos em Pátio</p>
              <h3 className="text-lg lg:text-xl font-black text-white relative z-10">{analytics.count} <span className="text-[10px] text-indigo-200 uppercase">Unidades</span></h3>
            </div>
          </div>
          {/* Linha 2 */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="relative overflow-hidden bg-white p-5 rounded-[2rem] border border-slate-200 shadow-md flex flex-col justify-center group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Valor Custo Veículos</p>
              <h3 className="text-lg lg:text-xl font-black text-slate-900 relative z-10">{formatCurrency(analytics.totalCustoBase)}</h3>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-[2rem] border border-orange-100 shadow-md flex flex-col justify-center group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 relative z-10">Valor Total Serviços</p>
              <h3 className="text-lg lg:text-xl font-black text-amber-600 relative z-10">{formatCurrency(analytics.totalServicos)}</h3>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras: Sócios */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Participação por Sócio</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Exposição de capital no estoque atual</p>
            </div>
          </div>

          <div className="space-y-6">
            {analytics.socioStats.length === 0 ? (
              <div className="py-12 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">Nenhum sócio vinculado.</div>
            ) : (
              analytics.socioStats.map((s: any, idx: number) => (
                <div key={idx} className="group">
                  <div className="flex items-end justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black uppercase shadow-lg">{s.nome.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase truncate max-w-[150px]">{s.nome}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{s.count} {s.count === 1 ? 'Carro' : 'Carros'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-indigo-600 leading-none">{formatCurrency(s.totalvalor || s.totalValor || 0)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{(s.percent || 0).toFixed(1)}% do Estoque</p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${s.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstoqueDashboard;
