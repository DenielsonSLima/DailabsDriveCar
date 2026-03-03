import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchService, ISearchResult } from '../services/search.service';

const GlobalSearch: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const typeLabels: Record<string, string> = {
        PARCEIRO: 'Parceiros',
        VEICULO: 'Estoque',
        PEDIDO_VENDA: 'Vendas',
        PEDIDO_COMPRA: 'Compras',
        FINANCEIRO: 'Financeiro'
    };

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: results = [], isLoading, isFetching } = useQuery({
        queryKey: ['globalSearch', debouncedTerm],
        queryFn: () => SearchService.globalSearch(debouncedTerm),
        enabled: debouncedTerm.length >= 2,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    // Close on navigation, click outside or ESC
    useEffect(() => {
        setIsDropdownOpen(false);
        setSearchTerm('');
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsDropdownOpen(false);
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) acc[result.type] = [];
        acc[result.type].push(result);
        return acc;
    }, {} as Record<string, ISearchResult[]>);

    const order = ['VEICULO', 'PARCEIRO', 'PEDIDO_VENDA', 'PEDIDO_COMPRA', 'FINANCEIRO'];

    return (
        <div className="relative w-full max-w-xl" ref={containerRef}>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    {isFetching ? (
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                    }}
                    onFocus={() => searchTerm.length >= 2 && setIsDropdownOpen(true)}
                    placeholder="Buscar em todo o sistema... [/]"
                    className="w-full bg-slate-100 border-none rounded-lg py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-inner"
                />
                {searchTerm && (
                    <button
                        onClick={() => { setSearchTerm(''); setIsDropdownOpen(false); }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {isDropdownOpen && searchTerm.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[450px] overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="py-2">
                            {order.filter(type => groupedResults[type]).map(type => (
                                <div key={type} className="mb-2 last:mb-0">
                                    <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                                        {typeLabels[type]}
                                    </div>
                                    <div className="px-2">
                                        {groupedResults[type].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => navigate(item.link)}
                                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-all group flex items-start gap-3"
                                            >
                                                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 group-hover:bg-white text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                    {type === 'VEICULO' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>}
                                                    {type === 'PARCEIRO' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                                    {(type === 'PEDIDO_VENDA' || type === 'PEDIDO_COMPRA') && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                                    {type === 'FINANCEIRO' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-900 transition-colors uppercase tracking-tight">{item.title}</span>
                                                    {item.subtitle && <span className="text-[11px] text-slate-400 group-hover:text-indigo-400 transition-colors font-medium">{item.subtitle}</span>}
                                                </div>
                                                <svg className="w-4 h-4 ml-auto text-slate-200 group-hover:text-indigo-300 transition-all transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !isLoading && (
                        <div className="p-10 text-center flex flex-col items-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-3">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">Nenhum resultado para "{searchTerm}"</p>
                            <p className="text-[10px] text-slate-300 mt-1 uppercase font-bold">Verifique a ortografia ou mude os termos</p>
                        </div>
                    )}
                </div>
            )}

            {isDropdownOpen && searchTerm.length > 0 && searchTerm.length < 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 text-center z-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Continue digitando para buscar...</p>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
