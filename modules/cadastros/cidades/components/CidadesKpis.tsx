
import React from 'react';
import { ICidade } from '../cidades.types';

interface KpiProps {
  cidades: ICidade[];
}

const CidadesKpis: React.FC<KpiProps> = ({ cidades }) => {
  const totalEstados = new Set(cidades.map(c => c.uf)).size;

  return (
    <div className="dc-kpi-grid">
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Total de Cidades</p>
        <h3 className="dc-kpi-value">{cidades.length}</h3>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Estados Atendidos</p>
        <h3 className="dc-kpi-value">{totalEstados}</h3>
      </div>
      <div className="dc-kpi-card">
        <p className="dc-kpi-label">Região Principal</p>
        <h3 className="dc-kpi-value">Sudoeste</h3>
      </div>
    </div>
  );
};

export default CidadesKpis;
