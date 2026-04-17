import React from 'react';
import BaseReportLayout from '../BaseReportLayout';
import { IEmpresa } from '../../../ajustes/empresa/empresa.types';

interface Props {
    data: {
        periodo: string;
        inicial: any;
        final: any;
        transacoes: any[];
    };
    empresa?: IEmpresa;
    watermark?: any;
}

const PatrimonioConciliacaoTemplate: React.FC<Props> = ({ data, empresa, watermark }) => {
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const { inicial, final, transacoes, periodo } = data;

    // Totais do Período
    const totalEntradas = transacoes.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + (t.valor || 0), 0);
    const totalSaidas = transacoes.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + (t.valor || 0), 0);
    const saldoMovimentacao = totalEntradas - totalSaidas;

    return (
        <div className="report-container" style={{ backgroundColor: '#f8fafc' }}>
            <style>{`
                .conciliacao-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
                .pl-card { background: white; border-radius: 1.5rem; border: 1px solid #e2e8f0; padding: 1.5rem; }
                .pl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; }
                .pl-title { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                .pl-value { font-size: 18px; font-weight: 900; color: #0f172a; }
                .comp-row { display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 10px; border-bottom: 1px dotted #f1f5f9; }
                .comp-label { color: #64748b; font-weight: bold; }
                .comp-val { font-weight: 800; color: #1e293b; }
                
                .extrato-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 9px; }
                .extrato-table th { background: #f1f5f9; padding: 8px; text-align: left; font-weight: 900; color: #475569; text-transform: uppercase; font-size: 7px; }
                .extrato-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
                .val-pos { color: #059669; font-weight: 900; }
                .val-neg { color: #dc2626; font-weight: 900; }
                
                .summary-banner { background: #0f172a; border-radius: 1.5rem; padding: 1.5rem; color: white; margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
            `}</style>

            {/* PAGE 1: SALDOS INICIAL E FINAL */}
            <BaseReportLayout title="Conciliação de Patrimônio Líquido" empresa={empresa} watermark={watermark} subtitle={periodo} pageNumber={1} totalPages={2}>
                <div style={{ padding: '1.5rem' }}>
                    
                    <div className="conciliacao-grid">
                        {/* PATRIMÔNIO INICIAL */}
                        <div className="pl-card" style={{ borderLeft: '4px solid #94a3b8' }}>
                            <div className="pl-header">
                                <span className="pl-title">Mês Anterior (Fechamento)</span>
                                <div style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>SALDO INICIAL</div>
                            </div>
                            <div className="pl-value" style={{ marginBottom: '1rem' }}>{fmt(inicial.patrimonio_liquido)}</div>
                            
                            <div className="comp-row"><span className="comp-label">Disponível em Contas</span><span className="comp-val">{fmt(inicial.saldo_disponivel)}</span></div>
                            <div className="comp-row"><span className="comp-label">Ativos em Estoque</span><span className="comp-val">{fmt(inicial.total_ativos_estoque)}</span></div>
                            <div className="comp-row"><span className="comp-label">Contas a Receber</span><span className="comp-val">{fmt(inicial.total_recebiveis)}</span></div>
                            <div className="comp-row" style={{ borderBottom: 'none' }}><span className="comp-label">Passivo Circulante</span><span className="comp-val" style={{ color: '#dc2626' }}>- {fmt(inicial.total_passivo_circulante)}</span></div>
                        </div>

                        {/* PATRIMÔNIO FINAL */}
                        <div className="pl-card" style={{ borderLeft: '4px solid #4f46e5', background: '#f5f3ff' }}>
                            <div className="pl-header">
                                <span className="pl-title">Mês Atual (Fechamento)</span>
                                <div style={{ background: '#4f46e5', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '8px', fontWeight: 'bold' }}>SALDO FINAL</div>
                            </div>
                            <div className="pl-value" style={{ marginBottom: '1rem', color: '#4f46e5' }}>{fmt(final.patrimonio_liquido)}</div>
                            
                            <div className="comp-row"><span className="comp-label">Disponível em Contas</span><span className="comp-val">{fmt(final.saldo_disponivel)}</span></div>
                            <div className="comp-row"><span className="comp-label">Ativos em Estoque</span><span className="comp-val">{fmt(final.total_ativos_estoque)}</span></div>
                            <div className="comp-row"><span className="comp-label">Contas a Receber</span><span className="comp-val">{fmt(final.total_recebiveis)}</span></div>
                            <div className="comp-row" style={{ borderBottom: 'none' }}><span className="comp-label">Passivo Circulante</span><span className="comp-val" style={{ color: '#dc2626' }}>- {fmt(final.total_passivo_circulante)}</span></div>
                        </div>
                    </div>

                    <div className="pl-card" style={{ background: '#fff' }}>
                        <h3 style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '1rem', color: '#4338ca' }}>Resumo da Variação</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Lucro Operacional</p>
                                <p style={{ fontSize: '14px', fontWeight: '900', color: final.lucro_mensal >= 0 ? '#059669' : '#dc2626', margin: 0 }}>{fmt(final.lucro_mensal)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Entradas Cash</p>
                                <p style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{fmt(totalEntradas)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Saídas Cash</p>
                                <p style={{ fontSize: '14px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{fmt(totalSaidas)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '7px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Variação de PL</p>
                                <p style={{ fontSize: '14px', fontWeight: '900', color: '#4f46e5', margin: 0 }}>{fmt(final.patrimonio_liquido - inicial.patrimonio_liquido)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="summary-banner">
                        <div>
                            <h4 style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>Análise de Consistência</h4>
                            <p style={{ fontSize: '8px', color: '#818cf8', fontWeight: 'bold', marginTop: '4px' }}>Comparativo entre o saldo inicial e o resultado do período</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Diferença Apurada</span>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: '#10b981' }}>{fmt(final.patrimonio_liquido - (inicial.patrimonio_liquido + final.lucro_mensal))}</span>
                            <p style={{ fontSize: '6px', color: '#64748b' }}>* Variação técnica (compra/venda de ativos)</p>
                        </div>
                    </div>

                </div>
            </BaseReportLayout>

            {/* PAGE 2: EXTRATO DETALHADO */}
            <BaseReportLayout title="Extrato de Movimentações" empresa={empresa} watermark={watermark} subtitle={periodo} pageNumber={2} totalPages={2}>
                <div style={{ padding: '1rem 1.5rem' }}>
                    <table className="extrato-table">
                        <thead>
                            <tr>
                                <th style={{ width: '12%' }}>Data</th>
                                <th style={{ width: '40%' }}>Descrição / Parceiro</th>
                                <th style={{ width: '20%' }}>Categoria</th>
                                <th style={{ width: '13%', textAlign: 'center' }}>Tipo</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transacoes.map((t, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 'bold' }}>{new Date(t.data_pagamento).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <div style={{ fontWeight: '800', color: '#1e293b' }}>{t.descricao || 'Sem descrição'}</div>
                                        <div style={{ fontSize: '7px', color: '#94a3b8', textTransform: 'uppercase' }}>{t.titulo?.parceiro?.nome || '—'}</div>
                                    </td>
                                    <td style={{ textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', fontSize: '7px' }}>{t.categoria?.nome || t.titulo?.origem_tipo || 'Geral'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ 
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '6px', fontWeight: '900', 
                                            background: t.tipo === 'ENTRADA' ? '#ecfdf5' : '#fff1f2', 
                                            color: t.tipo === 'ENTRADA' ? '#059669' : '#e11d48'
                                        }}>
                                            {t.tipo}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: '10px' }} className={t.tipo === 'ENTRADA' ? 'val-pos' : 'val-neg'}>
                                        {t.tipo === 'SAIDA' ? '-' : ''} {fmt(t.valor)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Total Entradas</span>
                            <p style={{ fontSize: '12px', fontWeight: '900', color: '#059669', margin: 0 }}>{fmt(totalEntradas)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Total Saídas</span>
                            <p style={{ fontSize: '12px', fontWeight: '900', color: '#dc2626', margin: 0 }}>{fmt(totalSaidas)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Saldo Líquido</span>
                            <p style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{fmt(saldoMovimentacao)}</p>
                        </div>
                    </div>
                </div>
            </BaseReportLayout>
        </div>
    );
};

export default PatrimonioConciliacaoTemplate;
