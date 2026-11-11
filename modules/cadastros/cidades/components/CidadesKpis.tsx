
import React from 'react';
import { ICidade } from '../cidades.types';

interface KpiProps {
  cidades: ICidade[];
}

const CidadesKpis: React.FC<KpiProps> = ({ cidades }) => {
  const totalEstados = new Set(cidades.map(c => c.uf)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500 text-xs font-medium normal-case tracking-normal">Total de Cidades</p>
        <h3 className="text-2xl font-semibold text-slate-900 mt-1">{cidades.length}</h3>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500 text-xs font-medium normal-case tracking-normal">Estados Atendidos</p>
        <h3 className="text-2xl font-semibold text-indigo-600 mt-1">{totalEstados}</h3>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-slate-500 text-xs font-medium normal-case tracking-normal">Região Principal</p>
        <h3 className="text-2xl font-semibold text-slate-900 mt-1">Sudoeste</h3>
      </div>
    </div>
  );
};

export default CidadesKpis;
