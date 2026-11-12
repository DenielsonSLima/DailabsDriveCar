import React, { useState, useEffect } from 'react';
import { FinanceiroService } from '../../../financeiro.service';
import { ICategoriaFinanceira } from '../../../financeiro.types';

const CategoriasManager: React.FC = () => {
  const [cats, setCats] = useState<ICategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await FinanceiroService.getCategorias();
    setCats(data);
    setLoading(false);
  }

  return (
    <div className="dc-panel bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="dc-section-title text-sm font-semibold normal-case text-slate-400 tracking-normal">Plano de Contas / Categorias</h3>
        <button className="dc-button text-xs font-semibold text-indigo-600 hover:underline normal-case">Nova Categoria</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cats.map(c => (
          <div key={c.id} className="dc-panel flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${c.natureza === 'ENTRADA' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <span className="text-xs font-medium text-slate-700 normal-case">{c.nome}</span>
            </div>
            <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 normal-case">{c.tipo}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriasManager;