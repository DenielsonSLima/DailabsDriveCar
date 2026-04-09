import React, { useState } from 'react';
import { LogEntry } from '../logs.service';
import { X, ArrowRight, History, FileText, Code, ListFilter, AlertCircle } from 'lucide-react';

interface LogDetailsModalProps {
  log: LogEntry | null;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  // Financeiro
  valor_total: 'Valor Total',
  valor_pendente: 'Saldo Pendente',
  valor_pago: 'Valor Pago',
  valor_liquidado: 'Valor Liquidado',
  valor_desconto: 'Desconto',
  valor_acrescimo: 'Acréscimo',
  status: 'Situação',
  data_vencimento: 'Vencimento',
  data_emissao: 'Emissão',
  descricao: 'Descrição',
  parcela_numero: 'Nr. Parcela',
  parcela_total: 'Total de Parcelas',
  documento_ref: 'Referência',
  origem_tipo: 'Tipo de Origem',
  tipo: 'Tipo',
  // Estoque
  placa: 'Placa',
  modelo: 'Modelo',
  marca: 'Marca',
  ano_fabricacao: 'Ano Fab.',
  ano_modelo: 'Ano Mod.',
  cor: 'Cor',
  quilometragem: 'KM',
  combustivel: 'Combustível',
  // Sistema
  created_at: 'Data de Lançamento',
  updated_at: 'Última Atualização',
  user_id: 'ID do Usuário',
  organization_id: 'ID da Empresa'
};

const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ log, onClose }) => {
  const [viewMode, setViewMode] = useState<'pretty' | 'raw'>('pretty');

  if (!log) return null;

  const calculateDiff = () => {
    const oldData = log.old_data || {};
    const newData = log.new_data || {};
    const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));
    
    // Ignorar chaves puramente técnicas que não agregam valor ao usuário
    const technicalKeys = ['id', 'user_id', 'organization_id', 'row_version', 'updated_at'];
    
    const diffs = allKeys.filter(key => {
      if (technicalKeys.includes(key)) return false;
      const oldVal = oldData[key];
      const newVal = newData[key];
      // Só mostra se mudou
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    });

    return diffs.map(key => ({
      key,
      label: FIELD_LABELS[key] || key,
      oldValue: oldData[key],
      newValue: newData[key]
    }));
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-gray-400 italic">Vazio</span>;
    if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
    if (typeof val === 'number') {
      // Tenta detectar se é valor monetário
      return val.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    }
    return String(val);
  };

  const diffItems = calculateDiff();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${
              log.action === 'INSERT' ? 'bg-green-50 text-green-600' :
              log.action === 'UPDATE' ? 'bg-blue-50 text-blue-600' :
              'bg-red-50 text-red-600'
            }`}>
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detalhes do Evento</h3>
              <p className="text-sm text-gray-500 font-medium">Visualizando trilha de auditoria completa</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setViewMode('pretty')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'pretty' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ListFilter className="w-4 h-4" /> Amigável
            </button>
            <button 
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'raw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Code className="w-4 h-4" /> Técnico (JSON)
            </button>
          </div>

          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all group lg:ml-4"
          >
            <X className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-10 custom-scrollbar bg-white">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ação Realizada</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {log.translated_action}
              </span>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Módulo Afetado</p>
              <p className="text-sm font-bold text-gray-900 truncate">{log.translated_table}</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Executado por</p>
              <p className="text-sm font-bold text-gray-900 truncate">{log.user_display_name}</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Data e Hora</p>
              <p className="text-sm font-bold text-gray-900">
                {new Date(log.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* User Feedback Summary */}
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Resumo da Alteração</p>
              <p className="text-lg font-bold text-indigo-900 leading-tight">
                {log.summary}
              </p>
            </div>
          </div>

          {/* View Selection */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-black text-gray-900">Comparação de Dados</h4>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            
            {viewMode === 'pretty' ? (
              <div className="space-y-3">
                {diffItems.length === 0 ? (
                  <div className="flex items-center gap-3 p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <AlertCircle className="w-6 h-6 text-gray-400" />
                    <p className="text-gray-500 font-medium">Nenhuma alteração de valor detectada nos campos principais.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {diffItems.map((item, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-indigo-100 hover:bg-gray-50/30 transition-all">
                        <div className="w-32 lg:w-48 flex-shrink-0">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Campo</p>
                          <p className="text-sm font-bold text-gray-800">{item.label}</p>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-between gap-6 overflow-hidden">
                          <div className="flex-1 bg-red-50 p-3 rounded-2xl border border-red-100/50">
                            <p className="text-[8px] font-black text-red-300 uppercase tracking-widest mb-1">De</p>
                            <p className="text-sm font-medium text-red-700 truncate">{formatValue(item.oldValue)}</p>
                          </div>
                          
                          <div className="text-gray-300">
                            <ArrowRight className="w-5 h-5" />
                          </div>

                          <div className="flex-1 bg-green-50 p-3 rounded-2xl border border-green-100/50">
                            <p className="text-[8px] font-black text-green-300 uppercase tracking-widest mb-1">Para</p>
                            <p className="text-sm font-bold text-green-700 truncate">{formatValue(item.newValue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,40px,1fr] items-center gap-4">
                <div className="space-y-1">
                  <div className="relative group">
                    <div className="absolute -top-3 left-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest z-10 bg-red-100 text-red-600">
                      Antes (Código)
                    </div>
                    <pre className="bg-gray-900 text-gray-300 p-5 rounded-2xl text-xs overflow-auto max-h-[400px] border border-gray-800 shadow-inner font-mono leading-relaxed">
                      {JSON.stringify(log.old_data, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div className="hidden lg:flex flex-col items-center justify-center">
                  <div className="p-2 bg-gray-100 rounded-full text-gray-400">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative group">
                    <div className="absolute -top-3 left-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest z-10 bg-green-100 text-green-600">
                      Depois (Código)
                    </div>
                    <pre className="bg-gray-900 text-gray-300 p-5 rounded-2xl text-xs overflow-auto max-h-[400px] border border-gray-800 shadow-inner font-mono leading-relaxed">
                      {JSON.stringify(log.new_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogDetailsModal;
