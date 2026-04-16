
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ICidade } from '../cidades.types';

interface FormProps {
  initialData: ICidade | null;
  onClose: () => void;
  onSubmit: (data: Partial<ICidade>) => void;
}

const CidadeForm: React.FC<FormProps> = ({ initialData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<ICidade>>({
    nome: '',
    uf: '',
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const ufs = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {initialData ? 'Editar Cidade' : 'Nova Cidade'}
            </h2>
            <p className="text-slate-500 text-xs">Informe os dados básicos do município.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-rose-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="sm:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome do Município</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                autoFocus
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Ex: São Paulo"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">UF</label>
              <div className="relative">
                <select
                  name="uf"
                  value={formData.uf}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#111827] focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">...</option>
                  {ufs.map(item => (
                    <option key={item.sigla} value={item.sigla}>{item.sigla}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-4 border-t border-slate-50 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-10 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              {initialData ? 'Salvar Alterações' : 'Cadastrar Cidade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default CidadeForm;
