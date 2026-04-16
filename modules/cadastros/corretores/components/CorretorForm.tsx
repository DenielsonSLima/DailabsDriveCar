
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ICorretor } from '../corretores.types';

interface Props {
  initialData: ICorretor | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ICorretor>) => void;
}

const CorretorForm: React.FC<Props> = ({ initialData, isSaving, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<ICorretor>>({
    nome: '',
    sobrenome: '',
    cpf: '',
    telefone: '',
    ativo: true,
    ...initialData
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  // Máscaras
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let val: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (typeof val === 'string') {
      val = val.toUpperCase();
    }

    if (name === 'cpf') val = formatCPF(val as string);
    if (name === 'telefone') val = formatTelefone(val as string);

    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.sobrenome) return;
    onSubmit(formData);
  };
  // Travar scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const content = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">

        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {initialData ? 'Editar Corretor' : 'Novo Corretor'}
              </h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Dados Cadastrais</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome *</label>
              <input
                autoFocus
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Sobrenome *</label>
              <input
                name="sobrenome"
                value={formData.sobrenome}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">CPF</label>
              <input
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                disabled={isSaving}
                placeholder="000.000.000-00"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-mono font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                maxLength={14}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Telefone</label>
              <input
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                disabled={isSaving}
                placeholder="(00) 00000-0000"
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center space-x-3 cursor-pointer bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="relative">
                <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span className={`text-xs font-black uppercase tracking-wider ${formData.ativo ? 'text-emerald-600' : 'text-slate-400'}`}>
                {formData.ativo ? 'Corretor Ativo' : 'Corretor Inativo'}
              </span>
            </label>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center hover:bg-indigo-700 transition-all"
              >
                {isSaving ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default CorretorForm;
