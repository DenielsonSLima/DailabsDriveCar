
import React from 'react';
import { IVeiculo } from '../../estoque.types';

interface Props {
   veiculo: IVeiculo;
}

const FinancialCard: React.FC<Props> = ({ veiculo }) => {

   // Dados 100% calculados no Servidor (EstoqueService.getById)
   const stats = {
      custoAquisicao: veiculo.valor_custo || 0,
      custoServicos: veiculo.valor_custo_servicos || 0,
      custoTotal: (veiculo as any).valor_total_investido || 0,
      totalVenda: veiculo.valor_venda || 0,
      lucroProjetado: (veiculo as any).lucro_projetado || 0,
      margem: (veiculo as any).margem_projetada || 0,
      retornoInvestimento: (veiculo as any).valor_total_investido > 0
         ? (veiculo.valor_venda || 0) / (veiculo as any).valor_total_investido
         : 0
   };

   const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

   return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

         <div className="flex items-center justify-between mb-8">
            <div>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Resultado Projetado</p>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Análise Financeira</h3>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
               <span className="text-emerald-600 text-xs font-black uppercase tracking-widest">{stats.margem.toFixed(1)}% Margem</span>
            </div>
         </div>

         <div className="space-y-6">
            {/* Bloco de Valor de Venda Principal */}
            <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Sugerido de Venda</p>
               <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black tracking-tight">{formatCurrency(stats.totalVenda)}</span>
               </div>
            </div>

            {/* Detalhamento de Custos */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">{veiculo.is_consignado ? 'Acordado Repasse' : 'Custo Aquisição'}</p>
                  <p className="text-sm font-black text-slate-700">{formatCurrency(stats.custoAquisicao)}</p>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-[8px] font-bold text-amber-500 uppercase mb-1">Total Manutenção</p>
                  <p className="text-sm font-black text-amber-600">{formatCurrency(stats.custoServicos)}</p>
               </div>
            </div>

            {/* KPIs de Performance */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Investimento Total</span>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(stats.custoTotal)}</span>
               </div>

               <div className="flex justify-between items-center group/kpi">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Lucro Bruto Projetado</span>
                     <span className="text-[9px] text-slate-400 font-medium">Líquido de manutenções</span>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-black text-emerald-600 leading-none">{formatCurrency(stats.lucroProjetado)}</p>
                  </div>
               </div>

               <div className="flex items-center space-x-2 mt-4">
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                     <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.margem * 2, 100)}%` }}
                     ></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase">ROI {stats.retornoInvestimento.toFixed(2)}x</span>
               </div>
            </div>
         </div>
      </div>
   );
};

export default FinancialCard;
