import React from 'react';
import { IMontadoraPublic } from '../../site-publico.types';
import { SortOption, GroupOption } from '../EstoquePublico.page';

interface Props {
  montadoras: IMontadoraPublic[];
  selectedBrand: string | null;
  setSelectedBrand: (id: string | null) => void;
  minPrice: number | '';
  setMinPrice: (v: number | '') => void;
  maxPrice: number | '';
  setMaxPrice: (v: number | '') => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  groupBy: GroupOption;
  setGroupBy: (v: GroupOption) => void;
  whatsappPhone?: string;
}

const EstoquePublicoFilters: React.FC<Props> = ({ 
  montadoras, selectedBrand, setSelectedBrand, minPrice, setMinPrice, maxPrice, setMaxPrice,
  sortBy, setSortBy, groupBy, setGroupBy, whatsappPhone
}) => {
  
  const handlePriceInput = (val: string, setter: (v: number | '') => void) => {
    const clean = val.replace(/\D/g, '');
    setter(clean === '' ? '' : parseInt(clean));
  };

  const formatInput = (val: number | '') => {
    if (val === '') return '';
    return new Intl.NumberFormat('pt-BR').format(val);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
      
      {/* 1. SELETOR DE MARCAS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Fabricantes</h3>
           {selectedBrand && (
             <button onClick={() => setSelectedBrand(null)} className="text-[9px] font-black text-orange-600 uppercase hover:underline">Limpar</button>
           )}
        </div>
        
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {montadoras.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedBrand(selectedBrand === m.id ? null : m.id)}
              className={`w-full group flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-300 ${
                selectedBrand === m.id 
                  ? 'bg-white border-orange-500 shadow-md ring-4 ring-orange-500/5 scale-[1.02]' 
                  : 'bg-white border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                  {m.logo_url ? <img src={m.logo_url} className="max-h-full max-w-full object-contain" alt="" /> : <span className="text-[10px] font-black">{m.nome.charAt(0)}</span>}
                </div>
                <span className={`text-[11px] font-black uppercase truncate ${selectedBrand === m.id ? 'text-orange-600' : 'text-slate-600'}`}>{m.nome}</span>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${selectedBrand === m.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{m.total_veiculos}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. FAIXA DE PREÇO */}
      <div className="space-y-6">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] px-1">Faixa de Preço</h3>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Mínimo</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
              <input type="text" placeholder="0" value={formatInput(minPrice)} onChange={(e) => handlePriceInput(e.target.value, setMinPrice)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#004691] transition-all" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Máximo</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
              <input type="text" placeholder="Ilimitado" value={formatInput(maxPrice)} onChange={(e) => handlePriceInput(e.target.value, setMaxPrice)} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-[#004691] transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. ORDENAÇÃO E AGRUPAMENTO (MOVIDOS PARA CÁ) */}
      <div className="space-y-6">
         <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] px-1">Modos de Visualização</h3>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Ordenar por</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
              >
                <option value="created_desc">Mais Recentes</option>
                <option value="preco_asc">Valor: Menor para Maior</option>
                <option value="preco_desc">Valor: Maior para Menor</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Agrupar visão</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setGroupBy('none')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${groupBy === 'none' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>Lista</button>
                <button onClick={() => setGroupBy('montadora')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${groupBy === 'montadora' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>Marca</button>
                <button onClick={() => setGroupBy('tipo')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${groupBy === 'tipo' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>Módulo</button>
              </div>
            </div>
         </div>
      </div>

      <div className="bg-[#050a14] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
         <h4 className="text-sm font-black uppercase tracking-tighter relative z-10">Atendimento Premium</h4>
         <p className="text-[10px] text-slate-300 mt-2 leading-relaxed relative z-10 opacity-70">Nossos consultores estão prontos para ajudar você com as melhores condições.</p>
         <button
           onClick={() => {
             const phone = (whatsappPhone || '').replace(/\D/g, '');
             const message = encodeURIComponent('Olá! Gostaria de falar com um consultor sobre os veículos disponíveis.');
             window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
           }}
           className="mt-6 w-full py-4 bg-white text-[#050a14] rounded-2xl text-[9px] font-[900] uppercase tracking-widest shadow-lg hover:bg-slate-50 transition-all relative z-10 active:scale-95"
         >
           Falar com Consultor
         </button>
      </div>
    </div>
  );
};

export default EstoquePublicoFilters;