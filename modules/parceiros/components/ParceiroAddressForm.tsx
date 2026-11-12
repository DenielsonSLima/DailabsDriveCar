import React from 'react';
import { IParceiro } from '../parceiros.types';

interface Props {
    formData: Partial<IParceiro>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ParceiroAddressForm: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-indigo-500 normal-case tracking-normal flex items-center">
                    <span className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center mr-2 text-indigo-400">03</span>
                    Localização
                </h3>
                <button
                    type="button"
                    onClick={() => {
                        onChange({ target: { name: 'cep', value: '00000-000' } } as any);
                        onChange({ target: { name: 'logradouro', value: 'NÃO INFORMADO' } } as any);
                        onChange({ target: { name: 'numero', value: 'S/N' } } as any);
                        onChange({ target: { name: 'bairro', value: 'NÃO INFORMADO' } } as any);
                        onChange({ target: { name: 'cidade', value: 'NÃO INFORMADO' } } as any);
                        onChange({ target: { name: 'uf', value: 'SE' } } as any);
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-600 normal-case tracking-normal bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                >
                    Endereço não informado
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">CEP</label>
                    <input
                        type="text"
                        name="cep"
                        id="cep"
                        value={formData.cep || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium dc-input"
                        placeholder="00000-000"
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">Logradouro / Rua</label>
                    <input
                        type="text"
                        name="logradouro"
                        id="logradouro"
                        value={formData.logradouro || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dc-input"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">Número</label>
                    <input
                        type="text"
                        name="numero"
                        id="numero"
                        value={formData.numero || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dc-input"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">UF</label>
                    <input
                        type="text"
                        name="uf"
                        id="uf"
                        value={formData.uf || ''}
                        onChange={onChange}
                        maxLength={2}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none normal-case text-center font-semibold text-slate-900 dc-input"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">Bairro</label>
                    <input
                        type="text"
                        name="bairro"
                        id="bairro"
                        value={formData.bairro || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dc-input"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">Cidade</label>
                    <input
                        type="text"
                        name="cidade"
                        id="cidade"
                        value={formData.cidade || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium dc-input"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 normal-case mb-2 tracking-normal ml-1">Complemento</label>
                    <input
                        type="text"
                        name="complemento"
                        id="complemento"
                        value={formData.complemento || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3  focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dc-input"
                    />
                </div>
            </div>
        </section>
    );
};

export default ParceiroAddressForm;
