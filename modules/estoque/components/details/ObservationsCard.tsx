import React from 'react';

interface ObservationsCardProps {
  observacoes?: string;
}

const ObservationsCard: React.FC<ObservationsCardProps> = ({ observacoes }) => {
  if (!observacoes) return null;

  return (
    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm mb-4">
       <h3 className="dc-section-title text-xs font-semibold text-amber-600 normal-case tracking-normal mb-4 flex items-center">
         <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
         Observações Internas
       </h3>
       <div className="dc-panel bg-white/60 rounded-2xl p-6 border border-amber-200/50 backdrop-blur-sm">
         <p className="text-amber-900 text-sm whitespace-pre-wrap leading-relaxed font-medium">
           {observacoes}
         </p>
       </div>
    </div>
  );
};

export default ObservationsCard;