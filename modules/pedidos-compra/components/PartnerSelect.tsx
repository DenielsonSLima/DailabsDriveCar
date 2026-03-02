
import React, { useState, useRef, useEffect } from 'react';
import { IParceiro } from '../../parceiros/parceiros.types';

interface Props {
  parceiros: IParceiro[];
  selectedId?: string;
  onChange: (parceiro: IParceiro) => void;
  disabled?: boolean;
  label?: string;
}

const PartnerSelect: React.FC<Props> = ({ parceiros, selectedId, onChange, disabled, label = "Parceiro" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedPartner = parceiros.find(p => p.id === selectedId);
  const filtered = parceiros.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.documento && p.documento.includes(search))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{label}</label>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-300 hover:shadow-md'}`}
      >
        {selectedPartner ? (
          <span className="font-bold text-slate-900 uppercase">{selectedPartner.nome}</span>
        ) : (
          <span className="text-slate-400 font-bold italic">Clique para selecionar...</span>
        )}
        {!disabled && (
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              placeholder="Pesquisar fornecedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => { onChange(p); setIsOpen(false); }}
                className="p-4 hover:bg-indigo-50 cursor-pointer flex flex-col transition-colors border-b border-slate-50 last:border-0"
              >
                <span className="text-sm font-black text-slate-900 uppercase">{p.nome}</span>
                <span className="text-[10px] text-slate-400 font-mono">{p.documento}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSelect;
