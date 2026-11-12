
import { getVendaCost, getVendaPartnerResults } from '../utils/venda-values';
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../pedidos-venda.types';

interface Props {
  pedidos: IPedidoVenda[];
}

const VendaRankingSociosCard: React.FC<Props> = ({ pedidos }) => {
  const ranking = useMemo(() => {
    const map = new Map<string, { nome: string, lucroAcumulado: number, vgvProporcional: number }>();
    let lucroBrutoTotalLote = 0;

    pedidos.forEach(p => {
      const socios = getVendaPartnerResults(p);
      const custoV = getVendaCost(p);
      const lucroVenda = (p.valor_venda || 0) - custoV;
      lucroBrutoTotalLote += lucroVenda;

      {
        socios.forEach(s => {
          const lucroSocio = s.retorno;
          const vgvSocio = s.valorVenda;

          const current = map.get(s.socio_id) || { nome: s.nome, lucroAcumulado: 0, vgvProporcional: 0 };
          map.set(s.socio_id, {
            ...current,
            lucroAcumulado: current.lucroAcumulado + lucroSocio,
            vgvProporcional: current.vgvProporcional + vgvSocio
          });
        });
      }
    });

    return Array.from(map.values()).map(s => ({
      ...s,
      percentualNoLucroTotal: lucroBrutoTotalLote > 0 ? (s.lucroAcumulado / lucroBrutoTotalLote) * 100 : 0
    })).sort((a, b) => b.lucroAcumulado - a.lucroAcumulado);
  }, [pedidos]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (ranking.length === 0) return null;

  return (
    <div className="dc-panel animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="dc-section-title font-semibold text-slate-900 normal-case tracking-normal flex items-center">
            <svg className="w-6 h-6 mr-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Lucro Individual por Sócio
          </h3>
          <p className="text-xs text-slate-400 font-semibold normal-case tracking-normal mt-1">Divisão real baseada no lucro bruto de cada veículo vendido</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ranking.map((socio, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 hover:bg-white transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-semibold text-lg shadow-sm shadow-indigo-100 group-hover:scale-105 transition-transform">
                  {socio.nome.charAt(0)}
                </div>
                <div>
                  <h4 className="dc-section-title font-semibold text-slate-900 normal-case max-w-[150px]">{socio.nome}</h4>
                  <p className="text-xs text-slate-400 font-semibold normal-case tracking-normal">Investidor Ativo</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-emerald-600 leading-none">{socio.percentualNoLucroTotal.toFixed(1)}%</p>
                <p className="text-xs font-semibold text-slate-400 normal-case mt-1 tracking-normal">Participação no Lucro</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-semibold text-slate-400 normal-case mb-1">Lucro Bruto (Bolso)</p>
                  <p className="text-xl font-semibold text-slate-800 tracking-tight">{formatCurrency(socio.lucroAcumulado)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-400 normal-case mb-1">VGV Ref.</p>
                  <p className="text-xs font-semibold text-slate-500">{formatCurrency(socio.vgvProporcional)}</p>
                </div>
              </div>

              {/* Barra de Progresso de representatividade */}
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${socio.percentualNoLucroTotal}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendaRankingSociosCard;
