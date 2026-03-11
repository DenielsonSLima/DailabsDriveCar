import React, { useState } from 'react';
import { consultaPlacaService, VeiculoConsultaReponse } from './consulta-placa.service';

const ConsultaPlacaPage: React.FC = () => {
  const [placa, setPlaca] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<VeiculoConsultaReponse | null>(null);

  const formatPlaca = (value: string) => {
    // Remove tudo que não é letra ou número
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Adiciona o hífen se tiver mais de 3 caracteres (formato antigo AAA-1234)
    if (cleanValue.length > 3 && !cleanValue.match(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/)) {
        return cleanValue.replace(/^(.{3})(.{0,4})/, '$1-$2');
    }
    return cleanValue;
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaca(formatPlaca(e.target.value));
  };

  const consultarPlaca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placa.replace('-', '').length !== 7) {
      setError('A placa deve conter 7 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const data = await consultaPlacaService.consultar(placa);
      setResultado(data);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao consultar a placa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold text-xl">
          🚗
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consulta de Placa (API Brasil)</h1>
          <p className="text-sm text-gray-500">
            Ambiente de teste para validação da integração com a base veicular e FIPE.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Consulta */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Realizar Consulta</h2>
            
            <form onSubmit={consultarPlaca} className="space-y-4">
              <div>
                <label htmlFor="placa" className="block text-sm font-medium text-gray-700 mb-1">
                  Placa do Veículo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="placa"
                    value={placa}
                    onChange={handlePlacaChange}
                    placeholder="AAA-1234 ou ABC1D23"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors uppercase font-mono text-lg"
                    maxLength={8}
                    required
                  />
                  <span className="text-gray-400 absolute left-3 top-3.5">🔍</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || placa.replace('-', '').length !== 7}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Consultando na API...
                  </span>
                ) : (
                  'Consultar Placa'
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 flex items-start space-x-3 text-red-700">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            {resultado && !resultado.error && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100 flex items-start space-x-3 text-green-700">
                <span className="flex-shrink-0 mt-0.5">✅</span>
                <div>
                  <p className="text-sm font-medium">Consulta realizada com sucesso!</p>
                  <p className="text-xs text-green-600 mt-1">{resultado.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              Resultados da Busca
              {resultado && resultado.data?.resultados?.length > 0 && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {resultado.data.resultados.length} modelo(s) encontrado(s)
                </span>
              )}
            </h2>

            {!resultado && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 py-12">
                <span className="text-4xl text-gray-300">🔍</span>
                <p className="text-lg">Digite uma placa válida para consultar.</p>
                <p className="text-sm text-center max-w-md">
                  A consulta retornará os dados completos do veículo junto à base nacional, além dos valores da Tabela FIPE atualizados.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-12">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-500 animate-pulse">Buscando informações oficiais...</p>
              </div>
            )}

            {resultado && resultado.data?.resultados && (
              <div className="space-y-6">
                {resultado.data.resultados.map((veiculo, index) => (
                  <div key={index} className={`border rounded-xl overflow-hidden ${veiculo.principal ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'}`}>
                    {veiculo.principal && (
                      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Correspondência Principal</span>
                      </div>
                    )}
                    
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{veiculo.marca}</h3>
                          <p className="text-lg text-gray-600">{veiculo.modelo}</p>
                        </div>
                        <div className="mt-2 md:mt-0 text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(veiculo.valor)}
                          </p>
                          <p className="text-xs text-gray-500 text-right">Cód. FIPE: {veiculo.codigoFipe}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ano Fab/Modelo</p>
                          <p className="font-semibold text-gray-900">{veiculo.anoFabricacao} / {veiculo.anoModelo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Combustível</p>
                          <p className="font-semibold text-gray-900 capitalize">{veiculo.combustivel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cor</p>
                          <p className="font-semibold text-gray-900 capitalize">{veiculo.cor}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Chassi</p>
                          <p className="font-mono text-sm font-semibold text-gray-900">{veiculo.chassi}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded mr-2">JSON Raw</span>
                    Retorno Bruto da API
                  </h3>
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-slate-300 font-mono">
                      {JSON.stringify(resultado, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultaPlacaPage;
