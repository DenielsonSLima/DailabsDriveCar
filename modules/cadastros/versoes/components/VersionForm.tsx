
import React, { useState, useEffect } from 'react';
import { IVersao } from '../versoes.types';

// Services dos Submódulos
import { MotorizacaoService } from '../../motorizacao/motorizacao.service';
import { IMotorizacao } from '../../motorizacao/motorizacao.types';
import { CombustivelService } from '../../combustivel/combustivel.service';
import { ICombustivel } from '../../combustivel/combustivel.types';
import { TransmissaoService } from '../../transmissao/transmissao.service';
import { ITransmissao } from '../../transmissao/transmissao.types';

interface Props {
  initialData: IVersao | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IVersao>) => void;
}

const VersionForm: React.FC<Props> = ({ initialData, isSaving, onClose, onSubmit }) => {
  // Estados para as listas de opções
  const [motores, setMotores] = useState<IMotorizacao[]>([]);
  const [combustiveis, setCombustiveis] = useState<ICombustivel[]>([]);
  const [transmissoes, setTransmissoes] = useState<ITransmissao[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [formData, setFormData] = useState<Partial<IVersao>>({
    nome: '',
    motorizacao: '',
    transmissao: '',
    combustivel: '',
    ano_modelo: new Date().getFullYear(),
    ano_fabricacao: new Date().getFullYear(),
    ...initialData
  });

  // Carregar dados dos submódulos ao montar
  useEffect(() => {
    async function loadOptions() {
      try {
        const [resMotores, resCombustiveis, resTransmissoes] = await Promise.all([
          MotorizacaoService.getAll(),
          CombustivelService.getAll(),
          TransmissaoService.getAll()
        ]);
        setMotores(resMotores);
        setCombustiveis(resCombustiveis);
        setTransmissoes(resTransmissoes);
      } catch (error) {
        console.error("Erro ao carregar opções técnicas", error);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                {initialData ? 'Editar Variante' : 'Nova Versão'}
              </h2>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">Configuração técnica oficial</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-rose-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Nome da Versão Comercial *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                disabled={isSaving}
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-[#111827] uppercase disabled:opacity-50"
                placeholder="Ex: LTZ, PREMIERE, HIGHLINE..."
              />
            </div>

            {/* Motorização Dinâmica */}
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Motorização</label>
              <div className="relative">
                <select
                  name="motorizacao"
                  value={formData.motorizacao}
                  onChange={handleChange}
                  disabled={isSaving || loadingOptions}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#111827] appearance-none outline-none disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Selecione o Motor...</option>
                  {motores.map(m => (
                    <option key={m.id} value={m.nome}>{m.nome}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Combustível Dinâmico */}
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Combustível</label>
              <div className="relative">
                <select
                  name="combustivel"
                  value={formData.combustivel}
                  onChange={handleChange}
                  disabled={isSaving || loadingOptions}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#111827] appearance-none outline-none disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Selecione...</option>
                  {combustiveis.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Transmissão Dinâmica */}
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Transmissão</label>
              <div className="relative">
                <select
                  name="transmissao"
                  value={formData.transmissao}
                  onChange={handleChange}
                  disabled={isSaving || loadingOptions}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#111827] appearance-none outline-none disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Selecione...</option>
                  {transmissoes.map(t => (
                    <option key={t.id} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Ano Fabr.</label>
                <input type="number" name="ano_fabricacao" value={formData.ano_fabricacao} onChange={handleChange} required disabled={isSaving} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-widest">Ano Mod.</label>
                <input type="number" name="ano_modelo" value={formData.ano_modelo} onChange={handleChange} required disabled={isSaving} className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-3.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-10 py-3.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center min-w-[180px] disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full mr-2" />
                  <span>Processando</span>
                </div>
              ) : (initialData?.id ? 'Atualizar Dados' : 'Gravar Versão')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VersionForm;
