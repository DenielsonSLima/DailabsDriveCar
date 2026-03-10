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
      montadora_logo?: string;
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
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const fmtPct = (v: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + '%';

  // ── PAGINAÇÃO MANUAL ───────────────────────────────────────────
  // Página 1: resumo + primeiros 2 veículos
  // Páginas seguintes: 5 veículos cada
  const VEHICLES_PAGE_1 = 4;
  const VEHICLES_PAGE_N = 5;

  const page1Vehicles = data.veiculos.slice(0, VEHICLES_PAGE_1);
  const remainingVehicles = data.veiculos.slice(VEHICLES_PAGE_1);

  const vehicleChunks: any[][] = [];
  for (let i = 0; i < remainingVehicles.length; i += VEHICLES_PAGE_N) {
    vehicleChunks.push(remainingVehicles.slice(i, i + VEHICLES_PAGE_N));
  }

  const totalPages = 1 + vehicleChunks.length;

  // Cores por sócio para visual premium
  const partnerColors = ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6'];

  // ── Componente reutilizável para card de veículo ──
  const VehicleCard = ({ veiculo, vIdx }: { veiculo: any; vIdx: number }) => (
    <div style={{
      display: 'flex', gap: '0', borderRadius: '1rem',
      border: '1px solid #e2e8f0', overflow: 'hidden', background: 'white',
    }}>
      {/* Info do Veículo */}
      <div style={{
        flex: 1, padding: '1rem 1.25rem',
        borderRight: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        {/* Logo da Montadora */}
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden',
        }}>
          {veiculo.montadora_logo ? (
            <img src={veiculo.montadora_logo} style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="" />
          ) : (
            <span style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>
              {(veiculo.montadora || '').substring(0, 2)}
            </span>
          )}
        </div>
        <div>
          <span style={{ fontSize: '7px', fontWeight: 900, color: partnerColors[vIdx % partnerColors.length], textTransform: 'uppercase', letterSpacing: '1px' }}>{veiculo.montadora}</span>
          <h4 style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0', lineHeight: 1.1 }}>{veiculo.modelo}</h4>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {veiculo.versao && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{veiculo.versao}</span>
            )}
            {veiculo.placa && veiculo.placa !== '—' && (
              <span style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{veiculo.placa}</span>
            )}
          </div>
        </div>
      </div>

      {/* Equity / Custo Total */}
      <div style={{
        width: '140px', padding: '1rem',
        background: '#f8fafc', textAlign: 'center',
        borderRight: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '7px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Custo Total</span>
        <p style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', margin: '4px 0 0 0' }}>
          {fmt(veiculo.socios.reduce((acc: number, s: any) => acc + (s.valor || 0), 0))}
        </p>
      </div>

      {/* Participações por Sócio */}
      <div style={{
        width: '220px', padding: '0.75rem 1rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px',
      }}>
        {veiculo.socios.map((socio: any, sIdx: number) => (
          <div key={sIdx} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 8px', background: '#f8fafc', borderRadius: '6px',
            fontSize: '9px',
          }}>
            <span style={{ fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{socio.nome}</span>
            <span style={{ fontWeight: 900, color: '#0f172a' }}>{fmt(socio.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="report-container" style={{ backgroundColor: '#f8fafc' }}>
      <style>{`
        @media print {
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* ═══ PAGE 1: RESUMO + PRIMEIROS VEÍCULOS ═══ */}
      <BaseReportLayout
        title="Relatório de Estoque com Sócios"
        empresa={empresa}
        watermark={watermark}
        subtitle="Posição Analítica de Ativos e Participações"
        pageNumber={1}
        totalPages={totalPages}
        isManualPagination={true}
      >
        <div style={{ padding: '0.4rem 1.5rem 1rem 1.5rem' }}>
          {/* ── KPI Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* Valor Total do Estoque */}
            <div style={{
              background: '#4f46e5', borderRadius: '1rem',
              padding: '1rem 1.25rem', color: 'white', border: '1px solid #4338ca',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: '0.5rem',
                  background: 'rgba(255,255,255,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 900, color: 'white',
                }}>
                  R$
                </div>
                <div>
                  <p style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: '1.5px' }}>Valor Total do Estoque</p>
                  <h4 style={{ fontSize: '20px', fontWeight: 900, margin: 0, lineHeight: 1.2 }}>{fmt(data.totalEstoque)}</h4>
                  <p style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0 0' }}>Capital consolidado entre empresa e parceiros</p>
                </div>
              </div>
            </div>

            {/* Volume de Veículos */}
            <div style={{
              background: '#4f46e5', borderRadius: '1rem',
              padding: '1rem 1.25rem', color: 'white', border: '1px solid #4338ca',
              textAlign: 'center', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <p style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: '1.5px' }}>Volume de Veículos</p>
              <h4 style={{ fontSize: '28px', fontWeight: 900, margin: 0, lineHeight: 1 }}>{data.volumeVeiculos}</h4>
              <p style={{ fontSize: '7px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Unidades</p>
            </div>
          </div>

          {/* ── Participação Global por Investidor ── */}
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#0f172a', margin: '0 0 3px 0' }}>Participação Global por Investidor</h3>
            <p style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Visão consolidada do capital distribuído</p>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.partnerGlobalStats.length, 3)}, 1fr)`, gap: '0.5rem' }}>
              {data.partnerGlobalStats.map((partner, idx) => (
                <div key={idx} style={{
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem', padding: '0.75rem 1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 900, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{partner.nome}</span>
                    <span style={{
                      fontSize: '7px', fontWeight: 900, color: partnerColors[idx % partnerColors.length],
                      background: `${partnerColors[idx % partnerColors.length]}15`,
                      padding: '2px 6px', borderRadius: '4px',
                    }}>{fmtPct(partner.porcentagem)}</span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0' }}>{fmt(partner.valor)}</h4>
                  <p style={{ fontSize: '7px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{partner.veiculosCount} veículos</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Inventário: Primeiros veículos na página 1 ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#0f172a', margin: '0 0 3px 0' }}>Inventário Analítico de Veículos</h3>
                <p style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Detalhamento por ativo e participações individuais</p>
              </div>
              <span style={{
                fontSize: '7px', fontWeight: 900, color: '#64748b',
                background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px',
                textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                1–{Math.min(VEHICLES_PAGE_1, data.veiculos.length)} de {data.veiculos.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {page1Vehicles.map((veiculo, vIdx) => (
                <VehicleCard key={veiculo.id} veiculo={veiculo} vIdx={vIdx} />
              ))}
            </div>
          </div>
        </div>
      </BaseReportLayout>

      {/* ═══ PAGES 2+: INVENTÁRIO DE VEÍCULOS (CHUNKS) ═══ */}
      {vehicleChunks.map((chunk, chunkIdx) => {
        const startIdx = VEHICLES_PAGE_1 + chunkIdx * VEHICLES_PAGE_N;
        const endIdx = Math.min(startIdx + VEHICLES_PAGE_N, data.veiculos.length);

        return (
          <BaseReportLayout
            key={chunkIdx}
            title="Relatório de Estoque com Sócios"
            empresa={empresa}
            watermark={watermark}
            subtitle="Posição Analítica de Ativos e Participações"
            pageNumber={2 + chunkIdx}
            totalPages={totalPages}
            isManualPagination={true}
          >
            <div style={{ padding: '0.4rem 1.5rem 1rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#0f172a', margin: '0 0 4px 0' }}>Inventário Analítico de Veículos</h3>
                  <p style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Detalhamento por ativo e participações individuais {chunkIdx > 0 && '(Continuação)'}
                  </p>
                </div>
                <span style={{
                  fontSize: '8px', fontWeight: 900, color: '#64748b',
                  background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px',
                  textTransform: 'uppercase', letterSpacing: '1px',
                }}>
                  {startIdx + 1}–{endIdx} de {data.veiculos.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {chunk.map((veiculo: any, vIdx: number) => (
                  <VehicleCard key={veiculo.id} veiculo={veiculo} vIdx={vIdx} />
                ))}
              </div>
            </div>
          </BaseReportLayout>
        );
      })}
    </div>
  );
};

export default EstoqueComSociosTemplate;