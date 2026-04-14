import React from 'react';
import { IParceiro } from '../parceiros.types';

interface Props {
    formData: Partial<IParceiro>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ParceiroContactForm: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center">
                    <span className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center mr-2 text-indigo-400">02</span>
                    Contato
                </h3>
                <button
                    type="button"
                    onClick={() => {
                        onChange({ target: { name: 'email', value: '' } } as any);
                        onChange({ target: { name: 'telefone', value: '' } } as any);
                        onChange({ target: { name: 'whatsapp', value: '' } } as any);
                    }}
                    className="text-[9px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                >
                    Contato não informado
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">E-mail</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Telefone Fixo</label>
                    <input
                        type="text"
                        name="telefone"
                        id="telefone"
                        value={formData.telefone || ''}
                        onChange={onChange}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">WhatsApp</label>
                    <input
                        type="text"
                        name="whatsapp"
                        id="whatsapp"
                        value={formData.whatsapp || ''}
                        onChange={onChange}
                        className="w-full bg-emerald-50/10 border border-emerald-100 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-emerald-700 shadow-sm"
                    />
                </div>
            </div>
        </section>
    );
};

export default ParceiroContactForm;
