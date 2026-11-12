import React from 'react';
import { IParceiro, PessoaTipo, TipoParceiro } from '../parceiros.types';

interface Props {
    formData: Partial<IParceiro>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onTypeChange: (newType: PessoaTipo) => void;
    onCnpjLookup: () => void;
    isConsulting: boolean;
}

const ParceiroIdentificationForm: React.FC<Props> = ({
    formData,
    onChange,
    onTypeChange,
    onCnpjLookup,
    isConsulting
}) => {
    return (
        <section className="space-y-6">
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1.5 rounded-2xl flex w-full max-w-sm">
                    <button
                        type="button"
                        onClick={() => onTypeChange(PessoaTipo.FISICA)}
                        className={`flex-1 py-3 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all ${formData.pessoa_tipo === PessoaTipo.FISICA
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Pessoa Física
                    </button>
                    <button
                        type="button"
                        onClick={() => onTypeChange(PessoaTipo.JURIDICA)}
                        className={`flex-1 py-3 rounded-xl text-xs font-semibold normal-case tracking-normal transition-all ${formData.pessoa_tipo === PessoaTipo.JURIDICA
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Pessoa Jurídica
                    </button>
                </div>
            </div>

            <h3 className="text-xs font-semibold text-indigo-500 normal-case tracking-normal flex items-center">
                <span className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center mr-2 text-indigo-400">01</span>
                Dados de Identificação
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">
                        {formData.pessoa_tipo === PessoaTipo.FISICA ? 'CPF' : 'CNPJ'}
                        <button 
                            type="button" 
                            onClick={() => onChange({ target: { name: 'documento', value: '' } } as any)}
                            className="ml-2 text-xs text-indigo-400 hover:text-indigo-600 underline lowercase"
                        >
                            (Não informado)
                        </button>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="documento"
                            id="documento"
                            value={formData.documento || ''}
                            onChange={onChange}
                            maxLength={formData.pessoa_tipo === PessoaTipo.FISICA ? 14 : 18}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-medium text-slate-900 dc-input"
                            placeholder={formData.pessoa_tipo === PessoaTipo.FISICA ? "000.000.000-00" : "00.000.000/0000-00"}
                        />
                        {formData.pessoa_tipo === PessoaTipo.JURIDICA && (
                            <button
                                type="button"
                                onClick={onCnpjLookup}
                                disabled={isConsulting || (formData.documento?.length || 0) < 14}
                                className="px-5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-100 flex items-center justify-center font-semibold"
                                title="Consultar Dados"
                            >
                                {isConsulting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="md:col-span-8">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">
                        {formData.pessoa_tipo === PessoaTipo.FISICA ? 'Nome Completo' : 'Nome Fantasia'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="nome"
                        id="nome"
                        value={formData.nome || ''}
                        onChange={onChange}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-900 dc-input"
                    />
                </div>

                {formData.pessoa_tipo === PessoaTipo.JURIDICA && (
                    <div className="md:col-span-8">
                        <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">Razão Social</label>
                        <input
                            type="text"
                            name="razao_social"
                            id="razao_social"
                            value={formData.razao_social || ''}
                            onChange={onChange}
                            className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dc-input"
                        />
                    </div>
                )}

                <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">Perfil do Parceiro</label>
                    <select
                        name="tipo"
                        id="tipo"
                        value={formData.tipo}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium appearance-none text-slate-900 dc-input"
                    >
                        <option value={TipoParceiro.CLIENTE}>Cliente</option>
                        <option value={TipoParceiro.FORNECEDOR}>Fornecedor</option>
                        <option value={TipoParceiro.AMBOS}>Cliente e Fornecedor (Ambos)</option>
                    </select>
                </div>
            </div>
        </section>
    );
};

export default ParceiroIdentificationForm;
