import React from 'react';
import { useNavigate } from 'react-router-dom';

interface RelatorioItem {
  id: string;
  titulo: string;
  descricao: string;
  icon: string;
  color: string;
  path: string;
}

const RelatoriosPage: React.FC = () => {
  const navigate = useNavigate();

  const categorias = [
    {
      nome: 'Comercial & Vendas',
      items: [
        { id: 'vendas', titulo: 'Vendas Detalhadas', descricao: 'Análise de performance por período, vendedor e margem.', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', color: 'emerald', path: '/relatorios/vendas' },
        { id: 'comissoes', titulo: 'Relatório de Comissões', descricao: 'Cálculo de repasses devidos a corretores e vendedores.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1', color: 'indigo', path: '/relatorios/comissoes' },
      ]
    },
    {
      nome: 'Operacional & Estoque',
      items: [
        { id: 'estoque', titulo: 'Posição de Estoque', descricao: 'Inventário completo com tempo de pátio e custo médio.', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'blue', path: '/relatorios/estoque' },
        { id: 'servicos', titulo: 'Gastos com Serviços', descricao: 'Histórico de manutenções e preparações por veículo.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', color: 'amber', path: '/relatorios/servicos' },
      ]
    },
    {
      nome: 'Gestão & Auditoria',
      items: [
        { id: 'financeiro', titulo: 'Movimentação Financeira', descricao: 'Fluxo de caixa consolidado, entradas e saídas.', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2z', color: 'rose', path: '/relatorios/financeiro' },
        { id: 'extrato-bancario', titulo: 'Extrato Bancário', descricao: 'Histórico de transações linha a linha por conta bancária com saldo progressivo.', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'blue', path: '/relatorios/extrato-bancario' },
        { id: 'auditoria', titulo: 'Logs de Auditoria', descricao: 'Rastreabilidade de alterações críticas no sistema.', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'slate', path: '/relatorios/auditoria' },
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Central de Relatórios</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Extração de dados inteligentes para gestão estratégica</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base de Dados Conectada</span>
        </div>
      </div>

      <div className="space-y-12">
        {categorias.map((cat, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{cat.nome}</h3>
              <div className="h-px w-full bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="group bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 cursor-pointer relative overflow-hidden"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-2 group-hover:text-indigo-600 transition-colors">{item.titulo}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.descricao}</p>

                  <div className="mt-8 flex items-center text-indigo-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    Gerar Relatório
                    <svg className="w-3.5 h-3.5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>

                  {/* Efeito Visual */}
                  <div className={`absolute -bottom-12 -right-12 w-24 h-24 bg-${item.color}-500/5 rounded-full blur-3xl`}></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatoriosPage;