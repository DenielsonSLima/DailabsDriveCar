import React from 'react';

const VehicleDetailsSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            <section className="pt-24 lg:pt-32 pb-12">
                <div className="max-w-[1400px] mx-auto px-6">

                    {/* Botão de Voltar Skeleton */}
                    <div className="mb-10 w-48 h-12 bg-slate-200 rounded-2xl"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* GALERIA DE FOTOS SKELETON */}
                        <div className="lg:col-span-8 flex flex-col items-center space-y-6 overflow-hidden">
                            <div className="w-full max-w-4xl aspect-[4/3] bg-slate-200 rounded-2xl"></div>

                            {/* Miniaturas Skeleton */}
                            <div className="w-full max-w-4xl flex gap-3 overflow-hidden pb-4 pt-2 px-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="w-[80px] h-[60px] bg-slate-200 rounded-xl shrink-0"></div>
                                ))}
                            </div>
                        </div>

                        {/* PAINEL DE INFORMAÇÕES SKELETON */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">

                                {/* Header Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                        <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                    </div>
                                    <div className="h-12 w-3/4 bg-slate-200 rounded-xl"></div>
                                    <div className="h-6 w-1/2 bg-slate-200 rounded border-l-4 border-slate-300 pl-4"></div>
                                </div>

                                {/* Preço */}
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                    <div className="h-12 w-2/3 bg-slate-200 rounded-xl"></div>
                                </div>

                                {/* Botão Ação */}
                                <div className="pt-4">
                                    <div className="w-full h-16 bg-slate-200 rounded-2xl"></div>
                                </div>

                                {/* Grid Detalhes */}
                                <div className="grid grid-cols-2 gap-y-6 gap-x-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                            <div className="h-6 w-24 bg-slate-200 rounded"></div>
                                        </div>
                                    ))}
                                    <div className="col-span-2 h-14 bg-slate-200 rounded-2xl"></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* SEÇÃO TÉCNICA SKELETON */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                        <div className="lg:col-span-8 space-y-20">

                            {/* Destaques */}
                            <div className="space-y-6">
                                <div className="h-8 w-48 bg-slate-200 rounded"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Opcionais */}
                            <div className="space-y-6">
                                <div className="h-8 w-48 bg-slate-200 rounded"></div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-6 bg-slate-100 rounded"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="h-64 bg-slate-900/5 rounded-2xl"></div>

                        </div>

                        {/* Selos */}
                        <div className="lg:col-span-4">
                            <div className="h-[500px] bg-slate-200 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default VehicleDetailsSkeleton;
