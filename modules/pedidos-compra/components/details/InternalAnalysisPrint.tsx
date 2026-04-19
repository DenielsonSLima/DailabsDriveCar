import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';
import { IEmpresa } from '../../../ajustes/empresa/empresa.types';
import { IMarcaDaguaConfig } from '../../../ajustes/marca-dagua/marca-dagua.types';
import { ICaracteristica } from '../../../cadastros/caracteristicas/caracteristicas.types';
import { IOpcional } from '../../../cadastros/opcionais/opcionais.types';

interface Props {
  pedido: IPedidoCompra;
  empresa: IEmpresa;
  watermark: IMarcaDaguaConfig;
  allCaracteristicas: ICaracteristica[];
  allOpcionais: IOpcional[];
}

const InternalAnalysisPrint: React.FC<Props> = ({ pedido, empresa, watermark, allCaracteristicas, allOpcionais }) => {
  const formatCur = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const dt = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const veiculo = pedido.veiculos?.[0] || {} as any;
  const vAny = veiculo as any;
  const capaUrl = veiculo.fotos?.find((f: any) => f.is_capa)?.url || veiculo.fotos?.[0]?.url;
  
  // Cálculos Estratégicos Baseados no Ativo
  const custoAquisicao = Number(veiculo.valor_custo) || Number(pedido.valor_negociado) || 0;
  const custoServicos = Number(vAny.valor_custo_servicos) || 0;
  const custoTotal = custoAquisicao + custoServicos;
  const vgvProjetado = Number(veiculo.valor_venda) || 0;
  const lucroEstimado = vgvProjetado - custoTotal;
  const margemPercent = custoTotal > 0 ? (lucroEstimado / custoTotal) * 100 : 0;

  return (
    <div id="print-internal" className="bg-slate-50 p-12 font-sans text-slate-900 relative min-h-screen">
      
      {/* Faixa lateral de Auditoria */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600"></div>

      <div className="relative z-10 bg-white shadow-2xl p-10 rounded-sm">
        {/* Cabeçalho de BI */}
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
               <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Confidencial</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relatório de Inteligência de Ativo</span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">Nexus Core Business Intelligence</h1>
            <p className="text-xs font-bold text-slate-500 mt-2">Dossiê Analítico: {pedido.id.toUpperCase()}</p>
          </div>
          <div className="text-right">
             <img src={empresa.logo_url} className="h-10 w-auto object-contain ml-auto mb-3" alt="" />
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hidrocar Operating System v4.0</p>
          </div>
        </div>

        {/* PERFORMANCE FINANCEIRA (KPIs EM GRID) */}
        <div className="grid grid-cols-4 gap-4 mb-12">
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Aquisição</p>
              <p className="text-lg font-black text-slate-900">{formatCur(custoAquisicao)}</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Serv./Prep.</p>
              <p className="text-lg font-black text-amber-600">{formatCur(custoServicos)}</p>
           </div>
           <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center shadow-sm">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Lucro Líquido Ref.</p>
              <p className="text-lg font-black text-emerald-700">{formatCur(lucroEstimado)}</p>
           </div>
           <div className="bg-indigo-900 p-5 rounded-2xl shadow-xl text-center text-white">
              <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">ROI / Margem</p>
              <p className="text-lg font-black text-white">{margemPercent.toFixed(1)}%</p>
           </div>
        </div>

        {/* DETALHAMENTO DO ATIVO */}
        <div className="mb-12">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-3"></div>
              Informação Técnica Verificada
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] border border-slate-100 rounded-3xl overflow-hidden">
              <div className="h-56 bg-slate-900 relative">
                 {capaUrl ? <img src={capaUrl} className="w-full h-full object-cover opacity-80" alt="" /> : <div className="w-full h-full bg-slate-200"></div>}
                 <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black uppercase font-mono shadow-xl border border-white/20">
                    {veiculo.placa || '---'}
                 </div>
              </div>
              <div className="p-8 grid grid-cols-2 gap-x-12 gap-y-8">
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Identificação Comercial</p>
                    <h4 className="text-base font-black uppercase text-slate-900">{vAny.modelo?.nome}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase">{vAny.versao?.nome}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fabricante</p>
                    <p className="text-base font-black text-indigo-600 uppercase">{vAny.montadora?.nome}</p>
                 </div>
                 
                 <div className="col-span-2 grid grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">KM</p>
                       <p className="text-xs font-bold text-slate-700">{veiculo.km?.toLocaleString()} KM</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Ciclo</p>
                       <p className="text-xs font-bold text-slate-700">{veiculo.ano_fabricacao}/{veiculo.ano_modelo}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Potência</p>
                       <p className="text-xs font-bold text-slate-700 uppercase">{veiculo.motorizacao}</p>
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase">Câmbio</p>
                       <p className="text-xs font-bold text-slate-700 uppercase">{veiculo.transmissao}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* ESTRUTURA SOCIETÁRIA (DETALHAMENTO DE CAPITAL) */}
        <div className="mb-12">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-3"></div>
              Composição de Cotas & Capital Alocado
           </h3>
           <div className="space-y-3">
              {veiculo.socios?.map((s: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm uppercase shadow-lg shadow-indigo-100">{s.nome.charAt(0)}</div>
                       <div>
                          <p className="text-xs font-black text-slate-800 uppercase leading-none">{s.nome}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cota de Participação: {s.porcentagem}%</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Aporte Ref.</p>
                       <p className="text-sm font-black text-slate-900">{formatCur(s.valor)}</p>
                    </div>
                 </div>
              ))}
              {!veiculo.socios?.length && (
                 <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Propriedade Integral Hidrocar</p>
                 </div>
              )}
           </div>
        </div>

        {/* PARECER TÉCNICO / AUDITORIA */}
        <div className="mt-16 p-8 bg-indigo-50/30 rounded-3xl border border-indigo-100">
           <h4 className="text-[10px] font-black uppercase mb-4 text-indigo-400 tracking-widest border-b border-indigo-100 pb-2">Parecer Técnico de Aquisição</h4>
           <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
              {pedido.observacoes || 'Sem notas adicionais de auditoria registradas.'}
           </p>
        </div>

        <div className="mt-20 flex justify-between items-end">
           <div className="space-y-1">
              <p className="text-[8px] font-bold text-slate-400 uppercase">Documento gerado eletronicamente por</p>
              <p className="text-[10px] font-black text-slate-900 uppercase">NEXUS OPERATING SYSTEM v4.0.1</p>
           </div>
           <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-900 uppercase">{dt(new Date().toISOString())} - {new Date().toLocaleTimeString('pt-BR')}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Protocolo de Auditoria: CMP-INT-{pedido.id.substring(0,8).toUpperCase()}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default InternalAnalysisPrint;