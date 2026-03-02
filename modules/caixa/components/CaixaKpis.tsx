
import React from 'react';

interface Props {
  data: any;
}

const CaixaKpis: React.FC<Props> = ({ data }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const kpisRow1 = [
    { label: 'Patrimônio Líquido', val: data.patrimonio_liquido, color: 'indigo', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Saldo Disponível', val: data.saldo_disponivel, color: 'emerald', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Ativos (Estoque)', val: data.total_ativos_estoque, color: 'blue', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: 'Contas a Receber', val: data.total_recebiveis, color: 'amber', icon: 'M9 14l6-6m-5.5 .5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    { label: 'Passivo Circulante', val: data.total_passivo_circulante, color: 'rose', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  ];

  const kpisRow2 = [
    { label: 'Vendas (Valor Vendido)', val: data.total_vendas, color: 'cyan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Despesas Fixas', val: data.total_despesas_fixas, color: 'orange', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Despesas Variáveis', val: data.total_despesas_variaveis, color: 'violet', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  ];

  const renderKpiCard = (k: typeof kpisRow1[0], i: number) => (
    <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
      <div className={`w-12 h-12 rounded-2xl bg-${k.color}-50 text-${k.color}-600 flex items-center justify-center mb-4`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={k.icon} /></svg>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p>
      <h3 className={`text-xl font-black mt-1 ${k.color === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>{fmt(k.val)}</h3>
      <div className={`absolute bottom-0 left-0 h-1 bg-${k.color}-500 transition-all w-0 group-hover:w-full`}></div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Linha 1: KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {kpisRow1.map(renderKpiCard)}
      </div>

      {/* Linha 2: Despesas Fixas e Variáveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {kpisRow2.map(renderKpiCard)}
      </div>
    </div>
  );
};

export default CaixaKpis;
