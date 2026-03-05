
import React, { useMemo } from 'react';
import { IPedidoVenda } from '../../pedidos-venda.types';

interface Props {
  pedido: IPedidoVenda;
}

const VendaPartnersResultKpis: React.FC<Props> = ({ pedido }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);

  const stats = useMemo(() => {
    const v = pedido.veiculo as any;
    if (!v || !v.socios || !Array.isArray(v.socios)) return [];

    const custoAquisicao = v.valor_custo || 0;
    const custoServicos = v.valor_custo_servicos || 0;
    const investimentoTotalLote = custoAquisicao + custoServicos;
    const valorVenda = (pedido.valor_venda > 0 ? pedido.valor_venda : v?.valor_venda) || 0;
    const lucroBrutoLote = valorVenda - investimentoTotalLote;

    return v.socios.map((s: any) => {
      const perc = (s.porcentagem || 0) / 100;
      const investidoSocio = investimentoTotalLote * perc;
      const retornoSocio = lucroBrutoLote * perc;
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
    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm animate-in slide-in-from-top-4 duration-500 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Divisão de Capital e Retorno por Investidor</h3>
        </div>
        <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg uppercase tracking-widest">
          {stats.length} {stats.length === 1 ? 'Sócio' : 'Sócios'}
        </span>
      </div>

      <div className="p-8 space-y-8">
        {stats.map((socio, idx) => (
          <div key={idx} className="group border-b border-slate-50 last:border-0 pb-8 last:pb-0">
            {/* Linha Superior: Nome e Barra */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
              <div className="flex items-center space-x-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-100 uppercase shrink-0">
                  {socio.nome.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-tighter truncate">
                    {socio.nome}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Share no Lote: {socio.porcentagem}%</p>
                </div>
              </div>

              {/* Barra de Porcentagem à Direita */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Cota de Participação</span>
                  <span className="text-[10px] font-black text-indigo-600">{socio.porcentagem}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                    style={{ width: `${socio.porcentagem}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Linha Inferior: Valores Investido e Retorno */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-16">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group-hover:border-slate-200 transition-colors">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Capital Investido</p>
                <p className="text-sm font-black text-slate-700">{formatCurrency(socio.investido)}</p>
              </div>
              <div className="bg-emerald-50/40 p-3 rounded-2xl border border-emerald-100 group-hover:border-emerald-200 transition-colors">
                <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Lucro Proporcional (Bolso)</p>
                <p className="text-sm font-black text-emerald-700">{formatCurrency(socio.retorno)}</p>
              </div>
              <div className="flex items-center px-4">
                <div className={`px-4 py-2 rounded-xl border-2 flex items-center space-x-2 ${socio.margem >= 0 ? 'bg-white text-emerald-600 border-emerald-50' : 'bg-white text-rose-600 border-rose-50'
                  }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path d={socio.margem >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
                  </svg>
                  <span className="text-xs font-black uppercase tracking-tighter">{socio.margem.toFixed(1)}% Margem Real</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendaPartnersResultKpis;
