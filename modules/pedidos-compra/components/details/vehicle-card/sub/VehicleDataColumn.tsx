import React from 'react';
import { IVeiculo } from '../../../../../estoque/estoque.types';

interface Props {
  veiculo: IVeiculo;
}

const VehicleDataColumn: React.FC<Props> = ({ veiculo }) => {
  const v = veiculo as any;
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const valorServicos = (v.valor_custo_servicos || 0);
  const totalInvestido = (veiculo.valor_custo || 0) + valorServicos;

  return (
    <div className="p-6 flex flex-col h-full bg-white min-w-0">
      {/* 1. Header: Marca e Modelo */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-3 shrink-0 shadow-inner">
          {v.montadora?.logo_url ? (
            <img src={v.montadora.logo_url} className="max-h-full max-w-full object-contain" alt="" />
          ) : (
            <span className="font-semibold text-slate-300 text-xl">{v.montadora?.nome.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-indigo-500 normal-case tracking-normal mb-1">{v.montadora?.nome}</p>
          <h3 className="text-2xl font-semibold text-slate-900 normal-case tracking-normal truncate leading-tight">
            {v.modelo?.nome} <span className="text-slate-400 font-medium ml-2">{v.versao?.nome}</span>
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {[
              v.motorizacao,
              v.transmissao,
              v.combustivel,
              `${v.ano_fabricacao}/${v.ano_modelo}`
            ].filter(Boolean).map((info, i) => (
              <span key={i} className="text-xs font-bold text-slate-400 normal-case tracking-wide flex items-center">
                {i > 0 && <span className="w-1 h-1 bg-slate-300 rounded-full mr-3"></span>}
                {info}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Specs Compactas - Ajustado para 5 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Placa', val: veiculo.placa || '---', font: 'font-mono' },
          { label: 'KM', val: veiculo.km.toLocaleString() + ' km' },
          { label: 'Chassi', val: veiculo.chassi || '---', font: 'font-mono' },
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-50/50 px-4 py-3 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-1">{item.label}</p>
            <p className={`text-[11px] font-bold text-slate-700 normal-case truncate ${item.font || ''}`}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* 3. Painel de Valores */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-slate-100 flex flex-col justify-center">
          <p className="text-[7px] font-semibold text-slate-400 normal-case tracking-normal mb-1">Aquisição</p>
          <p className="text-xs font-semibold text-slate-600">{formatCurrency(veiculo.valor_custo || 0)}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-amber-100 flex flex-col justify-center">
          <p className="text-[7px] font-semibold text-amber-500 normal-case tracking-normal mb-1">Serviços</p>
          <p className="text-xs font-semibold text-amber-600">+{formatCurrency(valorServicos)}</p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
          <p className="text-[7px] font-semibold text-slate-500 normal-case tracking-normal mb-1">Investido</p>
          <p className="text-xs font-semibold text-emerald-400">{formatCurrency(totalInvestido)}</p>
        </div>
      </div>

      {/* 4. Sócios Vinculados ao Veículo */}
      <div className="mt-auto pt-6 border-t border-slate-50">
        <h4 className="text-xs font-semibold text-slate-400 normal-case tracking-normal mb-4 flex items-center">
          Investidores do Ativo
        </h4>
        <div className="flex flex-wrap gap-3">
          {veiculo.socios && veiculo.socios.length > 0 ? veiculo.socios.map((s, idx) => (
            <div key={idx} className="flex flex-col bg-indigo-50/50 border border-indigo-100 rounded-xl px-3 py-2 min-w-[140px] shadow-sm">
              <div className="flex items-center mb-1.5 min-w-0">
                <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold normal-case shrink-0 mr-2 shadow-sm">
                  {s.nome.charAt(0)}
                </div>
                <span className="text-xs font-bold text-slate-700 truncate">{s.nome}</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-0.5">
                <div className="flex items-center">
                  <span className="font-semibold text-indigo-500 mr-1">{s.porcentagem}%</span>
                  <span className="text-slate-300">|</span>
                </div>
                <span className="font-semibold text-indigo-700 ml-2">{formatCurrency(s.valor)}</span>
              </div>
            </div>
          )) : (
            <div className="text-xs font-bold text-slate-300 normal-case tracking-normal border border-dashed border-slate-100 w-full text-center py-2 rounded-xl">Propriedade Integral</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDataColumn;