import React from 'react';
// Fix: Splitting react-router-dom imports to resolve "no exported member" errors
import { useNavigate } from 'react-router-dom';

interface SubmoduleDef {
  label: string;
  path?: string;
  status: 'pronto' | 'desenvolvimento';
}

interface ModulePlaceholderProps {
  title: string;
  description?: string;
  submodules?: SubmoduleDef[];
  backPath?: string;
}

// Fix: Complete implementation of ModulePlaceholder and added export default
const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title, description, submodules, backPath }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          {backPath && (
            <button 
              onClick={() => navigate(backPath)}
              className="mt-1 p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{title}</h1>
            {description && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>}
          </div>
        </div>
      </div>

      {submodules && submodules.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {submodules.map((sub, idx) => (
            <div 
              key={idx}
              onClick={() => sub.path && navigate(sub.path)}
              className={`p-5 bg-white border border-slate-200 rounded-xl shadow-sm transition-colors relative overflow-hidden ${
                sub.path ? 'cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30' : 'opacity-75'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                  sub.status === 'pronto' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {sub.status === 'pronto' ? 'Disponível' : 'Em Breve'}
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-800 tracking-tight">{sub.label}</h3>
              {sub.path && (
                <div className="mt-4 flex items-center text-indigo-600 text-xs font-medium">
                  <span>Acessar Módulo</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModulePlaceholder;
