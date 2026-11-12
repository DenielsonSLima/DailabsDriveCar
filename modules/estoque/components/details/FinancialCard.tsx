
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
      <div className="dc-panel bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
         <div className="hidden absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>

         <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
               <p className="text-slate-500 text-xs font-semibold normal-case tracking-normal">Resultado Projetado</p>
               <h3 className="dc-section-title text-2xl font-semibold text-slate-900 tracking-normal normal-case">Análise Financeira</h3>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
               <span className="text-emerald-600 text-xs font-semibold normal-case tracking-normal">{stats.margem.toFixed(1)}% Margem</span>
            </div>
         </div>

         <div className="space-y-4">
            {/* Bloco de Valor de Venda Principal */}
            <div className="dc-kpi-card">
               <p className="dc-kpi-label">Preço Sugerido de Venda</p>
               <div className="flex items-baseline space-x-2">
                  <span className="dc-kpi-value">{formatCurrency(stats.totalVenda)}</span>
               </div>
            </div>

            {/* Detalhamento de Custos */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-3">
               <div className="dc-kpi-card">
                  <p className="dc-kpi-label">{veiculo.is_consignado ? 'Acordado Repasse' : 'Custo Aquisição'}</p>
                  <p className="dc-kpi-value">{formatCurrency(stats.custoAquisicao)}</p>
               </div>
               <div className="dc-kpi-card">
                  <p className="dc-kpi-label">Total Manutenção</p>
                  <p className="dc-kpi-value">{formatCurrency(stats.custoServicos)}</p>
               </div>
            </div>

            {/* KPIs de Performance */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
               <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 normal-case tracking-normal">Investimento Total</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(stats.custoTotal)}</span>
               </div>

               <div className="flex flex-wrap justify-between items-center gap-2 group/kpi">
                  <div className="flex flex-col">
                     <span className="text-xs font-semibold text-emerald-600 normal-case tracking-normal">Lucro Bruto Projetado</span>
                     <span className="text-xs text-slate-600 font-medium">Líquido de manutenções</span>
                  </div>
                  <div className="text-right">
                     <p className="dc-kpi-value text-emerald-700">{formatCurrency(stats.lucroProjetado)}</p>
                  </div>
               </div>

               <div className="flex items-center space-x-2 mt-4">
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                     <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(stats.margem * 2, 100)}%` }}
                     ></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 normal-case">ROI {stats.retornoInvestimento.toFixed(2)}x</span>
               </div>
            </div>
         </div>
      </div>
   );
};

export default FinancialCard;
