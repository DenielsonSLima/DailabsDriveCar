
import React, { useMemo } from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
}

const PurchasePartnersResultKpis: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2
    }).format(val);

  const stats = useMemo(() => {
    const veiculos = pedido.veiculos || [];
    const v = veiculos[0] as any;
    if (!v || !v.socios || !Array.isArray(v.socios)) return [];

    // Lógica de custo idêntica ao OrderCostKpis para consistência
    const custoAquisicaoBase = veiculos.reduce((acc, item) => acc + (Number(item.valor_custo) || 0), 0);
    const valorPedido = Number(pedido.valor_negociado) || 0;
    const custoAquisicao = valorPedido > 0 ? valorPedido : custoAquisicaoBase;

    const custoServicos = veiculos.reduce((acc, item: any) => acc + (Number(item.valor_custo_servicos) || 0), 0);
    const investimentoTotalLote = custoAquisicao + custoServicos;

    const valorVendaProjetado = Number(v.valor_venda) || 0;
    const lucroProjetadoLote = valorVendaProjetado > 0 ? valorVendaProjetado - investimentoTotalLote : 0;

    return v.socios.map((s: any) => {
      // Usar o valor já calculado e rebalanceado no banco
      const investidoSocio = Number(s.valor) || 0;

      const perc = (Number(s.porcentagem) || 0) / 100;
      const retornoSocio = lucroProjetadoLote * perc;
      const margemSocio = investidoSocio > 0 ? (retornoSocio / investidoSocio) * 100 : 0;

      return {
        nome: s.nome,
        porcentagem: s.porcentagem,
        investido: investidoSocio,
        retorno: retornoSocio,
        margem: margemSocio
      };
    });
  }, [pedido]);

  if (stats.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm animate-in slide-in-from-top-4 duration-500 overflow-hidden">
      <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Composição Societária do Investimento</h3>
        </div>
        <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg uppercase tracking-widest">
          {stats.length} {stats.length === 1 ? 'Sócio' : 'Sócios'}
        </span>
      </div>

      <div className="divide-y divide-slate-50">
        {stats.map((socio, idx) => (
          <div key={idx} className="group p-5 hover:bg-slate-50/30 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Partner Info */}
              <div className="flex items-center space-x-3 lg:w-1/4 min-w-[200px]">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-100 uppercase shrink-0">
                  {socio.nome.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">
                    {socio.nome}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Investidor Ativo</p>
                    <span className="text-[10px] font-black text-slate-300">•</span>
                    <span className="text-[10px] font-black text-indigo-600">{Number(socio.porcentagem).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="hidden lg:block flex-1 max-w-[140px] px-4">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${socio.porcentagem}%` }}
                  ></div>
                </div>
              </div>

              {/* Financial KPIs - Compacted */}
              <div className="grid grid-cols-2 md:flex md:items-center gap-6 md:gap-8">
                <div className="flex flex-col">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Aporte</p>
                  <p className="text-xs font-black text-slate-700">{formatCurrency(socio.investido)}</p>
                </div>

                <div className="flex flex-col">
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Lucro Est.</p>
                  <p className="text-xs font-black text-slate-700">{formatCurrency(socio.retorno)}</p>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg border shadow-sm ${socio.margem >= 0 ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-rose-600 border-rose-100'
                    }`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path d={socio.margem >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tight">{socio.margem.toFixed(1)}% Margem Ref.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

  );
};

export default PurchasePartnersResultKpis;
