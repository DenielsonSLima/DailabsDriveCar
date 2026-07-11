
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IVeiculo } from '../estoque.types';
import { MontadorasService } from '../../cadastros/montadoras/montadoras.service';
import { TiposVeiculosService } from '../../cadastros/tipos-veiculos/tipos-veiculos.service';
import { ModelosService } from '../../cadastros/modelos/modelos.service';
import { VersoesService } from '../../cadastros/versoes/versoes.service';
import { IModelo } from '../../cadastros/modelos/modelos.types';
import { IVersao } from '../../cadastros/versoes/versoes.types';
import { consultarEParsear, DadosParsedAPI } from '../utils/autoPreencherVeiculo';
import ModalNovoModelo from './ModalNovoModelo';
import ModalNovaVersao from './ModalNovaVersao';

interface Props {
  formData: Partial<IVeiculo>;
  onChange: (updates: Partial<IVeiculo>) => void;
  onConsultaPlaca?: (dados: DadosParsedAPI) => void;
  onNotification?: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const PlusButton: React.FC<{ onClick: () => void; disabled?: boolean }> = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title="Cadastrar novo"
    className="absolute right-3 top-[2.6rem] z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed"
  >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  </button>
);

const FormCardIdentification: React.FC<Props> = ({ formData, onChange, onConsultaPlaca, onNotification }) => {
  const [showNovoModelo, setShowNovoModelo] = useState(false);
  const [showNovaVersao, setShowNovaVersao] = useState(false);
  const [isConsultando, setIsConsultando] = useState(false);
  const [consultaErro, setConsultaErro] = useState<string | null>(null);

  // Queries com Cache
  const { data: montadoras = [], isLoading: isLoadingMontadoras } = useQuery({
    queryKey: ['montadoras_all'],
    queryFn: () => MontadorasService.getAll(),
    staleTime: 1000 * 60 * 30,
  });

  const { data: tipos = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ['tipos_veiculos_all'],
    queryFn: () => TiposVeiculosService.getAll(),
    staleTime: 1000 * 60 * 30,
  });

  const { data: modelos = [], isLoading: isLoadingModelos } = useQuery({
    queryKey: ['modelos_by_montadora_tipo', formData.montadora_id, formData.tipo_veiculo_id],
    queryFn: () => ModelosService.getByMontadoraAndTipo(formData.montadora_id!, formData.tipo_veiculo_id!),
    enabled: !!formData.montadora_id && !!formData.tipo_veiculo_id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: versoes = [], isLoading: isLoadingVersoes } = useQuery({
    queryKey: ['versoes_by_modelo', formData.modelo_id],
    queryFn: () => VersoesService.getByModelo(formData.modelo_id!),
    enabled: !!formData.modelo_id,
    staleTime: 1000 * 60 * 5,
  });

  const handleVersaoSelect = (versaoId: string) => {
    const versao = versoes.find(v => v.id === versaoId);
    if (versao) {
      onChange({
        versao_id: versaoId,
        ano_modelo: versao.ano_modelo,
        ano_fabricacao: versao.ano_fabricacao,
        motorizacao: versao.motorizacao,
        combustivel: versao.combustivel,
        transmissao: versao.transmissao
      });
    } else {
      onChange({ versao_id: versaoId, motorizacao: '', combustivel: '', transmissao: '' });
    }
  };

  const handleModeloCriado = (modelo: IModelo) => {
    onChange({ modelo_id: modelo.id, versao_id: '' });
  };

  const handleVersaoCriada = (versao: IVersao) => {
    handleVersaoSelect(versao.id);
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    onChange({ placa: val });
    setConsultaErro(null);
  };

  const handleConsultarPlaca = async () => {
    const placa = formData.placa?.replace(/[^A-Z0-9]/gi, '') || '';
    if (placa.length < 6 || placa.length > 7) {
      setConsultaErro('Placa deve ter 6 ou 7 caracteres (ex: AB-1234 ou ABC1D23)');
      return;
    }

    setIsConsultando(true);
    setConsultaErro(null);

    try {
      const dados = await consultarEParsear(placa);

      if (formData.tipo_veiculo_id) {
        const selectedIsMoto = formData.tipo_veiculo_id === '87a79d16-42f5-4dc3-9d7b-c213e25f32fc';
        const apiIsMoto = dados.categoriaSugerida === 'moto';

        if (selectedIsMoto && !apiIsMoto) {
          const confirm = window.confirm(`Atenção: você selecionou motocicleta, mas a placa consultada parece ser de um carro (${dados.marcaNome} ${dados.modeloNome}). Deseja importar assim mesmo?`);
          if (!confirm) return;
        } else if (!selectedIsMoto && apiIsMoto) {
          const confirm = window.confirm(`Atenção: você selecionou um tipo de carro, mas a placa consultada parece ser de uma moto (${dados.marcaNome} ${dados.modeloNome}). Deseja importar assim mesmo?`);
          if (!confirm) return;
        }
      }

      const updates: Partial<IVeiculo> = {
        placa: dados.placa,
        chassi: dados.chassi,
        ano_fabricacao: dados.anoFabricacao,
        ano_modelo: dados.anoModelo,
      };

      if (dados.corId) updates.cor_id = dados.corId;
      if (dados.montadora) updates.montadora_id = dados.montadora.id;

      onChange(updates);

      if (onNotification) {
        if (dados.consultasRestantes <= 10) {
          onNotification('warning', `Atenção: limite mensal chegando ao fim. Restam ${dados.consultasRestantes} de 100 consultas.`);
        } else {
          onNotification('success', `Placa consultada. Restam ${dados.consultasRestantes} consultas disponíveis este mês.`);
        }
      }

      onConsultaPlaca?.(dados);
    } catch (error: any) {
      console.error('Erro na consulta de placa:', error);
      const isLimitError = error.message?.includes('limite') || error.message?.includes('LIMITE');
      const message = isLimitError
        ? 'Limite de 100 consultas mensais atingido para sua loja. Entre em contato para contratar mais.'
        : error.message || 'Erro ao consultar placa';

      if (isLimitError && onNotification) onNotification('error', message);
      else setConsultaErro(message);
    } finally {
      setIsConsultando(false);
    }
  };

  const selectedVersao = versoes.find(v => v.id === formData.versao_id);
  const selectedModelo = modelos.find(m => m.id === formData.modelo_id);
  const placaLength = (formData.placa?.replace(/[^A-Z0-9]/gi, '') || '').length;
  const placaValida = placaLength >= 6 && placaLength <= 7;

  // Selects precisam de padding-right extra para não sobrepor o botão "+"
  const selectCls = "w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 pr-14 text-sm font-bold text-[#111827] outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all disabled:bg-slate-50 disabled:opacity-50";

  return (
    <>
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2">
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center">
          <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mr-3 text-sm">01</span>
          Identificação do Veículo
        </h3>

        <div className="mb-8 grid grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr] gap-6 items-stretch">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-1 tracking-widest">Placa do Veículo</label>
            <div className="relative max-w-[280px] mx-auto">
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
                placeholder="ABC1D23"
              />
              <p className="text-[9px] text-center mt-2 text-slate-400 font-bold uppercase tracking-widest">
                Consulta por placa antiga ou Mercosul
              </p>
            </div>

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

            {consultaErro && (
              <div className="mt-3 text-center">
                <p className="text-xs text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-xl inline-block">
                  {consultaErro}
                </p>
              </div>
            )}
          </div>

          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex flex-col justify-center">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Cadastro guiado pela placa</p>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              Ao consultar, o sistema já preenche chassi, cor e anos quando a API retornar esses dados, além de conduzir o cadastro de montadora, tipo, modelo e versão.
            </p>
            {formData.chassi && (
              <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Chassi identificado: <span className="text-slate-700 font-mono">{formData.chassi}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Montadora */}
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Montadora</label>
            <select
              value={formData.montadora_id || ''}
              onChange={e => {
                const newValue = e.target.value;
                if (newValue !== formData.montadora_id) {
                  onChange({ montadora_id: newValue, modelo_id: '', versao_id: '' });
                }
              }}
              className={selectCls}
              disabled={isLoadingMontadoras}
            >
              <option value="">{isLoadingMontadoras ? 'Carregando marcas...' : 'Marca...'}</option>
              {montadoras.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            {isLoadingMontadoras && (
              <div className="absolute right-16 top-[3.25rem] w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Categoria */}
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">Categoria (Tipo)</label>
            <select
              value={formData.tipo_veiculo_id || ''}
              onChange={e => {
                const newValue = e.target.value;
                if (newValue !== formData.tipo_veiculo_id) {
                  onChange({ tipo_veiculo_id: newValue, modelo_id: '', versao_id: '' });
                }
              }}
              disabled={!formData.montadora_id || isLoadingTipos}
              className={selectCls}
            >
              <option value="">{isLoadingTipos ? 'Carregando tipos...' : 'Tipo...'}</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            {isLoadingTipos && (
              <div className="absolute right-16 top-[3.25rem] w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Modelo */}
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">
              Modelo
              <span className="ml-2 text-indigo-500 normal-case font-medium text-[9px]">— clique + para cadastrar novo</span>
            </label>
            <select
              value={formData.modelo_id || ''}
              onChange={e => {
                const newValue = e.target.value;
                if (newValue !== formData.modelo_id) {
                  onChange({ modelo_id: newValue, versao_id: '' });
                }
              }}
              disabled={!formData.tipo_veiculo_id || isLoadingModelos}
              className={selectCls}
            >
              <option value="">{isLoadingModelos ? 'Buscando modelos...' : 'Modelo...'}</option>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <PlusButton
              onClick={() => setShowNovoModelo(true)}
              disabled={!formData.montadora_id || !formData.tipo_veiculo_id}
            />
            {isLoadingModelos && (
              <div className="absolute right-16 top-[3.25rem] w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {/* Versão */}
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest ml-1">
              Versão / Acabamento
              <span className="ml-2 text-indigo-500 normal-case font-medium text-[9px]">— clique + para cadastrar nova</span>
            </label>
            <select
              value={formData.versao_id || ''}
              onChange={e => handleVersaoSelect(e.target.value)}
              disabled={!formData.modelo_id || isLoadingVersoes}
              className={selectCls + ' text-indigo-600'}
            >
              <option value="">{isLoadingVersoes ? 'Carregando fichas...' : 'Selecione a Versão...'}</option>
              {versoes.map(v => (
                <option key={v.id} value={v.id}>
                  {v.nome} - {v.motorizacao} - {v.combustivel} - {v.transmissao} - {v.ano_fabricacao}/{v.ano_modelo}
                </option>
              ))}
            </select>
            <PlusButton
              onClick={() => setShowNovaVersao(true)}
              disabled={!formData.modelo_id}
            />
            {isLoadingVersoes && (
              <div className="absolute right-16 top-[3.25rem] w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </div>

        {selectedVersao ? (
          <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ficha Técnica Automática (Somente Leitura)</p>
              <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-lg uppercase">Vinculado</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100/50">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Motorização</p>
                <p className="text-xs font-black text-indigo-600">{selectedVersao.motorizacao}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100/50">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Combustível</p>
                <p className="text-xs font-black text-indigo-600">{selectedVersao.combustivel}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100/50">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Transmissão</p>
                <p className="text-xs font-black text-indigo-600">{selectedVersao.transmissao}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100/50">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Anos Oficiais</p>
                <p className="text-xs font-black text-indigo-600">{selectedVersao.ano_fabricacao}/{selectedVersao.ano_modelo}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 border-dashed text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              {isLoadingModelos || isLoadingVersoes ? 'Aguarde um momento...' : 'Selecione uma versão para carregar os dados técnicos'}
            </p>
          </div>
        )}
      </div>

      {/* Modais de Cadastro Rápido */}
      {showNovoModelo && (
        <ModalNovoModelo
          preselectedMontadoraId={formData.montadora_id}
          preselectedTipoId={formData.tipo_veiculo_id}
          onClose={() => setShowNovoModelo(false)}
          onSuccess={handleModeloCriado}
        />
      )}

      {showNovaVersao && formData.modelo_id && (
        <ModalNovaVersao
          modeloId={formData.modelo_id}
          modeloNome={selectedModelo?.nome}
          onClose={() => setShowNovaVersao(false)}
          onSuccess={handleVersaoCriada}
        />
      )}
    </>
  );
};

export default FormCardIdentification;
