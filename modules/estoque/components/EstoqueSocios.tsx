
import React from 'react';
import { IVeiculoSocio } from '../estoque.types';
import { ISocio } from '../../ajustes/socios/socios.types';

interface Props {
  sociosDisponiveis: ISocio[];
  sociosVinculados: IVeiculoSocio[];
  valorCustoTotal: number;
  onChange: (socios: IVeiculoSocio[]) => void;
}

const EstoqueSocios: React.FC<Props> = ({ sociosDisponiveis, sociosVinculados, valorCustoTotal, onChange }) => {

  const gradients = [
    'from-indigo-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-purple-500 to-violet-500',
    'from-cyan-500 to-sky-500',
  ];

  const totalPorcentagemAlocada = parseFloat(sociosVinculados.reduce((acc, s) => acc + (s.porcentagem || 0), 0).toFixed(4));
  const porcentagemLivre = parseFloat(Math.max(0, 100 - totalPorcentagemAlocada).toFixed(4));

  const dividirIgualmente = () => {
    if (sociosVinculados.length === 0) return;

    const count = sociosVinculados.length;
    const basePercent = Math.floor((100 / count) * 100) / 100; // Precisão de 2 casas
    const leftover = parseFloat((100 - (basePercent * count)).toFixed(2));

    const novosVinculos = sociosVinculados.map((s, i) => {
      const p = i === count - 1 ? parseFloat((basePercent + leftover).toFixed(2)) : basePercent;
      return {
        ...s,
        porcentagem: p,
        valor: (p / 100) * valorCustoTotal
      };
    });

    onChange(novosVinculos);
  };

  const distribuirProporcionalmente = () => {
    if (sociosVinculados.length === 0) return;

    const count = sociosVinculados.length;
    const totalAtual = parseFloat(sociosVinculados.reduce((acc, s) => acc + (s.porcentagem || 0), 0).toFixed(4));

    if (totalAtual === 0) {
      dividirIgualmente();
      return;
    }

    const novosVinculos = sociosVinculados.map((s) => {
      let p = (s.porcentagem / totalAtual) * 100;
      p = parseFloat(p.toFixed(2));
      return {
        ...s,
        porcentagem: p,
        valor: (p / 100) * valorCustoTotal
      };
    });

    const somaGeral = parseFloat(novosVinculos.reduce((acc, s) => acc + s.porcentagem, 0).toFixed(2));
    if (somaGeral !== 100) {
      const residuo = parseFloat((100 - somaGeral).toFixed(2));
      const lastIndex = count - 1;
      novosVinculos[lastIndex].porcentagem = parseFloat((novosVinculos[lastIndex].porcentagem + residuo).toFixed(2));
      novosVinculos[lastIndex].valor = (novosVinculos[lastIndex].porcentagem / 100) * valorCustoTotal;
    }

    onChange(novosVinculos);
  };

  const updateSocioData = (socioId: string, updates: { porcentagem?: string, valor?: string }) => {
    const socioAtual = sociosVinculados.find(s => s.socio_id === socioId);
    if (!socioAtual) return;

    const totalOutros = sociosVinculados
      .filter(s => s.socio_id !== socioId)
      .reduce((acc, s) => acc + s.porcentagem, 0);

    let novaPorcentagem = socioAtual.porcentagem;
    let novoValor = socioAtual.valor;

    if (updates.porcentagem !== undefined) {
      const valStr = updates.porcentagem === '' ? '0' : updates.porcentagem;
      let pNum = parseFloat(valStr);

      if (pNum + totalOutros > 100) {
        pNum = 100 - totalOutros;
      }

      novaPorcentagem = isNaN(pNum) ? 0 : Math.max(0, parseFloat(pNum.toFixed(2)));
      novoValor = (novaPorcentagem / 100) * valorCustoTotal;
    } else if (updates.valor !== undefined) {
      const valStr = updates.valor === '' ? '0' : updates.valor;
      let vNum = parseFloat(valStr);

      novoValor = isNaN(vNum) ? 0 : Math.max(0, vNum);
      novaPorcentagem = valorCustoTotal > 0 ? (novoValor / valorCustoTotal) * 100 : 0;

      if (novaPorcentagem + totalOutros > 100) {
        novaPorcentagem = 100 - totalOutros;
        novoValor = (novaPorcentagem / 100) * valorCustoTotal;
      }
    }

    const novosVinculos = sociosVinculados.map(s =>
      s.socio_id === socioId ? { ...s, porcentagem: novaPorcentagem, valor: novoValor } : s
    );

    onChange(novosVinculos);
  };

  const toggleSocio = (socio: ISocio) => {
    const estaVinculado = sociosVinculados.some(s => s.socio_id === socio.id);
    if (estaVinculado) {
      onChange(sociosVinculados.filter(s => s.socio_id !== socio.id));
    } else {
      onChange([...sociosVinculados, {
        socio_id: socio.id!,
        nome: socio.nome,
        porcentagem: 0,
        valor: 0
      }]);
    }
  };

  React.useEffect(() => {
    if (valorCustoTotal >= 0) {
      const recalculado = sociosVinculados.map(s => ({
        ...s,
        valor: (s.porcentagem / 100) * valorCustoTotal
      }));
      if (JSON.stringify(recalculado) !== JSON.stringify(sociosVinculados)) {
        onChange(recalculado);
      }
    }
  }, [valorCustoTotal, sociosVinculados, onChange]);

  return (
    <div className="flex flex-col h-full">
      {/* Indicadores de Capital */}
      <div className="bg-slate-900 rounded-3xl p-6 mb-6 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

        <div className="relative z-10 flex justify-between items-end mb-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Investimento Alocado</p>
            <h3 className="text-3xl font-black tracking-tight mt-1 flex items-baseline">
              {totalPorcentagemAlocada.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}<span className="text-sm text-indigo-400 ml-1">%</span>
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Capital em Aberto</p>
            <h3 className={`text-3xl font-black tracking-tight mt-1 flex items-baseline justify-end ${porcentagemLivre <= 0.01 ? 'text-slate-600' : 'text-emerald-400'}`}>
              {porcentagemLivre.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}<span className="text-sm ml-1 opacity-50">%</span>
            </h3>
          </div>
        </div>

        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner border border-slate-700">
          {sociosVinculados.map((s, i) => (
            <div
              key={s.socio_id}
              className={`h-full bg-gradient-to-r ${gradients[i % gradients.length]} border-r border-slate-900/20`}
              style={{ width: `${s.porcentagem}%`, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          ))}
        </div>
      </div>

      {/* Barra de Ações Rápidas */}
      {sociosVinculados.length >= 2 && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={dividirIgualmente}
            className="py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-indigo-200/50 transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
            <span>Dividir Igualmente</span>
          </button>
          <button
            type="button"
            onClick={distribuirProporcionalmente}
            className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-emerald-200/50 transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            <span>Distribuir Proporcional</span>
          </button>
        </div>
      )}

      {/* Lista de Investidores */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[450px]">
        {sociosDisponiveis.map((socio) => {
          const vinculado = sociosVinculados.find(v => v.socio_id === socio.id);
          const percentual = vinculado ? vinculado.porcentagem : 0;
          const valorReais = vinculado ? vinculado.valor : 0;
          const maxSocio = percentual + porcentagemLivre;

          return (
            <div
              key={socio.id}
              className={`border-2 rounded-[2rem] p-5 transition-all duration-300 ${vinculado
                  ? 'bg-white border-indigo-100 shadow-xl ring-4 ring-indigo-50/50'
                  : 'bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-100'
                }`}
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleSocio(socio)}
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${vinculado
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'border-slate-200 bg-white hover:border-indigo-400'
                      }`}
                  >
                    {vinculado && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </button>

                  <div className="truncate">
                    <p className={`text-sm font-black uppercase tracking-tighter truncate ${vinculado ? 'text-slate-900' : 'text-slate-400'}`}>
                      {socio.nome}
                    </p>
                    {vinculado && (
                      <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-indigo-100/50">Vinculado</span>
                    )}
                  </div>
                </div>

                {vinculado && (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="relative group">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={valorReais === 0 ? '' : valorReais.toFixed(2)}
                        onChange={(e) => updateSocioData(socio.id!, { valor: e.target.value })}
                        className="w-32 bg-slate-50 border border-slate-200 rounded-xl py-2 pl-7 pr-3 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={percentual === 0 ? '' : percentual.toString()}
                        onChange={(e) => updateSocioData(socio.id!, { porcentagem: e.target.value })}
                        className="w-20 bg-indigo-50/50 border border-indigo-100 rounded-xl py-2 pl-3 pr-7 text-xs font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-right transition-all shadow-sm"
                        placeholder="0"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400">%</span>
                    </div>
                  </div>
                )}
              </div>

              {vinculado && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                  <input
                    type="range"
                    min="0"
                    max={maxSocio}
                    step="0.01"
                    value={percentual}
                    onChange={(e) => updateSocioData(socio.id!, { porcentagem: e.target.value })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    style={{
                      background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${percentual}%, #f1f5f9 ${percentual}%, #f1f5f9 100%)`
                    }}
                  />
                  <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-widest px-0.5">
                    <span>Cota: {percentual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%</span>
                    <span className="text-indigo-400">Disp: {maxSocio.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EstoqueSocios;
