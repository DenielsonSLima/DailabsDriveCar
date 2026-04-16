
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IMontadora } from '../montadoras.types';
import { StorageService } from '../../../../lib/storage.service';

interface FormProps {
  initialData: IMontadora | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IMontadora>) => void;
}

const FormMontadora: React.FC<FormProps> = ({ initialData, isSaving, onClose, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<IMontadora>>({
    nome: '',
    logo_url: '',
    ...initialData
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    let finalLogoUrl = formData.logo_url;

    try {
      if (selectedFile) {
        finalLogoUrl = await StorageService.uploadImage(selectedFile, 'montadoras');
      }

      onSubmit({
        ...formData,
        logo_url: finalLogoUrl
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      // Mesmo com erro no upload, tentamos salvar (ou poderia mostrar erro)
      // Aqui optamos por alertar e não salvar para evitar dados inconsistentes se for crítico
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {initialData ? 'Editar Marca' : 'Nova Montadora'}
            </h2>
            <p className="text-slate-500 text-xs">A logo será exibida em todo o sistema e site.</p>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 disabled:opacity-30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-8 space-y-8">
          {/* Logo Section */}
          <div className="flex flex-col items-center">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest self-start ml-1">Logo da Montadora</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div
              onClick={() => !isSaving && fileInputRef.current?.click()}
              className={`w-40 h-40 border-2 border-dashed rounded-[2.5rem] flex items-center justify-center transition-all ${isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${formData.logo_url ? 'border-indigo-200 bg-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
                }`}
            >
              {formData.logo_url ? (
                <img src={formData.logo_url} className="max-h-full max-w-full object-contain p-6" alt="Logo Preview" />
              ) : (
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Upload Logo</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome da Montadora</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
              required
              disabled={isSaving}
              autoFocus
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
              placeholder="Ex: Toyota, BMW, Chevrolet..."
            />
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-8 py-4 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl disabled:opacity-30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-10 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                initialData ? 'Atualizar Marca' : 'Cadastrar Marca'
              )}
            </button>
          </div>
        </form>
      </div >
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default FormMontadora;
