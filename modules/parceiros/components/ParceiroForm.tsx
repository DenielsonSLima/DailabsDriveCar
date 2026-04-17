import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IParceiro, TipoParceiro, PessoaTipo, ParceiroSchema } from '../parceiros.types';
import { ParceirosService } from '../parceiros.service';
import { maskCNPJ, maskCPF, maskCEP, maskPhone } from '../../../utils/formatters';
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
  const [isMounted, setIsMounted] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    setIsMounted(true);
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Formata o documento ao carregar dados iniciais
  useEffect(() => {
    if (initialData?.documento) {
      setFormData(prev => ({
        ...prev,
        documento: formatDocumento(initialData.documento!, initialData.pessoa_tipo),
        cep: maskCEP(initialData.cep),
        telefone: maskPhone(initialData.telefone),
        whatsapp: maskPhone(initialData.whatsapp)
      }));
    }
  }, [initialData]);

  const formatDocumento = (value: string, tipo: PessoaTipo) => {
    return tipo === PessoaTipo.FISICA ? maskCPF(value) : maskCNPJ(value);
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

    if (name === 'cep') {
      val = maskCEP(val as string);
    }

    if (name === 'telefone' || name === 'whatsapp') {
      val = maskPhone(val as string);
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
      showNotification('warning', 'Por favor, insira um CNPJ válido com 14 dígitos.');
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
        showNotification('error', 'Não foi possível encontrar dados para este CNPJ.');
      }
    } catch (error) {
      console.error("Erro na consulta de CNPJ:", error);
      showNotification('error', 'Erro ao consultar CNPJ. Tente novamente mais tarde.');
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

      showNotification('error', errorMessages.join(' | '));
      return;
    }

    // 2. Check for duplicate document
    const cleanDoc = formData.documento?.replace(/\D/g, '');
    if (cleanDoc) {
      const exists = await ParceirosService.checkDocumentExists(cleanDoc, initialData?.id);
      if (exists) {
        showNotification('error', 'Já existe um parceiro cadastrado com este documento (CPF/CNPJ).');
        return;
      }
    }

    try {
      onSubmit(formData);
    } catch (error) {
      showNotification('error', 'Erro ao salvar parceiro. Verifique os dados.');
    }
  };

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full h-full md:h-[90vh] md:max-w-5xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Notificação Interna */}
        {notification && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-lg">
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 border backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' :
                notification.type === 'warning' ? 'bg-amber-500 text-white border-amber-400' :
                  'bg-rose-600 text-white border-rose-400'
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : '❌'}
                </span>
                <span className="font-bold text-xs uppercase tracking-widest">{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/20 rounded-lg transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

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
    </div>,
    document.body
  );
};

export default ParceiroForm;
