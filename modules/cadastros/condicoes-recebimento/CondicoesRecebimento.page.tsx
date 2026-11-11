
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormasPagamentoService } from '../formas-pagamento/formas-pagamento.service';
import { IFormaPagamento } from '../formas-pagamento/formas-pagamento.types';
import ReceiptConditionManager from './components/ReceiptConditionManager';

const CondicoesRecebimentoPage: React.FC = () => {
  const navigate = useNavigate();
  const [formas, setFormas] = useState<IFormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForma, setSelectedForma] = useState<IFormaPagamento | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Busca TODAS as formas de pagamento
      const allFormas = await FormasPagamentoService.getAll();
      
      // 2. Filtra apenas o que é RECEBIMENTO ou AMBOS
      // (Ignora o que é puramente PAGAMENTO, pois isso fica no outro módulo)
      const filtered = allFormas.filter(f => 
        f.tipo_movimentacao === 'RECEBIMENTO' || f.tipo_movimentacao === 'AMBOS'
      );
      
      setFormas(filtered);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (tipo: string) => {
    // Ícones visuais para facilitar identificação
    if (tipo === 'RECEBIMENTO') return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Dinheiro/Moeda
    return 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'; // Transferência/Ambos
  };

  if (selectedForma) {
    return (
      <ReceiptConditionManager 
        forma={selectedForma}
        onBack={() => setSelectedForma(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Condições de Recebimento (Vendas)</h1>
        <p className="text-slate-500 mt-1">Defina como o **Cliente paga você** (Ex: À Vista, 30 Dias, Entrada + 12x).</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {formas.map(forma => (
            <div 
              key={forma.id} 
              onClick={() => setSelectedForma(forma)}
              className="group bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-emerald-400 hover:shadow-sm transition-all duration-200 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl text-xs font-semibold normal-case tracking-normal ${
                forma.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {forma.ativo ? 'Ativo' : 'Inativo'}
              </div>

              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIcon(forma.tipo_movimentacao)} />
                 </svg>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 leading-tight">{forma.nome}</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium normal-case tracking-wide">
                {forma.tipo_movimentacao === 'AMBOS' ? 'Entrada & Saída' : 'Entrada de Caixa'}
              </p>

              <div className="mt-6 flex items-center text-emerald-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                <span>Configurar Regras</span>
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CondicoesRecebimentoPage;
