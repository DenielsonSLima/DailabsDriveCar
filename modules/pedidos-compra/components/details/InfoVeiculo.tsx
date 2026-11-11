
import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';
import { useNavigate } from 'react-router-dom';

interface Props {
  pedido: IPedidoCompra;
}

const InfoVeiculo: React.FC<Props> = ({ pedido }) => {
  const navigate = useNavigate();
  // Fix: Property 'veiculo' does not exist on type 'IPedidoCompra'. Using the first element of 'veiculos' array instead.
  const v = pedido.veiculos?.[0];
  const vAny = v as any;

  if (!v) {
    return (
      <div className="bg-white rounded-2xl p-1 border-2 border-dashed border-indigo-200 shadow-sm animate-in slide-in-from-bottom-10 duration-700 relative group overflow-hidden cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/10 transition-all" onClick={() => navigate(`/pedidos-compra/${pedido.id}/adicionar-veiculo`)}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="flex flex-col items-center justify-center py-16 text-center relative z-10">
          <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-sm shadow-indigo-100">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 normal-case tracking-normal mb-2">Adicionar Veículo ao Pedido</h3>
          <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
            Este pedido ainda não possui um veículo vinculado. Cadastre o veículo para habilitar a confirmação e entrada no estoque.
          </p>
        </div>
      </div>
    );
  }

  const capaUrl = v?.fotos?.find(f => f.is_capa)?.url || v?.fotos?.[0]?.url;

  return (
    <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-10 duration-700 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-5 relative h-64 lg:h-auto min-h-[300px]">
          {capaUrl ? (
            <img src={capaUrl} className="absolute inset-0 w-full h-full object-cover rounded-2xl" alt="Veículo" />
          ) : (
            <div className="absolute inset-0 bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs font-semibold normal-case tracking-normal mt-2">Sem Foto</span>
            </div>
          )}

          <div className="absolute top-4 left-4">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-xl text-xs font-semibold text-slate-800 shadow-sm border border-white/50">
              {v.placa || 'AAAAAA'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 lg:p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {vAny.montadora?.logo_url && <img src={vAny.montadora.logo_url} className="h-6 w-auto" alt="" />}
              <span className="text-xs font-bold text-slate-400 normal-case tracking-normal">{vAny.montadora?.nome}</span>
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-semibold normal-case ml-2 border border-indigo-100">{vAny.tipo_veiculo?.nome || 'N/D'}</span>
            </div>
            <button
              onClick={() => navigate(pedido.id ? `/pedidos-compra/${pedido.id}/veiculo/editar/${v.id}` : `/estoque/editar/${v.id}`)}
              className="text-xs font-semibold normal-case tracking-normal text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100 flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Editar Veículo
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 normal-case tracking-normal leading-tight mb-2">
            {vAny.modelo?.nome}
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-8 border-l-2 border-indigo-500 pl-3">
            {vAny.versao?.nome}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Motorização</p>
              <p className="text-sm font-bold text-slate-800 truncate">{v.motorizacao}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Combustível</p>
              <p className="text-sm font-bold text-slate-800 truncate">{v.combustivel}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Transmissão</p>
              <p className="text-sm font-bold text-slate-800 truncate">{v.transmissao}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">Ano/Mod</p>
              <p className="text-sm font-bold text-slate-800">{v.ano_fabricacao}/{v.ano_modelo}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoVeiculo;