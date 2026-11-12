import React, { useEffect, useState } from 'react';
import { ChevronLeft, Eye, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogsService, LogEntry } from './logs.service';
import LogDetailsModal from './components/LogDetailsModal';

const LogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await LogsService.fetchLogs(200);
      setLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    (log.translated_table || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.user_display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.translated_action || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dc-page">
      {/* Header */}
      <div className="w-full">
        <div className="w-full">
          <div className="dc-page-header">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/ajustes')}
                className="dc-button hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="dc-page-title text-gray-900">Logs de Sistema</h1>
                <p className="dc-page-subtitle">Trilha de auditoria e histórico de alterações</p>
              </div>
            </div>
            <button 
              onClick={loadLogs}
              disabled={loading}
              className="dc-button bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm text-gray-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* Filters */}
        <div className="dc-filterbar flex flex-col md:flex-row">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por usuário, ação ou o que foi alterado..."
              className="dc-input block w-full pl-10 pr-3 border border-gray-200 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dc-table min-w-full divide-y divide-slate-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 normal-case tracking-normal">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 normal-case tracking-normal">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 normal-case tracking-normal">O que mudou?</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 normal-case tracking-normal">Módulo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 normal-case tracking-normal">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 normal-case tracking-normal">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      Carregando logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors border-l-4 border-transparent hover:border-indigo-500">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {log.user_display_name}
                          </span>
                          <span className="text-xs text-gray-500">{log.profiles?.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-700">
                          {log.summary}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-500 normal-case tracking-normal">
                          {log.translated_table}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium normal-case ${
                          log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                          log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {log.translated_action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="dc-button text-indigo-500 hover:bg-indigo-50 transition-all"
                          title="Ver detalhes"
                        >
                          <Eye className="w-5 h-5 text-indigo-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LogDetailsModal 
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default LogsPage;