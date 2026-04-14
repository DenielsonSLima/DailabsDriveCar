
import React, { useState, useEffect } from 'react';
import { IParceiro, TipoParceiro, PessoaTipo, ParceiroSchema } from '../parceiros.types';
import { ParceirosService } from '../parceiros.service';
import toast from 'react-hot-toast';
import ParceiroIdentificationForm from './ParceiroIdentificationForm';
import ParceiroContactForm from './ParceiroContactForm';
import ParceiroAddressForm from './ParceiroAddressForm';

interface FormProps {
  initialData: IParceiro | null;
  onClose: () => void;
  onSubmit: (data: Partial<IParceiro>) => void;
}

const ParceiroForm: React.FC<FormProps> = ({ initialData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<Partial<IParceiro>>({
    pessoa_tipo: PessoaTipo.JURIDICA,
    nome: '',
    documento: '',
    tipo: TipoParceiro.CLIENTE,
    ativo: true,
    email: '',
    telefone: '',
    whatsapp: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    ...initialData
  });

  const [isConsulting, setIsConsulting] = useState(false);

  // Formata o documento ao carregar dados iniciais
  useEffect(() => {
    if (initialData?.documento) {
      setFormData(prev => ({
        ...prev,
        documento: formatDocumento(initialData.documento!, initialData.pessoa_tipo)
      }));
    }
  }, [initialData]);

  const formatDocumento = (value: string, tipo: PessoaTipo) => {
    const v = value.replace(/\D/g, '');

    if (tipo === PessoaTipo.FISICA) {
      // CPF: 000.000.000-00
      return v
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      // CNPJ: 00.000.000/0000-00
      return v
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let val: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (typeof val === 'string' && name !== 'email') {
      val = val.toUpperCase();
    }

    if (name === 'documento') {
      val = formatDocumento(val as string, formData.pessoa_tipo || PessoaTipo.JURIDICA);
    }

    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleTypeChange = (newType: PessoaTipo) => {
    setFormData(prev => ({
      ...prev,
      pessoa_tipo: newType,
      documento: '' // Limpa o documento para evitar máscaras incorretas
    }));
  };

  const handleCnpjLookup = async () => {
    const cleanCnpj = formData.documento?.replace(/\D/g, '');
    if (cleanCnpj?.length !== 14) {
      alert('Por favor, insira um CNPJ válido com 14 dígitos.');
      return;
    }

    setIsConsulting(true);
    try {
      const data = await ParceirosService.consultarCNPJ(cleanCnpj);
      if (data) {
        setFormData(prev => ({
          ...prev,
          nome: data.nome_fantasia || data.razao_social || '',
          razao_social: data.razao_social || '',
          email: data.email || '',
          telefone: data.ddd_telefone_1 || '',
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          bairro: data.bairro || '',
          cidade: data.municipio || '',
          uf: data.uf || ''
        }));
      } else {
        alert('Não foi possível encontrar dados para este CNPJ.');
      }
    } catch (error) {
      console.error("Erro na consulta de CNPJ:", error);
      alert('Erro ao consultar CNPJ. Tente novamente mais tarde.');
    } finally {
      setIsConsulting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Zod Validation
    const validation = ParceiroSchema.safeParse(formData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const errorMessages = Object.entries(errors).map(([field, msgs]) => {
        return `${msgs?.[0]}`;
      });

      errorMessages.forEach(msg => toast.error(msg));
      return;
    }

    // 2. Check for duplicate document
    const cleanDoc = formData.documento?.replace(/\D/g, '');
    if (cleanDoc) {
      const exists = await ParceirosService.checkDocumentExists(cleanDoc, initialData?.id);
      if (exists) {
        toast.error('Já existe um parceiro cadastrado com este documento (CPF/CNPJ).');
        return;
      }
    }

    try {
      onSubmit(formData);
      toast.success(initialData ? 'Parceiro atualizado!' : 'Parceiro cadastrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar parceiro. Verifique os dados.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {initialData ? 'Editar Parceiro' : 'Novo Parceiro'}
              </h2>
              <p className="text-slate-500 text-xs text-slate-400">Configure os dados de identificação e localização.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all text-slate-400 hover:text-rose-500 shadow-sm border border-transparent hover:border-slate-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
          <ParceiroIdentificationForm
            formData={formData}
            onChange={handleChange}
            onTypeChange={handleTypeChange}
            onCnpjLookup={handleCnpjLookup}
            isConsulting={isConsulting}
          />

          <ParceiroContactForm
            formData={formData}
            onChange={handleChange}
          />

          <ParceiroAddressForm
            formData={formData}
            onChange={handleChange}
          />
        </form>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-12 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            Salvar Parceiro
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParceiroForm;
