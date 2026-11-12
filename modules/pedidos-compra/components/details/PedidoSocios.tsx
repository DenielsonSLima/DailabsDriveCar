
import React from 'react';
import { IPedidoCompra } from '../../pedidos-compra.types';

interface Props {
  pedido: IPedidoCompra;
}

const PedidoSocios: React.FC<Props> = ({ pedido }) => {
  // Fix: Property 'veiculo' does not exist on type 'IPedidoCompra'. Using the first element of 'veiculos' array instead.
  const socios = pedido.veiculos?.[0]?.socios || [];
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (socios.length === 0) return null;

  return (
    <div className="dc-panel animate-in slide-in-from-bottom-8 duration-700">
      <h3 className="dc-section-title font-semibold text-slate-400 normal-case tracking-normal mb-6 flex items-center">
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        Composição Societária (Investidores)
      </h3>

      <div className="dc-partners">
        {socios.map((socio, idx) => (
          <div key={idx} className="flex items-center gap-3 min-w-0">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm shadow-md mr-4">
                {socio.nome.charAt(0)}
             </div>
             <div className="flex-1">
                <p className="text-xs font-semibold text-slate-800 normal-case tracking-tight">{socio.nome}</p>
                <div className="flex justify-between items-center mt-1">
                   <span className="text-xs font-mono text-slate-500">{socio.porcentagem.toFixed(1)}%</span>
                   <span className="text-xs font-semibold text-emerald-600">{formatCurrency(socio.valor)}</span>
                </div>
                {/* Mini Progress Bar */}
                <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{ width: `${socio.porcentagem}%` }}></div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PedidoSocios;