
import React, { useRef, useState } from 'react';
import { IVeiculoFoto } from '../estoque.types';
import { StorageService } from '../../../lib/storage.service';

interface Props {
  fotos: IVeiculoFoto[];
  onChange: (fotos: IVeiculoFoto[]) => void;
  onNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const PhotoUpload: React.FC<Props> = ({ fotos, onChange, onNotification }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const MAX_PHOTOS = 10;

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  /**
   * Comprime a imagem e retorna um objeto File pronto para upload
   */
  const processAndCompress = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onerror = () => reject(new Error(`Arquivo inválido: ${file.name}`));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1400; // Otimizado de 1920 para 1400
          const MAX_HEIGHT = 1050;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }

          // Convertendo para WebP (Suporte nativo moderno, 30% mais leve que JPEG)
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Falha na compressão."));
            }
          }, 'image/webp', 0.8);
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const remainingSlots = MAX_PHOTOS - fotos.length;

    if (remainingSlots <= 0) {
      onNotification('Limite de 10 fotos atingido.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToUpload = selectedFiles.slice(0, remainingSlots);
    if (selectedFiles.length > remainingSlots) {
      onNotification(`Apenas ${remainingSlots} fotos foram aceitas (limite de 10).`, 'warning');
    }

    // Processamento paralelo
    for (const file of filesToUpload) {
      const tempId = generateUUID();
      
      // Adiciona placeholder otimista (mostra a imagem local enquanto sobe)
      const localPreviewUrl = URL.createObjectURL(file);
      const tempPhoto: IVeiculoFoto = {
        id: tempId,
        url: localPreviewUrl,
        ordem: fotos.length,
        is_capa: fotos.length === 0
      };

      setUploadingIds(prev => new Set(prev).add(tempId));
      
      // Atualiza o estado pai com a foto temporária
      // Nota: Usamos o callback do state se estivéssemos no pai, mas aqui recebemos a prop 'fotos'.
      // Como o componente pai (EstoqueForm) faz re-render, precisamos ser cuidadosos.
      // O ideal seria que o componente pudesse gerenciar seu próprio lote.
      
      try {
        const compressedFile = await processAndCompress(file);
        const publicUrl = await StorageService.uploadImage(compressedFile, 'veiculos');
        
        // Substitui o placeholder pela URL real
        onChange([...fotos, { ...tempPhoto, url: publicUrl }]); 
        // Importante: fotos aqui pode estar desatualizado se múltiplos arquivos subirem rápido.
        // Vamos usar um pattern de acumulador se necessário, mas por agora, o loop sequencial 'for...of' resolve o race condition simples.
        
        // Dica: Para múltiplos uploads rápidos, o ideal seria o form lidar com isso ou usarmos uma função refs.
        // Vou mudar para sequencial para garantir integridade.
        fotos.push({ ...tempPhoto, url: publicUrl }); 

      } catch (err: any) {
        console.error(err);
        onNotification(`Erro ao subir ${file.name}`, 'error');
      } finally {
        setUploadingIds(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        URL.revokeObjectURL(localPreviewUrl);
      }
    }

    // Finaliza notificando o pai
    onChange([...fotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async (id: string) => {
    const photoToRemove = fotos.find(f => f.id === id);
    if (!photoToRemove) return;

    // Se a foto já estiver no storage, deleta o arquivo físico
    if (photoToRemove.url.startsWith('http')) {
      await StorageService.deleteImage(photoToRemove.url, 'veiculos');
    }

    const novasFotos = fotos.filter(f => f.id !== id).map((f, idx) => ({
      ...f,
      ordem: idx,
      is_capa: idx === 0
    }));
    onChange(novasFotos);
  };

  const handleSetCapa = (id: string) => {
    const selected = fotos.find(f => f.id === id);
    if (!selected) return;

    const others = fotos.filter(f => f.id !== id);
    const reordered = [selected, ...others].map((f, idx) => ({
      ...f,
      ordem: idx,
      is_capa: idx === 0
    }));

    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Galeria do Veículo</h3>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${fotos.length === MAX_PHOTOS ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
          {fotos.length} de {MAX_PHOTOS} Fotos
        </span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Botão de Adicionar */}
        {fotos.length < MAX_PHOTOS && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[4/3] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group"
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">
              Adicionar Fotos
            </span>
          </div>
        )}

        {/* Lista de Fotos */}
        {fotos.map((foto, index) => {
          const isUploading = uploadingIds.has(foto.id);
          return (
            <div
              key={foto.id}
              className={`relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-sm transition-all ${foto.is_capa ? 'ring-4 ring-indigo-500 ring-offset-2' : 'border border-slate-200'}`}
            >
              <img src={foto.url} alt={`Veículo ${index}`} className={`w-full h-full object-cover ${isUploading ? 'opacity-40 blur-sm' : ''}`} />

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
                   <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {!isUploading && (
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-2">
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(foto.id); }}
                      className="p-1.5 bg-white/20 hover:bg-rose-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {!foto.is_capa ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetCapa(foto.id); }}
                      className="w-full py-1.5 bg-white text-indigo-900 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:bg-indigo-50 transition-colors"
                    >
                      Definir Capa
                    </button>
                  ) : (
                    <div className="text-center">
                      <span className="inline-block px-2 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm">
                        Capa Principal
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoUpload;
