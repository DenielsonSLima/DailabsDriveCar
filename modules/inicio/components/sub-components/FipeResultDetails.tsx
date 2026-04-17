import React from 'react';
import { History, TrendingUp } from 'lucide-react';

interface FipeResultDetailsProps {
  vehicle: any;
  placa?: string;
  formatCurrency: (val: number) => string;
}

const FipeResultDetails: React.FC<FipeResultDetailsProps> = ({ vehicle, formatCurrency }) => {
  
  // Função para dividir o nome do modelo em Nome Principal e Versão/Motorização
  const splitModelName = (fullModel: string) => {
    if (!fullModel) return { main: '', version: '' };

    // Regex para identificar motorização (ex: 1.0, 1.4, 2.0, 1.6V, etc.) 
    // ou delimitadores comuns de versão como parenteses ou barra
    const motorReg = /\s(\d\.\d|\d\.\do|V\d|Turbo|TSI|Diesel|Flex|4x4|PDC)/i;
    const match = fullModel.match(motorReg);

    if (match && match.index) {
      return {
        main: fullModel.substring(0, match.index).trim(),
        version: fullModel.substring(match.index).trim(),
      };
    }

    // Fallback: se não achar motorização clara, pega as primeiras 2 palavras como o nome principal
    const words = fullModel.split(' ');
    if (words.length > 2) {
      return {
        main: words.slice(0, 2).join(' '),
        version: words.slice(2).join(' '),
      };
    }

    return { main: fullModel, version: '' };
  };

  const { main: mainModel, version } = splitModelName(vehicle?.modelo || '');

  return (
    <div className="lg:col-span-12 xl:col-span-7 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] sm:text-[7px] font-black rounded uppercase tracking-widest border border-emerald-100">
            Sucesso
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] sm:text-[7px] font-black rounded uppercase tracking-widest flex items-center gap-1">
            <History className="w-2.5 h-2.5" /> Fipe: {vehicle?.mesReferencia}
          </span>
        </div>
        
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
              {vehicle?.marca}
            </h4>
            <span className="text-2xl font-light text-slate-400 uppercase tracking-tight">
              {mainModel}
            </span>
          </div>
          {version && (
            <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mt-1.5 bg-indigo-100/50 px-2 py-0.5 rounded-lg border border-indigo-200/50">
              {version}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Ano Modelo</span>
          <div className="font-black text-slate-800 text-xs mt-0.5">{vehicle?.anoModelo}</div>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Combustível</span>
          <div className="font-black text-slate-800 text-xs mt-0.5 uppercase truncate">{vehicle?.combustivel}</div>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Fipe</span>
          <div className="font-black text-slate-800 text-xs mt-0.5">{vehicle?.codigoFipe}</div>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Cor</span>
          <div className="font-black text-slate-800 text-xs mt-0.5 uppercase">{vehicle?.cor || '—'}</div>
        </div>
      </div>

      <div className="p-5 bg-slate-900 text-white rounded-[1.5rem] shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-2.5 h-2.5 text-indigo-400" /> Valuation Fipe
          </span>
          <div className="text-3xl font-black tracking-tighter">
            {formatCurrency(vehicle?.valor || 0)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Ano Fabr.</span>
          <div className="text-lg font-bold">{vehicle?.anoFabricacao}</div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
        <div>
          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Placa</label>
          <div className="font-mono text-xs font-black text-indigo-600 tracking-wider">
            {placa || '—'}
          </div>
        </div>
        <div>
          <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Chassi</label>
          <div className="font-mono text-[10px] sm:text-[9px] font-black text-slate-900 tracking-wider truncate" title={vehicle?.chassi}>
            {vehicle?.chassi || 'NÃO INFORMADO'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FipeResultDetails;
