import React from 'react';
import BaseReportLayout from '../BaseReportLayout';

interface Props {
  empresa: any;
  watermark: any;
  data: any;
}

const VendasTemplate: React.FC<Props> = ({ empresa, watermark, data }) => {
  const formatCur = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <BaseReportLayout 
      empresa={empresa} 
      watermark={watermark} 
      title="Relatório de Vendas Detalhadas"
      subtitle={`Período: ${data.periodo || 'Geral'}`}
    >
      <div className="space-y-8">
        <p className="text-[9px] text-slate-500">Custos de lotes em andamento podem receber despesas posteriores.</p>
        {/* Sumário */}
        <div className="grid grid-cols-4 gap-4">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Vendido</p>
              <p className="text-lg font-black text-slate-900">{formatCur(data.totalVendas || 0)}</p><p className="text-[9px] text-slate-500">{data.totalUnidades || 0} unidades</p>
           </div>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket por unidade</p>
              <p className="text-lg font-black text-indigo-600">{formatCur(data.ticketMedio || 0)}</p>
           </div>
           <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Lucro Bruto</p>
              <p className="text-lg font-black text-emerald-700">{formatCur(data.lucroBruto || 0)}</p>
           </div>
           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white">
              <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Margem bruta</p>
              <p className="text-lg font-black">{data.margemMedia || 0}%</p>
           </div>
        </div>

        {/* Tabela de Itens */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-4 py-3 font-black uppercase text-slate-500">Data</th>
                <th className="px-4 py-3 font-black uppercase text-slate-500">Veículo</th>
                <th className="px-4 py-3 font-black uppercase text-slate-500">Comprador</th>
                <th className="px-4 py-3 font-black uppercase text-slate-500 text-right">Custo atualizado</th>
                <th className="px-4 py-3 font-black uppercase text-slate-500 text-right">Venda</th>
                <th className="px-4 py-3 font-black uppercase text-slate-500 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.items || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Nenhuma venda encontrada no período selecionado
                  </td>
                </tr>
              ) : (data.items || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td className="px-4 py-3">{item.data}</td>
                  <td className="px-4 py-3 font-bold uppercase">{item.veiculo}<p className="font-normal text-[9px] normal-case break-all">{item.identificacoes}</p></td>
                  <td className="px-4 py-3 uppercase text-slate-500">{item.cliente}</td>
                  <td className="px-4 py-3 text-right">{formatCur(item.custo)}</td>
                  <td className="px-4 py-3 text-right font-black">{formatCur(item.venda)}</td>
                  <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCur(item.lucro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BaseReportLayout>
  );
};

export default VendasTemplate;