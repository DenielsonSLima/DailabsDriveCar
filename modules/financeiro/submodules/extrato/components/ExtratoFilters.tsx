import React from 'react';
import { IHistoricoFiltros } from '../../../financeiro.types';

interface Props {
  filtros: IHistoricoFiltros;
  onChange: (f: IHistoricoFiltros) => void;
}

const ExtratoFilters: React.FC<Props> = ({ filtros, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-500">
      {/* Linha 1: Busca + Período + Limpar */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Buscar</label>
          <input
            type="text"
            placeholder="Descrição, parceiro ou nº pedido..."
            value={filtros.busca || ''}
            onChange={e => onChange({ ...filtros, busca: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-[#111827] outline-none placeholder-slate-300 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-all"
          />
        </div>

        <div className="flex-1 w-full">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Período de Análise</label>
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1">
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={e => onChange({ ...filtros, dataInicio: e.target.value })}
              className="bg-transparent text-xs font-bold text-slate-600 px-3 py-1.5 outline-none cursor-pointer"
            />
            <span className="text-slate-300">até</span>
            <input
              type="date"
              value={filtros.dataFim || ''}
              onChange={e => onChange({ ...filtros, dataFim: e.target.value })}
              className="bg-transparent text-xs font-bold text-slate-600 px-3 py-1.5 outline-none cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={() => onChange({ dataInicio: '', dataFim: '', tipo: '', status: '', origem: '', busca: '' })}
          className="px-6 py-2.5 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all whitespace-nowrap"
        >
          Limpar
        </button>
      </div>

      {/* Linha 2: Tipo / Status / Origem */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-52">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Tipo Movimentação</label>
          <select
            value={filtros.tipo || ''}
            onChange={e => onChange({ ...filtros, tipo: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-[#111827] outline-none cursor-pointer"
          >
            <option value="">Todas</option>
            <option value="ENTRADA">Entradas Realizadas</option>
            <option value="SAIDA">Saídas Realizadas</option>
            <option value="A_PAGAR">A Pagar (Pendente)</option>
            <option value="A_RECEBER">A Receber (Pendente)</option>
            <option value="TRANSFERENCIA">Transferências</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Status</label>
          <select
            value={filtros.status || ''}
            onChange={e => onChange({ ...filtros, status: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-[#111827] outline-none cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="REALIZADO">Realizado</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PARCIAL">Parcialmente Pago</option>
            <option value="ATRASADO">Atrasado</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Origem</label>
          <select
            value={filtros.origem || ''}
            onChange={e => onChange({ ...filtros, origem: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-[#111827] outline-none cursor-pointer"
          >
            <option value="">Todas</option>
            <option value="COMPRA">Compra de Veículo</option>
            <option value="VENDA">Venda de Veículo</option>
            <option value="DESPESA_VEICULO">Despesa de Veículo</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="RETIRADA">Retirada</option>
            <option value="MANUAL">Manual / Outros</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ExtratoFilters;