
import React from 'react';
import ExpenseManager from './components/ExpenseManager';

const TiposDespesasPage: React.FC = () => {
  return (
    <div className="dc-page animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="dc-page-title">Tipos de Despesas</h1>
          <p className="dc-page-subtitle">Configure o plano de contas e centros de custo.</p>
        </div>
      </div>

      <ExpenseManager />
    </div>
  );
};

export default TiposDespesasPage;
