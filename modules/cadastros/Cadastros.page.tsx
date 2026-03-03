import React from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
  {
    id: 'estoque',
    title: 'Inventário Automotivo',
    color: 'emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    items: [
      { label: 'Montadoras', path: '/cadastros/montadoras', status: 'pronto' },
      { label: 'Tipos de Veículos', path: '/cadastros/tipos-veiculos', status: 'pronto' },
      { label: 'Modelos de Veículos', path: '/cadastros/modelos', status: 'pronto' },
      { label: 'Versões Comerciais', path: '/cadastros/versoes', status: 'pronto' },
      { label: 'Características Técnicas', path: '/cadastros/caracteristicas', status: 'pronto' },
      { label: 'Opcionais e Acessórios', path: '/cadastros/opcionais', status: 'pronto' },
    ]
  },
  {
    id: 'tecnicos',
    title: 'Dados Técnicos',
    color: 'indigo',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    items: [
      { label: 'Motorização', path: '/cadastros/motorizacao', status: 'pronto' },
      { label: 'Combustível', path: '/cadastros/combustivel', status: 'pronto' },
      { label: 'Transmissão', path: '/cadastros/transmissao', status: 'pronto' },
      { label: 'Cores e Pintura', path: '/cadastros/cores', status: 'pronto' },
    ]
  },
  {
    id: 'financeiro',
    title: 'Módulo Financeiro',
    color: 'amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    items: [
      { label: 'Tipos de Despesas', path: '/cadastros/tipos-despesas', status: 'pronto' },
      { label: 'Formas de Pagamento', path: '/cadastros/formas-pagamento', status: 'pronto' },
      { label: 'Condição de Pagamento', path: '/cadastros/condicoes-pagamento', status: 'pronto' },
      { label: 'Condição de Recebimento', path: '/cadastros/condicoes-recebimento', status: 'pronto' }
    ]
  },
  {
    id: 'pessoas',
    title: 'Localização & Parceiros',
    color: 'rose',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    items: [
      { label: 'Corretores', path: '/cadastros/corretores', status: 'pronto' },
      { label: 'Cidades e Estados', path: '/cadastros/cidades', status: 'pronto' }
    ]
  }
];

const colorVariants: Record<string, string> = {
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
  amber: 'text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white',
  rose: 'text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white',
  slate: 'text-slate-600 bg-slate-50 border-slate-100 group-hover:bg-slate-600 group-hover:text-white',
};

const CadastrosPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">Cadastros Gerais</h1>
        <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
          Gerencie a base de dados principal do seu ecossistema. Selecione uma categoria abaixo para visualizar e editar as tabelas de domínio que alimentam os módulos operacionais.
        </p>
      </div>

      {categories.map((category) => (
        <section key={category.id} className="pt-4 border-t border-slate-100 first:border-t-0 first:pt-0">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`p-2.5 rounded-xl border transition-colors ${colorVariants[category.color] || colorVariants['slate']} !bg-transparent group-hover:!bg-transparent group-hover:!text-inherit`}>
              {category.icon}
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{category.title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.items.map((sub, idx) => (
              <div
                key={idx}
                onClick={() => sub.path && navigate(sub.path)}
                className={`flex flex-col p-5 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm transition-all relative overflow-hidden group ${sub.path ? 'cursor-pointer hover:border-indigo-400 hover:shadow-lg hover:-translate-y-1' : 'opacity-75 cursor-not-allowed'
                  }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${sub.status === 'pronto' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    {sub.status === 'pronto' ? 'Ativo' : 'Em Breve'}
                  </div>
                </div>

                <h3 className="text-[14px] leading-tight font-black text-slate-900 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                  {sub.label}
                </h3>

                {sub.path && (
                  <div className="mt-4 flex items-center text-slate-400 text-[10px] font-black uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                    <span>Acessar</span>
                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

    </div>
  );
};

export default CadastrosPage;
