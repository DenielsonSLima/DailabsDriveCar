import React from 'react';
import BaseReportLayout from '../BaseReportLayout';
import { IEmpresa } from '../../../ajustes/empresa/empresa.types';

interface Props {
    data: any;
    empresa?: IEmpresa;
    watermark?: any; // Config object
    periodo?: string;
}

const CaixaTemplate: React.FC<Props> = ({ data, empresa, watermark, periodo }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
    const fmtK = (v: number) => {
        if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
        if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
        return v.toFixed(0);
    };

    const kpis = [
        { label: 'Patrimônio Líquido', val: data.patrimonio_liquido, color: '#4f46e5', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { label: 'Saldo Disponível', val: data.saldo_disponivel, color: '#10b981', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Ativos (Estoque)', val: data.total_ativos_estoque, color: '#3b82f6', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', sub: `${data.qtd_veiculos_estoque ?? 0} veículos` },
        { label: 'Contas a Receber', val: data.total_recebiveis, color: '#f59e0b', icon: 'M9 14l6-6m-5.5 .5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
        { label: 'Contas a Pagar', val: data.total_passivo_circulante, color: '#f43f5e', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
        { label: 'Lucro do Mês', val: data.lucro_mensal, color: '#6366f1', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
        { label: 'Vendas (Recebido)', val: data.total_vendas_recebido, color: '#06b6d4', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Compra (Vendidos)', val: data.total_custo_vendas, color: '#64748b', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { label: 'Despesas Fixas', val: data.total_despesas_fixas, color: '#e11d48', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { label: 'Despesas Variáveis', val: data.total_despesas_variaveis, color: '#e11d48', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    ];

    const history = data.history || [];
    const maxVal = Math.max(...history.flatMap((m: any) => [m.faturado, m.custo, m.despesas]), 100000);

    const allVehicles: any[] = [];
    const vehicleMap = new Map();
    (data.socios || []).forEach((socio: any) => {
        (socio.veiculos || []).forEach((v: any) => {
            if (!v || !v.id) return;
            if (!vehicleMap.has(v.id)) {
                vehicleMap.set(v.id, { ...v, partners: [] });
                allVehicles.push(vehicleMap.get(v.id));
            }
            vehicleMap.get(v.id).partners.push({
                nome: socio.nome ? socio.nome.split(' ')[0] : 'Sócio',
                valor: v.valor,
                percent: v.valor_total_custo > 0 ? (v.valor / v.valor_total_custo) * 100 : 0
            });
        });
    });
    const sortedVehicles = allVehicles.sort((a, b) => (a.modelo || '').localeCompare(b.modelo || ''));

    // Split vehicles into chunks of 5 per page
    const vehicleChunks = [];
    for (let i = 0; i < sortedVehicles.length; i += 5) {
        vehicleChunks.push(sortedVehicles.slice(i, i + 5));
    }

    return (
        <div className="report-container" style={{ backgroundColor: '#f8fafc' }}>
            <style>{`
        @media print {
          .page-break { page-break-before: always; }
        }
        .report-card { background: white; border-radius: 1.5rem; border: 1px solid #e2e8f0; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
        .kpi-card { padding: 1rem; border-radius: 1rem; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 0.75rem; }
        .kpi-card-main { background: #4f46e5; border-color: #4338ca; color: white; }
        .kpi-icon { width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; shrink-0; }
        .chart-container { height: 250px; position: relative; border-left: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-left: 2rem; margin-top: 2rem; }
        .y-axis { position: absolute; left: -2.5rem; top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: space-between; font-size: 8px; font-weight: bold; color: #94a3b8; text-align: right; width: 2rem; }
        .bars-area { position: absolute; inset: 0; display: flex; align-items: flex-end; }
        .bar-group { flex: 1; display: flex; align-items: flex-end; justify-content: center; gap: 4px; padding: 0 10px; height: 100%; position: relative; }
        .bar { width: 15px; border-top-left-radius: 2px; border-top-right-radius: 2px; position: relative; }
        .bar-label { position: absolute; bottom: -1.5rem; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; width: 100%; text-align: center; }
        .profit-line { position: absolute; inset: 0; pointer-events: none; }
        .vehicle-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; margin-bottom: 1rem; overflow: hidden; display: flex; }
        .vehicle-info { padding: 1.5rem; border-right: 1px solid #f1f5f9; flex: 1; display: flex; gap: 1rem; align-items: center; }
        .vehicle-equity { width: 180px; padding: 1.5rem; background: #f8fafc; text-align: center; border-right: 1px solid #f1f5f9; display: flex; flex-direction: column; justify-content: center; }
        .vehicle-partners { width: 240px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; gap: 0.5rem; }
        .partner-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; background: #f8fafc; border-radius: 0.75rem; font-size: 10px; }
      `}</style>

            {/* PAGE 1: KPIs, Charts, and Accounts */}
            <BaseReportLayout title="Relatório Financeiro & Patrimônio" empresa={empresa} watermark={watermark} subtitle={periodo} pageNumber={1} totalPages={1 + vehicleChunks.length} isManualPagination={true}>
                <div style={{ padding: '0.5rem 2rem 2rem 2rem' }}>
                    {/* KPIs Section */}
                    <div className="kpi-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0.75rem',
                        width: '100%',
                        marginBottom: '1.5rem'
                    }}>
                        {kpis.map((k, i) => (
                            <div key={i} className={`kpi-card ${i < 2 ? 'kpi-card-main' : ''}`} style={{ marginBottom: 0, minWidth: 0 }}>
                                <div className="kpi-icon" style={{ backgroundColor: i < 2 ? 'rgba(255,255,255,0.2)' : `${k.color}15`, color: i < 2 ? 'white' : k.color }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={i < 2 ? '#FFFFFF' : k.color} strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
                                    </svg>
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontSize: '7px', fontWeight: 'black', textTransform: 'uppercase', color: i < 2 ? 'rgba(255,255,255,0.8)' : '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.label}</p>
                                    <h4 style={{ fontSize: '11px', fontWeight: 'black', margin: 0 }}>{fmt(k.val)}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        {/* PERFORMANCE CHART */}
                        <div className="report-card" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', margin: 0 }}>Desempenho Trimestral</h3>
                                    <p style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', margin: '1px 0 0 0' }}>Histórico faturado, custos e lucro</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['FAT', 'CUS', 'DES'].map((l, i) => (
                                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <div style={{ width: '6px', height: '6px', backgroundColor: i === 0 ? '#2563eb' : i === 1 ? '#64748b' : '#f43f5e' }}></div>
                                            <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#64748b' }}>{l}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="chart-container" style={{ height: '180px', marginTop: '1rem' }}>
                                <div className="y-axis">
                                    <span>{fmtK(maxVal)}</span>
                                    <span>{fmtK(maxVal * 0.5)}</span>
                                    <span>0</span>
                                </div>
                                <div className="bars-area">
                                    {history.map((m: any, i: number) => {
                                        const hF = (m.faturado / maxVal) * 100;
                                        const hC = (m.custo / maxVal) * 100;
                                        const hD = (m.despesas / maxVal) * 100;
                                        return (
                                            <div key={i} className="bar-group">
                                                <div className="bar" style={{ height: `${hF}%`, background: '#2563eb' }}></div>
                                                <div className="bar" style={{ height: `${hC}%`, background: '#64748b' }}></div>
                                                <div className="bar" style={{ height: `${hD}%`, background: '#f43f5e' }}></div>
                                                <div className="bar-label" style={{ fontSize: '7px', bottom: '-1.2rem' }}>{m.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <svg className="profit-line" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ height: '100%', width: '100%', top: 0, left: 0 }}>
                                    {(() => {
                                        const profitMax = Math.max(...history.map((m: any) => m.lucro), 50000);
                                        const getX = (i: number) => (i + 0.5) * (100 / history.length);
                                        const getY = (v: number) => 100 - (v / profitMax) * 60 - 20;
                                        const points = history.map((m: any, i: number) => `${getX(i)},${getY(m.lucro)}`).join(' ');
                                        return <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" />;
                                    })()}
                                </svg>
                            </div>
                        </div>

                        {/* BANK ACCOUNTS */}
                        <div className="report-card" style={{ marginBottom: 0 }}>
                            <h3 style={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Saldos em Conta</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {(data.contas || []).slice(0, 4).map((c: any) => (
                                    <div key={c.id} style={{ padding: '0.5rem', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '1.5rem', height: '1.5rem', background: c.cor_cartao || '#6366f1', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', fontWeight: 'black' }}>
                                                {(c.banco_nome || '').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '9px', fontWeight: 'black', margin: 0, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.banco_nome}</p>
                                                <p style={{ fontSize: '6px', color: '#94a3b8', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.titular || 'Titular não informado'}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '10px', fontWeight: 'black', margin: 0 }}>{fmt(c.saldo_atual)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                                <span style={{ fontSize: '8px', fontWeight: 'black', color: '#94a3b8', textTransform: 'uppercase' }}>Disponível</span>
                                <span style={{ fontSize: '14px', fontWeight: 'black', color: '#4f46e5' }}>{fmt(data.saldo_disponivel)}</span>
                            </div>
                        </div>
                    </div>

                    {/* SOCIO SUMMARY - Page 1 */}
                    <div>
                        <h3 style={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Participação de Sócios</h3>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {(data.socios || []).map((socio: any, idx: number) => {
                                return (
                                    <div key={idx} className="report-card" style={{ padding: '0.75rem', flex: 1, marginBottom: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <div style={{ width: '1.5rem', height: '1.5rem', background: '#4f46e5', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '0.75rem', height: '0.75rem' }} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <h4 style={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', margin: 0 }}>{socio.nome ? socio.nome.split(' ')[0] : 'Sócio'}</h4>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 'black', margin: 0 }}>{fmt(socio.valor_investido)}</p>
                                            <p style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Exposto ({socio.porcentagem_participacao?.toFixed(0)}%)</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </BaseReportLayout>

            {/* PAGE 2+: Chunked Vehicles */}
            {vehicleChunks.filter(chunk => chunk.length > 0).map((chunk, chunkIdx) => (
                <BaseReportLayout
                    key={chunkIdx}
                    title="Detalhamento de Veículos"
                    empresa={empresa}
                    watermark={watermark}
                    subtitle={periodo}
                    pageNumber={2 + chunkIdx}
                    totalPages={1 + vehicleChunks.length}
                    isManualPagination={true}
                >
                    <div style={{ padding: '0.5rem 2rem 2rem 2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {chunk.map((row: any, ridx: number) => (
                                <div key={ridx} className="vehicle-row" style={{ display: 'flex', gap: '1rem', padding: '0.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                                    <div className="vehicle-model" style={{ flex: 1, padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            {row.marca_logo && <img src={row.marca_logo} style={{ width: '20px', height: '20px', objectFit: 'contain' }} alt="" />}
                                            <div>
                                                <span style={{ fontSize: '7px', fontWeight: 'black', color: '#6366f1', textTransform: 'uppercase' }}>{row.marca || row.montadora}</span>
                                                <h4 style={{ fontSize: '12px', fontWeight: 'black', color: '#0f172a', margin: 0 }}>{row.modelo}</h4>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 'black', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{row.ano_fabricacao}/{row.ano_modelo}</span>
                                            {row.motorizacao && <span style={{ fontSize: '8px', fontWeight: 'black', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{row.motorizacao}</span>}
                                            {row.cambio && <span style={{ fontSize: '8px', fontWeight: 'black', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{row.cambio}</span>}
                                            {row.combustivel && <span style={{ fontSize: '8px', fontWeight: 'black', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{row.combustivel}</span>}
                                        </div>
                                    </div>
                                    <div className="vehicle-equity" style={{ width: '150px', padding: '1rem' }}>
                                        <span style={{ fontSize: '7px', fontWeight: 'black', color: '#94a3b8', textTransform: 'uppercase' }}>Equity Custo</span>
                                        <p style={{ fontSize: '13px', fontWeight: 'black', color: '#0f172a', margin: 0 }}>{fmt(row.valor_total_custo)}</p>
                                    </div>
                                    <div className="vehicle-partners" style={{ width: '220px', padding: '0.75rem', gap: '4px' }}>
                                        {row.partners.map((p: any, pidx: number) => (
                                            <div key={pidx} className="partner-row" style={{ padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                                                <span style={{ fontSize: '9px', fontWeight: 'black' }}>{p.nome}</span>
                                                <span style={{ fontSize: '9px', fontWeight: 'black' }}>{fmt(p.valor)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </BaseReportLayout>
            ))}
        </div>
    );
};

export default CaixaTemplate;
