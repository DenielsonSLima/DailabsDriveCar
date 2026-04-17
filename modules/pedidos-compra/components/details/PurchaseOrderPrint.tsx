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

const PurchaseOrderPrint: React.FC<Props> = ({ pedido, empresa, watermark, allCaracteristicas, allOpcionais }) => {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const dt = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const veiculos = pedido.veiculos || [];
  const veiculo = veiculos[0] || {} as any;
  const vAny = veiculo as any;
  const capaUrl = veiculo.fotos?.find((f: any) => f.is_capa)?.url || veiculo.fotos?.[0]?.url;
  
  const tagsCar = allCaracteristicas.filter(c => veiculo.caracteristicas_ids?.includes(c.id));
  const tagsOp = allOpcionais.filter(o => veiculo.opcionais_ids?.includes(o.id));

  const renderSpec = (label: string, val: string, highlight: boolean = false) => (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100/50'}`}>
      <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-[11px] font-black uppercase truncate ${highlight ? 'text-white' : 'text-slate-700'}`}>{val || '---'}</p>
    </div>
  );

  return (
    <div id="print-supplier" className="bg-white p-12 font-sans text-slate-900 relative min-h-screen border-[12px] border-slate-50">
      
      {/* Selo de Certificação flutuante no topo */}
      <div className="absolute top-10 right-10 z-20">
         <div className="w-24 h-24 border-2 border-slate-100 rounded-full flex flex-col items-center justify-center text-center p-2 opacity-40 grayscale">
            <svg className="w-8 h-8 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-[6px] font-black uppercase tracking-widest leading-none">Qualidade Verificada</span>
         </div>
      </div>

      {/* Marca d'água Profissional */}
      {watermark?.logo_url && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img 
            src={watermark.logo_url} 
            style={{ 
              opacity: watermark.opacidade / 200, 
              transform: `scale(${watermark.tamanho / 100})`,
              maxWidth: '60%',
              maxHeight: '60%'
            }} 
            alt="" 
          />
        </div>
      )}

      <div className="relative z-10 pb-28">
        {/* Cabeçalho Premium - pr-32 para evitar colisão com o selo absolute */}
        <div className="flex justify-between items-end border-b-4 border-slate-900 pb-10 mb-12 pr-32">
          <div className="flex items-center gap-8">
            {empresa.logo_url && <img src={empresa.logo_url} className="h-20 w-auto object-contain" alt="Logo" />}
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{empresa.nome_fantasia}</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{empresa.razao_social}</p>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold mt-2">
                 <span>CNPJ: {empresa.cnpj}</span>
                 <span>IE: {empresa.inscricao_estadual || 'ISENTO'}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-300 mb-2">Pedido de Compra</h2>
            <p className="text-base font-black text-slate-900 uppercase">Documento Nº {pedido.numero_pedido || pedido.id.substring(0,8).toUpperCase()}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Emissão: {dt(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Quadro de Partes (Contratantes) */}
        <div className="grid grid-cols-2 gap-10 mb-12">
           <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 border-b-2 border-indigo-50 pb-2">Fornecedor / Cedente</h3>
              <div className="pl-2">
                <p className="text-sm font-black uppercase text-slate-800">{pedido.fornecedor?.nome}</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1">CPF/CNPJ: {pedido.fornecedor?.documento}</p>
                <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                   <span className="uppercase">{pedido.fornecedor?.cidade} / {pedido.fornecedor?.uf}</span>
                </div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 border-b-2 border-indigo-50 pb-2">Endereço de Retirada</h3>
              <div className="pl-2">
                <p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase">
                  {pedido.logradouro}, {pedido.numero} - {pedido.bairro}<br/>
                  {pedido.cidade} / {pedido.uf} • CEP: {pedido.cep}
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase">{pedido.complemento ? `Ref: ${pedido.complemento}` : ''}</p>
              </div>
           </div>
        </div>

        {/* OBJETO DO CONTRATO (DADOS DO VEÍCULO) */}
        <div className="mb-12">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-6 border-b-2 border-indigo-50 pb-2">Objeto da Aquisição</h3>
          
          <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-white shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-[250px_1fr]">
                {/* Foto do Veículo */}
                <div className="h-64 bg-slate-100 relative">
                   {capaUrl ? (
                     <img src={capaUrl} className="w-full h-full object-cover" alt="Veículo" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[8px] font-black uppercase">Mídia Não Anexada</span>
                     </div>
                   )}
                   <div className="absolute bottom-4 left-4">
                      <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black uppercase font-mono shadow-xl border border-white/20">
                         {veiculo.placa || 'SEM PLACA'}
                      </div>
                   </div>
                </div>

                <div className="p-8 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                      <div>
                         <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{vAny.montadora?.nome}</p>
                         <h4 className="text-2xl font-[900] text-slate-900 uppercase tracking-tighter leading-none">{vAny.modelo?.nome}</h4>
                         <p className="text-sm font-medium text-slate-400 uppercase mt-2">{vAny.versao?.nome}</p>
                      </div>
                      <div className="text-right">
                         <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                            {vAny.tipo_veiculo?.nome || 'N/D'}
                         </span>
                      </div>
                   </div>

                   {/* Especificações Reestruturadas em 2 Linhas para Evitar Cortes */}
                   <div className="mt-8 space-y-3">
                      {/* Linha 1: Motorização, Câmbio, Combustível */}
                      <div className="grid grid-cols-3 gap-3">
                         {renderSpec('Motorização', veiculo.motorizacao)}
                         {renderSpec('Câmbio', veiculo.transmissao)}
                         {renderSpec('Combustível', veiculo.combustivel)}
                      </div>
                      
                      {/* Linha 2: KM, Ano, Valor */}
                      <div className="grid grid-cols-3 gap-3">
                         {renderSpec('KM Atual', veiculo.km?.toLocaleString() + ' KM')}
                         {renderSpec('Ano Fab/Mod', `${veiculo.ano_fabricacao}/${veiculo.ano_modelo}`)}
                         {renderSpec('Valor Unidade', fmt(veiculo.valor_custo || 0), true)}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Itens e Características - Visual Checkbox */}
        <div className="grid grid-cols-2 gap-10 mb-12">
           <div>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Características do Ativo</p>
              <div className="grid grid-cols-2 gap-2">
                 {tagsCar.map(c => (
                    <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
                       <div className="w-3 h-3 border border-indigo-200 rounded bg-indigo-50 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                       </div>
                       <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{c.nome}</span>
                    </div>
                 ))}
                 {tagsCar.length === 0 && <p className="text-[10px] text-slate-300 italic">Padrão de fábrica verificado.</p>}
              </div>
           </div>
           <div>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Opcionais Destacados</p>
              <div className="grid grid-cols-2 gap-2">
                 {tagsOp.slice(0, 10).map(o => (
                    <div key={o.id} className="flex items-center gap-2 py-1.5 border-b border-slate-50">
                       <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                       <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{o.nome}</span>
                    </div>
                 ))}
                 {tagsOp.length > 10 && <span className="text-[8px] text-slate-400 font-black italic">+ {tagsOp.length - 10} Outros itens</span>}
              </div>
           </div>
        </div>

        {/* TERMOS FINANCEIROS - BLOCO DE DESTAQUE */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white mb-16 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
           
           <div className="flex flex-col md:flex-row justify-between gap-10 relative z-10">
              <div className="flex-1 space-y-6">
                 <div>
                    <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Condições Comerciais</h3>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Previsão Quitação</p>
                          <p className="text-sm font-black uppercase">{pedido.previsao_pagamento ? dt(pedido.previsao_pagamento) : 'A DEFINIR'}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Forma de Pagamento</p>
                          <p className="text-sm font-black uppercase">{pedido.forma_pagamento?.nome || 'A COMBINAR'}</p>
                       </div>
                    </div>
                 </div>
                 <div className="pt-6 border-t border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Notas Contratuais</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic truncate max-w-lg">
                      {pedido.observacoes || 'Sem observações adicionais para este contrato.'}
                    </p>
                 </div>
              </div>

              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex flex-col justify-center items-center text-center min-w-[280px]">
                 <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-2">Total da Negociação</p>
                 <h3 className="text-4xl font-black tracking-tighter text-white">{fmt(pedido.valor_negociado)}</h3>
                 <span className="text-[8px] font-black text-slate-500 uppercase mt-4">Moeda Corrente: Real (BRL)</span>
              </div>
           </div>
        </div>

        {/* ASSINATURAS FORMAIS */}
        <div className="grid grid-cols-2 gap-32 px-10">
           <div className="text-center space-y-3">
              <div className="h-14 border-b border-slate-300"></div>
              <p className="text-[10px] font-black uppercase text-slate-800 max-w-[280px] mx-auto leading-tight">{empresa.nome_fantasia}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">HCV - Departamento de Compras</p>
           </div>
           <div className="text-center space-y-3">
              <div className="h-14 border-b border-slate-300"></div>
              <p className="text-[10px] font-black uppercase text-slate-800 max-w-[280px] mx-auto leading-tight">{pedido.fornecedor?.nome}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Fornecedor / Proprietário</p>
           </div>
        </div>

        <div className="absolute bottom-6 left-0 w-full text-center border-t border-slate-50 pt-6 text-[8px] text-slate-300 font-black uppercase tracking-[0.6em]">
           HCV Operating Core - Protocolo Digital Auditável
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderPrint;