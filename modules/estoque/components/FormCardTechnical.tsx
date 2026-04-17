
import React, { useState } from 'react';
import { IVeiculo } from '../estoque.types';
import { ICor } from '../../cadastros/cores/cores.types';
import { consultarEParsear, DadosParsedAPI } from '../utils/autoPreencherVeiculo';

interface Props {
  formData: Partial<IVeiculo>;
  cores: ICor[];
  onChange: (updates: Partial<IVeiculo>) => void;
  onConsultaPlaca?: (dados: DadosParsedAPI) => void;
  onNotification?: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const FormCardTechnical: React.FC<Props> = ({ formData, cores, onChange, onConsultaPlaca, onNotification }) => {
  const [isConsultando, setIsConsultando] = useState(false);
  const [consultaErro, setConsultaErro] = useState<string | null>(null);
  const [consultaSucesso, setConsultaSucesso] = useState(false);

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    onChange({ placa: val });
    setConsultaErro(null);
    setConsultaSucesso(false);
  };

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ km: 0 });
      return;
    }
    const num = parseInt(val.replace(/\D/g, ''));
    if (!isNaN(num)) {
      onChange({ km: num });
    }
  };

  const handleConsultarPlaca = async () => {
    const placa = formData.placa?.replace(/[^A-Z0-9]/gi, '') || '';
    if (placa.length < 6 || placa.length > 7) {
      setConsultaErro('Placa deve ter 6 ou 7 caracteres (ex: AB-1234 ou ABC1D23)');
      return;
    }

    setIsConsultando(true);
    setConsultaErro(null);
    setConsultaSucesso(false);

    try {
      const dados = await consultarEParsear(placa);
      setConsultaSucesso(true);

      // Preenche chassi e cor automaticamente
      const updates: Partial<IVeiculo> = {
        chassi: dados.chassi,
        ano_fabricacao: dados.anoFabricacao,
        ano_modelo: dados.anoModelo,
      };

      if (dados.corId) {
        updates.cor_id = dados.corId;
      }

      onChange(updates);

      // Notificações de saldo (Limite de 100 por Loja)
      if (onNotification) {
        if (dados.consultasRestantes <= 10) { 
          onNotification('warning', `⚠️ Atenção: Limite mensal chegando ao fim! Restam apenas ${dados.consultasRestantes} de 100 consultas.`);
        } else {
          onNotification('success', `Placa consultada! Você ainda tem ${dados.consultasRestantes} consultas disponíveis este mês.`);
        }
      }

      // Notifica o componente pai para iniciar o fluxo wizard
      if (onConsultaPlaca) {
        onConsultaPlaca(dados);
      }
    } catch (error: any) {
      console.error('Erro na consulta de placa:', error);
      
      const isLimitError = error.message?.includes('limite') || error.message?.includes('LIMITE');

      if (isLimitError) {
        const errorMsg = '⚠️ Limite de 100 consultas mensais atingido para sua loja. Entre em contato para contratar mais.';
        if (onNotification) {
          onNotification('error', errorMsg);
        } else {
          setConsultaErro(errorMsg);
        }
      } else {
        setConsultaErro(error.message || 'Erro ao consultar placa');
      }
    } finally {
      setIsConsultando(false);
    }
  };

  const selectedCor = cores.find(c => c.id === formData.cor_id);
  const placaLength = (formData.placa?.replace(/[^A-Z0-9]/gi, '') || '').length;
  const placaValida = placaLength >= 6 && placaLength <= 7;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4">
      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center">
        <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3 text-sm">03</span>
        Dados Técnicos & Documentação
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          {/* Seletor de Cor */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest flex justify-between">
              Cor do Veículo
              <span className="text-indigo-600 font-bold">{selectedCor?.nome || 'Não selecionada'}</span>
            </label>
            <div className="flex flex-wrap gap-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
              {cores.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">Nenhuma cor cadastrada no sistema.</p>
              ) : (
                cores.map(cor => (
                  <button
                    key={cor.id}
                    type="button"
                    onClick={() => onChange({ cor_id: cor.id })}
                    className={`w-10 h-10 rounded-full border-4 transition-all transform hover:scale-110 shadow-sm ${formData.cor_id === cor.id
                      ? 'border-indigo-500 ring-2 ring-indigo-200 ring-offset-2'
                      : 'border-white hover:border-slate-200'
                      }`}
                    style={{ backgroundColor: cor.rgb_hex }}
                    title={cor.nome}
                  />
                ))
              )}
            </div>
          </div>

          {/* Placa + Botão Consultar */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest">Identificação Placa</label>
            <div className="relative max-w-[300px] mx-auto">
              <div className="absolute top-0 left-0 w-full h-4 bg-blue-700 rounded-t-lg flex items-center justify-between px-2">
                <span className="text-[6px] font-bold text-white">BRASIL</span>
                <div className="w-4 h-2.5 bg-green-500 opacity-20"></div>
              </div>
              <input
                type="text"
                value={formData.placa || ''}
                onChange={handlePlacaChange}
                maxLength={7}
                className="w-full bg-white border-2 border-slate-800 rounded-lg pt-6 pb-2 text-center text-4xl font-black uppercase tracking-widest text-slate-800 outline-none font-mono"
                placeholder="ABC-1234"
              />
              <p className="text-[9px] text-center mt-2 text-slate-400 font-bold uppercase tracking-widest">
                Aceita placas antigas (6 chars) e atuais (7 chars)
              </p>
            </div>

            {/* Botão Consultar API */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleConsultarPlaca}
                disabled={!placaValida || isConsultando}
                className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
              >
                {isConsultando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Consultar Placa
                  </>
                )}
              </button>
            </div>

            {/* Mensagens de status */}
            {consultaErro && (
              <div className="mt-3 text-center">
                <p className="text-xs text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-xl inline-block">
                  ⚠️ {consultaErro}
                </p>
              </div>
            )}

          </div>
        </div>

        <div className="space-y-8 flex flex-col">
          {/* Quilometragem */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Quilometragem (KM)</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.km === 0 ? '' : formData.km.toString()}
              onChange={handleKmChange}
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 text-2xl font-black text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 text-right"
              placeholder="0"
            />
          </div>

          {/* Chassi */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Chassi (17 Dígitos)</label>
            <input
              type="text"
              value={formData.chassi || ''}
              onChange={e => onChange({ chassi: e.target.value.toUpperCase() })}
              maxLength={17}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-mono font-black text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all"
              placeholder="DIGITE O CHASSI..."
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default FormCardTechnical;
