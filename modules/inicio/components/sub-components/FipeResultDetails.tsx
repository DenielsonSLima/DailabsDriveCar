import React from 'react';
import { History, TrendingUp } from 'lucide-react';

interface FipeResultDetailsProps {
  vehicle: any;
  placa?: string;
  formatCurrency: (val: number) => string;
}

const FipeResultDetails: React.FC<FipeResultDetailsProps> = ({ vehicle, placa, formatCurrency }) => {
  
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
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs sm:text-xs font-semibold rounded normal-case tracking-normal border border-emerald-100">
            Sucesso
          </span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs sm:text-xs font-semibold rounded normal-case tracking-normal flex items-center gap-1">
            <History className="w-2.5 h-2.5" /> Fipe: {vehicle?.mesReferencia}
          </span>
        </div>
        
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="text-3xl font-semibold text-slate-900 tracking-tight normal-case">
              {vehicle?.marca}
            </h4>
            <span className="text-2xl font-light text-slate-500 normal-case tracking-tight">
              {mainModel}
            </span>
          </div>
          {version && (
            <p className="text-xs font-semibold text-indigo-900 normal-case tracking-normal mt-1.5 bg-indigo-100/50 px-2 py-0.5 rounded-lg border border-indigo-200/50">
              {version}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Ano Modelo</span>
          <div className="font-semibold text-slate-800 text-xs mt-0.5">{vehicle?.anoModelo}</div>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Combustível</span>
          <div className="font-semibold text-slate-800 text-xs mt-0.5 normal-case truncate">{vehicle?.combustivel}</div>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Fipe</span>
          <div className="font-semibold text-slate-800 text-xs mt-0.5">{vehicle?.codigoFipe}</div>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal">Cor</span>
          <div className="font-semibold text-slate-800 text-xs mt-0.5 normal-case">{vehicle?.cor || '—'}</div>
        </div>
      </div>

      <div className="p-4 bg-indigo-50 text-indigo-950 rounded-xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal flex items-center gap-1 mb-0.5">
            <TrendingUp className="w-2.5 h-2.5 text-slate-500" /> Valuation Fipe
          </span>
          <div className="text-2xl font-semibold tracking-tight break-words tabular-nums">
            {formatCurrency(vehicle?.valor || 0)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 normal-case tracking-normal block mb-0.5">Ano Fabr.</span>
          <div className="text-lg font-bold">{vehicle?.anoFabricacao}</div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-0.5 block">Placa</label>
          <div className="font-mono text-xs font-semibold text-indigo-600 tracking-normal">
            {placa || '—'}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 normal-case tracking-normal mb-0.5 block">Chassi</label>
          <div className="font-mono text-xs sm:text-xs font-semibold text-slate-900 tracking-normal truncate" title={vehicle?.chassi}>
            {vehicle?.chassi || 'NÃO INFORMADO'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FipeResultDetails;
