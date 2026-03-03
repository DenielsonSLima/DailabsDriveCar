
import React, { useState, useEffect, useRef } from 'react';
import { IEmpresa } from '../empresa.types';

interface FormEmpresaProps {
  initialData: IEmpresa | null;
  onSubmit: (data: IEmpresa) => void;
  onConsultCnpj: (cnpj: string) => Promise<Partial<IEmpresa> | null>;
  isSaving: boolean;
}

const FormEmpresa: React.FC<FormEmpresaProps> = ({ initialData, onSubmit, onConsultCnpj, isSaving }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<IEmpresa>({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    email: '',
    telefone: '',
    website: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    logo_url: ''
  });

  const [isConsulting, setIsConsulting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const masked = formatCNPJ(initialData.cnpj);
      setFormData({ ...initialData, cnpj: masked });
    }
  }, [initialData]);

  const formatCNPJ = (value: string) => {
    let v = value.replace(/\D/g, ''); // Remove tudo o que não é dígito

    if (v.length > 14) v = v.slice(0, 14); // Limita a 14 dígitos

    // Coloca ponto entre o segundo e o terceiro dígitos
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');

    // Coloca ponto entre o quinto e o sexto dígitos
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');

    // Coloca uma barra entre o oitavo e o nono dígitos
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');

    // Coloca um hífen depois do bloco de quatro dígitos
    v = v.replace(/(\d{4})(\d)/, '$1-$2');

    return v;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      const maskedValue = formatCNPJ(value);
      setFormData(prev => ({ ...prev, [name]: maskedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConsult = async () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      alert('O CNPJ precisa ter 14 dígitos para a consulta.');
      return;
    }

    setIsConsulting(true);
    try {
      const data = await onConsultCnpj(cleanCnpj);
      if (data) {
        const formattedData = { ...data } as IEmpresa;
        if (formattedData.cnpj) formattedData.cnpj = formatCNPJ(formattedData.cnpj);
        // Mantém a logo atual se a API não retornar (o que é esperado)
        formattedData.logo_url = formData.logo_url;
        setFormData(prev => ({ ...prev, ...formattedData }));
      }
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      cnpj: formData.cnpj.replace(/\D/g, '')
    };
    onSubmit(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Identificação Fiscal</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Logo Section */}
        {/* Logo Section */}
        <div className="md:col-span-3">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Logo da Empresa</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-4 transition-all h-52 cursor-pointer overflow-hidden ${formData.logo_url
                ? 'border-indigo-200 bg-white'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'
              }`}
          >
            {formData.logo_url ? (
              <>
                <img src={formData.logo_url} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-[2rem]">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="p-2 bg-white rounded-xl text-indigo-600 hover:scale-110 transition-transform shadow-lg"
                    title="Alterar Logo"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="p-2 bg-rose-500 rounded-xl text-white hover:scale-110 transition-transform shadow-lg"
                    title="Remover Logo"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload Logo</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">CNPJ</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                maxLength={18}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                placeholder="00.000.000/0000-00"
              />
              <button
                type="button"
                onClick={handleConsult}
                disabled={isConsulting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
              >
                {isConsulting ? (
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
                Buscar
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Razão Social</label>
            <input
              type="text"
              name="razao_social"
              value={formData.razao_social}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Nome Fantasia</label>
            <input
              type="text"
              name="nome_fantasia"
              value={formData.nome_fantasia}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Inscrição Estadual</label>
            <input
              type="text"
              name="inscricao_estadual"
              value={formData.inscricao_estadual || ''}
              onChange={handleChange}
              placeholder="Isento"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Contato & Endereço</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">E-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="fiscal@empresa.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Telefone</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone || ''}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Website</label>
            <input
              type="text"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              placeholder="www.site.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-indigo-500 font-medium"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">CEP</label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Logradouro</label>
            <input
              type="text"
              name="logradouro"
              value={formData.logradouro}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Número</label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Bairro</label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Cidade</label>
            <input
              type="text"
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">UF</label>
            <input
              type="text"
              name="uf"
              value={formData.uf}
              onChange={handleChange}
              maxLength={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center font-black uppercase"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Complemento</label>
            <input
              type="text"
              name="complemento"
              value={formData.complemento || ''}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-6 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving}
          className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center disabled:opacity-50 active:scale-95"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </>
          ) : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
};

export default FormEmpresa;
