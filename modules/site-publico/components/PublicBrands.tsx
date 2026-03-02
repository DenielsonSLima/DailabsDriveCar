import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IMontadoraPublic } from '../site-publico.types';

interface Props {
  montadoras: IMontadoraPublic[];
}

const PublicBrands: React.FC<Props> = React.memo(({ montadoras }) => {
  const navigate = useNavigate();

  if (!montadoras || montadoras.length === 0) return null;

  const handleBrandClick = (id: string) => {
    navigate(`/estoque-publico?marca=${id}`);
  };

  return (
    <section className="py-16 bg-white overflow-hidden animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 flex items-baseline justify-between">
          <div>
            <p className="text-[#004691] text-[9px] font-black uppercase tracking-[0.6em] mb-2">Linha de Frente</p>
            <h2 className="text-4xl font-[900] text-slate-900 uppercase tracking-tighter leading-none">Marcas em Destaque</h2>
          </div>
          <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Explore por fabricante</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {montadoras.map((m) => (
            <button
              key={m.id}
              onClick={() => handleBrandClick(m.id)}
              className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center hover:border-indigo-200 hover:shadow-[0_20px_50px_-20px_rgba(0,70,145,0.15)] transition-all duration-500 cursor-pointer relative overflow-hidden active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#004691]/20"
            >
              {/* Logo sem grayscale e com scale no hover */}
              <div className="h-16 w-full flex items-center justify-center mb-4 transition-transform duration-500 transform group-hover:scale-125">
                {m.logo_url ? (
                  <img src={m.logo_url} className="max-h-full max-w-full object-contain" alt={m.nome} />
                ) : (
                  <span className="text-2xl font-black text-slate-200">{m.nome.charAt(0)}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:text-[#004691] transition-colors">{m.nome}</h4>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full group-hover:bg-[#004691] group-hover:text-white transition-colors">{m.total_veiculos}</span>
              </div>

              {/* Glow Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
});

PublicBrands.displayName = 'PublicBrands';

export default PublicBrands;