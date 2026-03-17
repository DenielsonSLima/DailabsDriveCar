
import React from 'react';
import { IVeiculo } from '../../estoque.types';
import { ICor } from '../../../cadastros/cores/cores.types';

interface SpecsCardProps {
  veiculo: IVeiculo;
  cores: ICor[];
}

const SpecsCard: React.FC<SpecsCardProps> = ({ veiculo, cores }) => {
  const v = veiculo as any;
  const corVeiculo = cores.find(c => c.id === veiculo.cor_id);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
         <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
         Ficha Técnica Complementar
       </h3>
       
       <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
             <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Motorização</p>
             <p className="text-sm font-black text-slate-800 truncate" title={veiculo.motorizacao || v.versao?.motorizacao}>{veiculo.motorizacao || v.versao?.motorizacao || '-'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
             <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Câmbio</p>
             <p className="text-sm font-black text-slate-800 truncate" title={veiculo.transmissao || v.versao?.transmissao}>{veiculo.transmissao || v.versao?.transmissao || '-'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
             <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Combustível</p>
             <p className="text-sm font-black text-slate-800 truncate">{veiculo.combustivel || v.versao?.combustivel || '-'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
             <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Ano Fab/Mod</p>
             <p className="text-sm font-black text-slate-800">{veiculo.ano_fabricacao || v.versao?.ano_fabricacao || '?'}/{veiculo.ano_modelo || v.versao?.ano_modelo || '?'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors col-span-2">
             <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cor Predominante</p>
             <div className="flex items-center space-x-2">
                {corVeiculo && <div className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: corVeiculo.rgb_hex }}></div>}
                <p className="text-sm font-black text-slate-800 truncate">{corVeiculo?.nome || 'N/D'}</p>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SpecsCard;
