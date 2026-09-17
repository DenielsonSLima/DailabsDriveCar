export function buildPaymentSchedule(total: number, baseDate: string, condition: {
  qtd_parcelas: number; dias_primeira_parcela: number; dias_entre_parcelas: number;
}) {
  const cents = Math.round(total * 100);
  const count = condition.qtd_parcelas;
  if (!Number.isSafeInteger(cents) || !Number.isInteger(count) || count < 1 || cents < count) {
    throw new Error('Valor ou quantidade de parcelas inválidos.');
  }
  const baseCents = Math.floor(cents / count);
  const remainder = cents % count;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(`${baseDate.slice(0, 10)}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + condition.dias_primeira_parcela + index * condition.dias_entre_parcelas);
    return {
      numero: index + 1,
      data_vencimento: date.toISOString().slice(0, 10),
      valor: (baseCents + (index < remainder ? 1 : 0)) / 100,
    };
  });
}

export function getSaleSettlement(titles: Array<{
  tipo?: string; origem_tipo?: string; status: string; valor_pago: number; valor_liquidado?: number | null;
}>) {
  const active = titles.filter(t => t.tipo === 'RECEBER' && t.origem_tipo === 'PEDIDO_VENDA' && t.status !== 'CANCELADO');
  return {
    recebido: active.reduce((sum, t) => sum + Math.round(t.valor_pago * 100), 0) / 100,
    liquidado: active.reduce((sum, t) => sum + Math.round((t.valor_liquidado ?? t.valor_pago) * 100), 0) / 100,
  };
}
