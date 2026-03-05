
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedidos: IPedidoVenda[];
  socioIdFiltro?: string;
}

const VendaSocioShareCard: React.FC<Props> = ({ pedidos, socioIdFiltro }) => {
  const socioAnalytics = useMemo(() => {
    // Mapa para consolidar valores por sócio
    // Valor proporcional = % do sócio no veículo * (valor_venda - custo_servicos_do_veiculo)
    // Para simplificar, calcularemos sobre o Valor de Venda Bruto Proporcional
    const map = new Map<string, { nome: string, totalVendaProporcional: number, count: number }>();

    pedidos.forEach(p => {
      const v = p.veiculo as any;
      if (v?.socios && Array.isArray(v.socios)) {
        v.socios.forEach((s: any) => {
          const valorProporcional = (s.porcentagem / 100) * p.valor_venda;
          const current = map.get(s.socio_id) || { nome: s.nome, totalVendaProporcional: 0, count: 0 };

          map.set(s.socio_id, {
            ...current,
            totalVendaProporcional: current.totalVendaProporcional + valorProporcional,
            count: current.count + 1
          });
        });
      }
    });

    const totalVGV = pedidos.reduce((acc, p) => acc + (p.valor_venda || 0), 0);

    return Array.from(map.values()).map(s => ({
      ...s,
      percentualDoTotalVendido: totalVGV > 0 ? (s.totalVendaProporcional / totalVGV) * 100 : 0
    })).sort((a, b) => b.totalVendaProporcional - a.totalVendaProporcional);
  }, [pedidos]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (socioAnalytics.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center">
            <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Participação Societária nas Vendas
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Divisão proporcional do VGV baseado nas cotas dos ativos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {socioAnalytics.map((socio, idx) => {
          const isFiltered = socioIdFiltro && socioAnalytics.find(s => s.nome === socio.nome); // Simplificação, ideal seria por ID

          return (
            <div
              key={idx}
              className={`p-5 rounded-3xl border transition-all duration-300 ${socioIdFiltro && socio.nome.includes(socioIdFiltro) // Logica de destaque se filtrado
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105 z-10'
                  : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-200'
                }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                  {socio.nome.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className={`text-xs font-black uppercase truncate ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'text-white' : 'text-slate-900'}`}>
                    {socio.nome}
                  </h4>
                  <p className={`text-[9px] font-bold uppercase ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {socio.count} {socio.count === 1 ? 'Veículo' : 'Veículos'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <p className={`text-[8px] font-black uppercase ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'text-indigo-200' : 'text-slate-400'}`}>VGV Proporcional</p>
                  <span className={`text-[10px] font-black ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'text-white' : 'text-indigo-600'}`}>
                    {socio.percentualDoTotalVendido.toFixed(1)}%
                  </span>
                </div>
                <p className={`text-lg font-black tracking-tight ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'text-white' : 'text-slate-900'}`}>
                  {formatCurrency(socio.totalVendaProporcional)}
                </p>
              </div>

              <div className={`h-1.5 w-full rounded-full mt-4 overflow-hidden p-0.5 ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'bg-white/20' : 'bg-slate-200 shadow-inner'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${socioIdFiltro && socio.nome.includes(socioIdFiltro) ? 'bg-white' : 'bg-indigo-500'}`}
                  style={{ width: `${socio.percentualDoTotalVendido}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VendaSocioShareCard;
