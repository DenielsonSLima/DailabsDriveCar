
import React, { useRef, useState } from 'react';
import { IVeiculoFoto } from '../estoque.types';

interface Props {
  fotos: IVeiculoFoto[];
  onChange: (fotos: IVeiculoFoto[]) => void;
  onNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const PhotoUpload: React.FC<Props> = ({ fotos, onChange, onNotification }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const MAX_PHOTOS = 10;

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para contextos não seguros (HTTP) ou navegadores antigos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Fix: Explicitly typing selectedFiles as File[] to prevent inference issues
      let selectedFiles: File[] = Array.from(e.target.files);
      const currentCount = fotos.length;
      const remainingSlots = MAX_PHOTOS - currentCount;

      // Se não há espaço, retorna (embora a UI deva prevenir isso)
      if (remainingSlots <= 0) {
        onNotification('O limite de 10 fotos já foi atingido.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Lógica de Corte (Slice)
      if (selectedFiles.length > remainingSlots) {
        onNotification(`Você selecionou ${selectedFiles.length} fotos, mas só restam ${remainingSlots} vagas. Apenas as primeiras ${remainingSlots} foram adicionadas.`, 'warning');
        selectedFiles = selectedFiles.slice(0, remainingSlots);
      }

      // Função auxiliar para comprimir e converter imagem para Base64
      const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onerror = () => {
            console.error('Erro ao ler arquivo:', file.name);
            reject(new Error(`Erro ao ler o arquivo ${file.name}`));
          };

          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onerror = () => {
              console.error('Erro ao carregar imagem para compressão:', file.name);
              reject(new Error(`O arquivo ${file.name} não é uma imagem válida ou não é suportado.`));
            };

            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1920;
              const MAX_HEIGHT = 1080;
              let width = img.width;
              let height = img.height;

              // Redimensionamento proporcional
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
              ctx?.drawImage(img, 0, 0, width, height);

              // Compressão JPEG 0.8
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve(dataUrl);
            };
          };
        });
      };

      setIsProcessing(true);
      try {
        // Processa as imagens selecionadas com compressão
        const results = await Promise.allSettled(selectedFiles.map((file: File) => compressImage(file)));

        const base64Results: string[] = [];
        const errors: string[] = [];

        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            base64Results.push(result.value);
          } else {
            errors.push(result.reason.message || `Erro ao processar ${selectedFiles[idx].name}`);
          }
        });

        if (errors.length > 0) {
          onNotification(`${errors.length} foto(s) falharam: ${errors.join(', ')}`, 'error');
        }

        if (base64Results.length > 0) {
          // Cria os objetos de foto
          const newPhotos: IVeiculoFoto[] = base64Results.map((url, index) => ({
            id: generateUUID(),
            url: url,
            ordem: currentCount + index,
            // Se não havia fotos antes, a primeira do novo lote é a capa
            is_capa: currentCount === 0 && index === 0
          }));

          onChange([...fotos, ...newPhotos]);
          if (errors.length === 0) {
            onNotification(`${base64Results.length} foto(s) adicionadas com sucesso.`, 'success');
          }
        }
      } catch (err) {
        console.error('Erro fatal no processamento de imagens:', err);
        onNotification('Ocorreu um erro inesperado ao processar as imagens.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }

    // Reset input para permitir selecionar as mesmas fotos novamente se necessário
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (id: string) => {
    const novasFotos = fotos.filter(f => f.id !== id).map((f, idx) => ({
      ...f,
      ordem: idx,
      is_capa: idx === 0 // Garante que o primeiro sempre seja capa se a capa for deletada
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
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`aspect-[4/3] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
            <span className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">
              {isProcessing ? 'Processando...' : 'Adicionar Fotos'}
            </span>
          </div>
        )}

        {/* Lista de Fotos */}
        {fotos.map((foto, index) => (
          <div
            key={foto.id}
            className={`relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-sm transition-all ${foto.is_capa ? 'ring-4 ring-indigo-500 ring-offset-2' : 'border border-slate-200'
              }`}
          >
            <img src={foto.url} alt={`Veículo ${index}`} className="w-full h-full object-cover" />

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
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoUpload;
