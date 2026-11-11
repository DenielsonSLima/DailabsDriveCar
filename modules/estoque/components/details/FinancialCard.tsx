
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
      lucroProjetado: (veiculo as any).valor_lucro_estimado || 0,
      margem: Number((veiculo as any).valor_margem_estimada) || 0,
      retornoInvestimento: (veiculo as any).valor_total_investido > 0
         ? (veiculo.valor_venda || 0) / (veiculo as any).valor_total_investido
         : 0
   };

   const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

   return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

         <div className="flex items-center justify-between mb-8">
            <div>
               <p className="text-slate-500 text-xs font-semibold normal-case tracking-normal">Resultado Projetado</p>
               <h3 className="text-2xl font-semibold text-slate-900 tracking-normal normal-case">Análise Financeira</h3>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
               <span className="text-emerald-600 text-xs font-semibold normal-case tracking-normal">{stats.margem.toFixed(1)}% Margem</span>
            </div>
         </div>

         <div className="space-y-6">
            {/* Bloco de Valor de Venda Principal */}
            <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-sm shadow-slate-200">
               <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Preço Sugerido de Venda</p>
               <div className="flex items-baseline space-x-2">
                  <span className="text-2xl sm:text-3xl font-semibold tracking-tight">{formatCurrency(stats.totalVenda)}</span>
               </div>
            </div>

            {/* Detalhamento de Custos */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 normal-case mb-1">{veiculo.is_consignado ? 'Acordado Repasse' : 'Custo Aquisição'}</p>
                  <p className="text-sm font-semibold text-slate-700">{formatCurrency(stats.custoAquisicao)}</p>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-500 normal-case mb-1">Total Manutenção</p>
                  <p className="text-sm font-semibold text-amber-600">{formatCurrency(stats.custoServicos)}</p>
               </div>
            </div>

            {/* KPIs de Performance */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 normal-case tracking-normal">Investimento Total</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(stats.custoTotal)}</span>
               </div>

               <div className="flex justify-between items-center group/kpi">
                  <div className="flex flex-col">
                     <span className="text-xs font-semibold text-emerald-600 normal-case tracking-normal">Lucro Bruto Projetado</span>
                     <span className="text-xs text-slate-400 font-medium">Líquido de manutenções</span>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-semibold text-emerald-600 leading-none">{formatCurrency(stats.lucroProjetado)}</p>
                  </div>
               </div>

               <div className="flex items-center space-x-2 mt-4">
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                     <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.margem * 2, 100)}%` }}
                     ></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 normal-case">ROI {stats.retornoInvestimento.toFixed(2)}x</span>
               </div>
            </div>
         </div>
      </div>
   );
};

export default FinancialCard;
