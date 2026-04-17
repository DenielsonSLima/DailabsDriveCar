import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface LoadingStep {
  label: string;
  icon: React.ElementType;
}

interface FipeAnalysisLoadingProps {
  progress: number;
  currentStep: number;
  steps: LoadingStep[];
}

const FipeAnalysisLoading: React.FC<FipeAnalysisLoadingProps> = ({ 
  progress, 
  currentStep, 
  steps 
}) => {
  return (
    <div className="max-w-md mx-auto py-10 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Análise em Curso</h2>
        <p className="text-xs text-slate-400 font-medium">Aguarde enquanto processamos os dados.</p>
      </div>

      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-[10px] font-black inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200/30 tracking-tighter">
              Status da Operação
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-black inline-block text-indigo-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100 border border-slate-200">
          <div 
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-300 ease-out"
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = idx === currentStep;
          const isDone = idx < currentStep;
          
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                isCurrent ? 'bg-indigo-50 border-indigo-200 scale-105 shadow-sm' : 
                isDone ? 'bg-slate-50 border-slate-100 opacity-50' : 
                'bg-transparent border-transparent opacity-20'
              }`}
            >
              <div className={`p-2 rounded-xl ${isCurrent ? 'bg-indigo-600' : 'bg-slate-200'} transition-colors`}>
                {isCurrent ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Icon className="w-4 h-4 text-slate-400" />}
              </div>
              <span className={`text-xs font-bold tracking-tight ${isCurrent ? 'text-indigo-900' : 'text-slate-400'}`}>
                {step.label}
              </span>
              {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto animate-in zoom-in duration-300" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FipeAnalysisLoading;
