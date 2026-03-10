import React from 'react';
import BaseReportLayout from '../BaseReportLayout';

interface Props {
  empresa: any;
  watermark: any;
  data: {
    totalEstoque: number;
    volumeVeiculos: number;
    partnerGlobalStats: Array<{
      nome: string;
      valor: number;
      porcentagem: number;
      veiculosCount: number;
    }>;
    veiculos: Array<{
      id: string;
      placa: string;
      montadora?: string;
      modelo?: string;
      versao?: string;
      socios: Array<{
        nome: string;
        valor: number;
      }>;
    }>;
  };
}

const EstoqueComSociosTemplate: React.FC<Props> = ({ empresa, watermark, data }) => {
  const formatCur = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatPct = (v: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + '%';


  // ── PAGINAÇÃO MANUAL ───────────────────────────────────────────
  const VEHICLES_PAGE_1 = 6;  // menos por causa do resumo e stats globais
  const VEHICLES_PAGE_N = 10; // mais nas páginas seguintes

  const pages: any[][] = [];
  let currentPos = 0;

  // Página 1
  pages.push(data.veiculos.slice(0, VEHICLES_PAGE_1));
  currentPos = VEHICLES_PAGE_1;

  // Páginas seguintes
  while (currentPos < data.veiculos.length) {
    pages.push(data.veiculos.slice(currentPos, currentPos + VEHICLES_PAGE_N));
    currentPos += VEHICLES_PAGE_N;
  }

  return (
    <>
      <style>{`
        /* ── SUMMARY ── */
        .summary-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .summary-card {
          border: 1.5px solid #e8ecf3;
          border-radius: 12px;
          padding: 16px 20px;
          background: #f8fafd;
        }
        .card-label {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #94a3b8;
          margin-bottom: 6px;
          font-weight: 800;
        }
        .card-value {
          font-size: 24px;
          font-weight: 900;
          color: #1a2e5a;
          line-height: 1;
        }
        .card-sub {
          font-size: 9px;
          color: #64748b;
          margin-top: 6px;
          font-weight: 600;
        }

        /* ── SECTION TITLES ── */
        .section-title {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #1a2e5a;
          margin-bottom: 4px;
        }
        .section-desc {
          font-size: 8px;
          color: #94a3b8;
          margin-bottom: 16px;
          font-weight: 600;
        }

        /* ── PARTNERS ── */
        .partner-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }
        .partner-card {
          border: 1.5px solid #e8ecf3;
          border-radius: 12px;
          padding: 14px 16px;
          background: #f8fafd;
        }
        .partner-name  { font-size: 9px; font-weight: 900; color: #334155; text-transform: uppercase; }
        .partner-pct   { font-size: 9px; font-weight: 800; color: #3b6bc7; float: right; }
        .partner-value { font-size: 15px; font-weight: 900; color: #1a2e5a; margin-top: 6px; }
        .partner-units { font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 2px; }

        /* ── VEHICLE INVENTORY GRID ─────────────────────────────────── */
        .inventory-grid {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .inventory-header {
          display: grid;
          grid-template-columns: 38% 24% 10% 28%;
          background: #1a2e5a;
          padding: 10px 12px;
          border-radius: 6px 6px 0 0;
          margin-bottom: 2px;
        }
        .inventory-header span {
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #c8d6f0;
        }
        .header-right { text-align: right; }

        .vehicle-card {
          display: flex;
          flex-direction: column;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          border-bottom: 1.5px solid #f1f5f9;
          padding: 12px 0;
        }
        .vehicle-card:last-child { border-bottom: none; }

        .vehicle-main-row {
          display: grid;
          grid-template-columns: 38% 24% 10% 28%;
          padding: 0 12px 6px 12px;
          align-items: flex-end;
        }

        .partner-row {
          display: grid;
          grid-template-columns: 38% 24% 10% 28%;
          padding: 2px 12px;
        }

        /* Labels & Elements */
        .brand-label {
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #3b6bc7;
          margin-bottom: 2px;
        }
        .model-label {
          font-size: 13px;
          font-weight: 900;
          color: #1a2e5a;
          line-height: 1.1;
        }
        .version-label {
          font-size: 9px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #3b6bc7;
          color: #fff;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 900;
        }
        .socio-name {
          font-size: 9px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .socio-value {
          font-size: 9.5px;
          font-weight: 800;
          color: #1a2e5a;
          text-align: right;
        }
        .socio-divider {
          border-bottom: 1px solid #f8fafd;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 2px;
        }
      `}</style>

      {pages.map((vehicleChunk, pIdx) => (
        <BaseReportLayout
          key={pIdx}
          empresa={empresa}
          watermark={watermark}
          title="Relatório de Estoque com Sócios"
          subtitle="Posição Analítica de Ativos e Participações"
          isManualPagination={true}
          pageNumber={pIdx + 1}
          totalPages={pages.length}
        >
          {/* Apenas na Página 1: Resumo e Parceiros */}
          {pIdx === 0 && (
            <>
              {/* ── Summary cards ── */}
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="card-label">Valor Total do Estoque</div>
                  <div className="card-value">{formatCur(data.totalEstoque)}</div>
                  <div className="card-sub">Capital consolidado entre empresa e parceiros</div>
                </div>
                <div className="summary-card" style={{ textAlign: 'center' }}>
                  <div className="card-label">Volume de Veículos</div>
                  <div className="card-value" style={{ fontSize: '32px' }}>{data.volumeVeiculos}</div>
                  <div className="card-sub" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '8px' }}>
                    Unidades
                  </div>
                </div>
              </div>

              {/* ── Partners ── */}
              <div className="section-title">Participação Global por Investidor</div>
              <div className="section-desc">Visão consolidada do capital distribuído</div>
              <div className="partner-grid">
                {data.partnerGlobalStats.map((partner, idx) => (
                  <div key={idx} className="partner-card">
                    <span className="partner-pct">{formatPct(partner.porcentagem)}</span>
                    <div className="partner-name">{partner.nome}</div>
                    <div className="partner-value">{formatCur(partner.valor)}</div>
                    <div className="partner-units">{partner.veiculosCount} veículos</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Cabeçalho do Inventário sempre aparece se houver veículos na página */}
          <div className="section-title">Inventário Analítico de Veículos</div>
          <div className="section-desc" style={{ marginBottom: '12px' }}>
            Detalhamento por ativo e participações individuais {pIdx > 0 && `(Continuação)`}
          </div>

          <div className="inventory-grid">
            {/* Header */}
            <div className="inventory-header">
              <span>Veículo / Marca</span>
              <span>Versão</span>
              <span style={{ textAlign: 'center' }}>Sócios</span>
              <span className="header-right">Participações Individuais</span>
            </div>

            {/* Vehicles in this chunk */}
            {vehicleChunk.map((veiculo) => (
              <div key={veiculo.id} className="vehicle-card">
                {/* Main Row */}
                <div className="vehicle-main-row">
                  <div>
                    <div className="brand-label">{veiculo.montadora}</div>
                    <div className="model-label">{veiculo.modelo}</div>
                  </div>
                  <div className="version-label">{veiculo.versao || '—'}</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span className="badge">{veiculo.socios.length}</span>
                  </div>
                  <div></div>
                </div>

                {/* Partner Rows */}
                {veiculo.socios.map((socio, sIdx) => (
                  <div key={sIdx} className="partner-row">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div>
                      <div className="socio-divider">
                        <span className="socio-name">{socio.nome}</span>
                        <span className="socio-value">{formatCur(socio.valor)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </BaseReportLayout>
      ))}
    </>
  );
};

export default EstoqueComSociosTemplate;