import React from 'react';
import { IParceiro, TipoParceiro } from '../parceiros.types';

interface Props {
    parceiro: IParceiro;
    onEdit: (p: IParceiro) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (p: IParceiro) => void;
}

const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match11 = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match11) return `(${match11[1]}) ${match11[2]}-${match11[3]}`;

    const match10 = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
    if (match10) return `(${match10[1]}) ${match10[2]}-${match10[3]}`;

    return phone;
};

const getTypeBadge = (tipo: TipoParceiro | string) => {
    switch (tipo) {
        case TipoParceiro.CLIENTE:
            return 'bg-blue-50 text-blue-600 border-blue-100';
        case TipoParceiro.FORNECEDOR:
            return 'bg-amber-50 text-amber-600 border-amber-100';
        case TipoParceiro.AMBOS:
            return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        default:
            return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

const ParceiroCard: React.FC<Props> = ({ parceiro, onEdit, onDelete, onToggleStatus }) => {
    const p = parceiro;

    return (
        <div className={`bg-white border rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group relative hover:-translate-y-1 duration-300 flex flex-col h-full ${p.ativo ? 'border-slate-200 hover:border-indigo-200' : 'border-slate-100 opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100'}`}>

            {/* Header do Card */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 font-black text-lg border border-slate-100 shadow-sm shrink-0">
                        {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter truncate" title={p.nome}>{p.nome}</h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter truncate">{p.documento || 'Sem Documento'}</p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.ativo ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-rose-400'}`} title={p.ativo ? 'Ativo' : 'Inativo'}></div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getTypeBadge(p.tipo)}`}>
                    {p.tipo}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                    {p.pessoa_tipo}
                </span>
            </div>

            {/* Endereço */}
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-6 flex-1">
                <div className="flex items-start space-x-2 mb-2">
                    <svg className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                        <p className="text-xs font-bold text-slate-700 leading-tight">
                            {p.cidade || 'Cidade N/D'} - {p.uf || 'UF'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium tracking-tight">
                            {p.bairro || 'Bairro N/D'} • {p.cep || 'CEP N/D'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed truncate" title={p.logradouro ? `${p.logradouro}, ${p.numero}` : ''}>
                            {p.logradouro ? `${p.logradouro}, ${p.numero}` : 'Endereço não informado'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-400">
                    {p.whatsapp ? (
                        <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg" title="WhatsApp">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                            <span>{formatPhone(p.whatsapp)}</span>
                        </span>
                    ) : p.telefone ? (
                        <span className="flex items-center space-x-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg" title="Telefone Fixo">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span>{formatPhone(p.telefone)}</span>
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-300">Sem contato</span>
                    )}
                </div>

                <div className="flex space-x-1">
                    <button
                        onClick={() => onToggleStatus(p)}
                        className={`p-2 rounded-xl transition-all ${p.ativo ? 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}
                        title={p.ativo ? 'Desativar Parceiro' : 'Ativar Parceiro'}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </button>
                    <button onClick={() => onEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Editar">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onDelete(p.id!)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParceiroCard;
