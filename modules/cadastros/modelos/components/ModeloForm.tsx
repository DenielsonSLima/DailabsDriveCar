
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IModelo } from '../modelos.types';
import { IMontadora } from '../../montadoras/montadoras.types';
import { MontadorasService } from '../../montadoras/montadoras.service';
import { ITipoVeiculo } from '../../tipos-veiculos/tipos-veiculos.types';
import { TiposVeiculosService } from '../../tipos-veiculos/tipos-veiculos.service';
import { StorageService } from '../../../../lib/storage.service';

interface FormProps {
  initialData: IModelo | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IModelo>) => void;
}

const ModeloForm: React.FC<FormProps> = ({ initialData, isSaving, onClose, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [montadoras, setMontadoras] = useState<IMontadora[]>([]);
  const [tipos, setTipos] = useState<ITipoVeiculo[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState<Partial<IModelo>>({
    nome: '',
    montadora_id: '',
    tipo_veiculo_id: '',
    foto_url: '',
    ...initialData
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchOptions() {
      setLoadingOptions(true);
      try {
        const [mRes, tRes] = await Promise.all([
          MontadorasService.getAll(),
          TiposVeiculosService.getAll()
        ]);
        setMontadoras(mRes);
        setTipos(tRes);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true); // Reusing isSaving prop visually, but local state for logic if needed

    let finalFotoUrl = formData.foto_url;

    try {
      if (selectedFile) {
        finalFotoUrl = await StorageService.uploadImage(selectedFile, 'modelos');
      }

      onSubmit({
        ...formData,
        foto_url: finalFotoUrl
      });
    } catch (error) {
      console.error('Erro ao upload imagem modelo:', error);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.endsWith('_id') ? value : value.toUpperCase()
    }));
  };
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {initialData?.id ? 'Editar Modelo' : 'Novo Modelo'}
            </h2>
            <p className="text-slate-500 text-xs">Vincule o modelo a uma marca, tipo e adicione uma imagem.</p>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 disabled:opacity-30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-8 space-y-6 overflow-y-auto">
          {/* Foto Section */}
          <div className="flex flex-col items-center">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest self-start ml-1">Foto do Modelo (Opcional)</label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div
              onClick={() => !isSaving && fileInputRef.current?.click()}
              className={`w-full h-40 border-2 border-dashed rounded-[2rem] flex items-center justify-center transition-all overflow-hidden ${isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${formData.foto_url ? 'border-indigo-200 bg-white' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
                }`}
            >
              {formData.foto_url ? (
                <img src={formData.foto_url} className="w-full h-full object-cover" alt="Modelo Preview" />
              ) : (
                <div className="text-center">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm text-slate-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Imagem</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome do Modelo *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome || ''}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                placeholder="Ex: Corolla, Civic, Onix..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Montadora *</label>
                <select
                  name="montadora_id"
                  value={formData.montadora_id || ''}
                  onChange={handleChange}
                  required
                  disabled={isSaving || loadingOptions}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none disabled:opacity-50"
                >
                  <option value="">Marca...</option>
                  {montadoras.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Tipo de Veículo *</label>
                <select
                  name="tipo_veiculo_id"
                  value={formData.tipo_veiculo_id || ''}
                  onChange={handleChange}
                  required
                  disabled={isSaving || loadingOptions}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none disabled:opacity-50"
                >
                  <option value="">Categoria...</option>
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-8 py-3 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl disabled:opacity-30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-10 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center min-w-[180px] disabled:opacity-50 active:scale-95"
            >
              {isSaving ? 'Salvando...' : (initialData?.id ? 'Atualizar Modelo' : 'Cadastrar Modelo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default ModeloForm;
