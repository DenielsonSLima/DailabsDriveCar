
import React, { useState } from 'react';
import { IVeiculoFoto } from '../../estoque.types';

interface GalleryCardProps {
  fotos: IVeiculoFoto[];
}

const GalleryCard: React.FC<GalleryCardProps> = ({ fotos }) => {
  // Ordena para garantir que a capa (is_capa=true) seja a primeira
  const sortedPhotos = [...fotos].sort((a, b) => (a.is_capa === b.is_capa ? 0 : a.is_capa ? -1 : 1));
  const [activePhoto, setActivePhoto] = useState<string | null>(sortedPhotos.length > 0 ? sortedPhotos[0].url : null);

  return (
    <div className="dc-panel bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
      {/* Foto Principal - Altura 350px e Largura Limitada a 440px no container */}
      <div className="flex justify-center mb-4 bg-slate-50 rounded-2xl p-2">
        <div className="w-full max-w-[440px] h-[220px] sm:h-[260px] bg-slate-900 rounded-2xl overflow-hidden relative group shadow-sm">
          {activePhoto ? (
            <img src={activePhoto} className="w-full h-full object-cover" alt="Veículo Destaque" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
               <svg className="w-20 h-20 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               <span className="text-xs font-semibold normal-case tracking-normal mt-4 opacity-40">Sem fotos</span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {sortedPhotos.length > 0 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 px-1 pb-1">
          {sortedPhotos.map((foto, idx) => (
            <button 
              key={foto.id}
              onClick={() => setActivePhoto(foto.url)}
              className={`aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                activePhoto === foto.url 
                  ? 'border-indigo-500 ring-2 ring-indigo-200 ring-offset-2 opacity-100' 
                  : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-200'
              }`}
            >
              <img src={foto.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryCard;
