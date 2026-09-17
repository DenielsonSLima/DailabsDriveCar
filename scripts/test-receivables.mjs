import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Renderização sem rede, usando os mesmos componentes da aplicação.
process.env.TZ = 'America/Maceio';
const temp = await mkdtemp(join(tmpdir(), 'drivecar-receivables-'));
try {
  await build({
    stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
      import assert from 'node:assert/strict';
      import React from 'react';
      import { MemoryRouter } from 'react-router-dom';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { buildPaymentSchedule, getSaleSettlement } from './modules/pedidos-venda/utils/payment-schedule';
      import { formatDateOnly } from './utils/date';
      import FinancialCard from './modules/pedidos-venda/components/details/FinancialCard';
      import ConfirmSale from './modules/pedidos-venda/components/details/ModalConfirmacaoVenda';
      import Receivables from './modules/financeiro/submodules/contas-receber/ContasReceber.page';

      const installment = { qtd_parcelas: 3, dias_primeira_parcela: 30, dias_entre_parcelas: 30 };
      const schedule = buildPaymentSchedule(20000, '2026-09-15', installment);
      assert.deepEqual(schedule.map(p => p.valor), [6666.67, 6666.67, 6666.66]);
      assert.equal(schedule.reduce((sum, p) => sum + Math.round(p.valor * 100), 0), 2000000);
      assert.deepEqual(buildPaymentSchedule(20000, '2026-09-15', { ...installment, qtd_parcelas: 1, dias_primeira_parcela: 60 }),
        [{ numero: 1, data_vencimento: '2026-11-14', valor: 20000 }]);
      assert.equal(formatDateOnly('2026-11-14'), '14/11/2026');
      assert.equal(buildPaymentSchedule(100, '2024-01-31', { ...installment, qtd_parcelas: 1, dias_primeira_parcela: 30 })[0].data_vencimento, '2024-03-01');

      const titles = [
        { tipo: 'RECEBER', origem_tipo: 'PEDIDO_VENDA', status: 'PAGO', valor_pago: 20000, valor_liquidado: 20000 },
        { tipo: 'RECEBER', origem_tipo: 'PEDIDO_VENDA', status: 'PENDENTE', valor_pago: 0, valor_liquidado: 0 },
        { tipo: 'RECEBER', origem_tipo: 'PEDIDO_VENDA', status: 'CANCELADO', valor_pago: 123 },
        { tipo: 'RECEBER', origem_tipo: 'MANUAL', status: 'PAGO', valor_pago: 456 },
      ];
      assert.deepEqual(getSaleSettlement(titles), { recebido: 20000, liquidado: 20000 });
      assert.deepEqual(getSaleSettlement([{ ...titles[0], valor_pago: 19000, valor_liquidado: 20000 }]), { recebido: 19000, liquidado: 20000 });
      const pedido = { id: 'sale', status: 'CONCLUIDO', valor_venda: 40000, data_venda: '2026-09-16', titulos: titles,
        pagamentos: [
          { id: 'cash', valor: 20000, data_recebimento: '2026-09-16', forma_pagamento: { nome: 'PIX' }, conta_bancaria_id: 'bank' },
          { id: 'term', valor: 20000, data_recebimento: '2026-11-14', forma_pagamento: { nome: 'PRAZO' } },
        ] };
      const markup = renderToStaticMarkup(<FinancialCard pedido={pedido as any} valorVendaEfetivo={40000} onAddPayments={() => {}} onDeletePayment={() => {}} isSaving={false} />);
      assert.match(markup, /width:50%/);
      assert.match(markup, /Saldo a receber/);
      assert.match(markup, /14\\/11\\/2026/);
      assert.match(markup, /16\\/09\\/2026/);
      const confirmation = renderToStaticMarkup(<ConfirmSale pedido={pedido as any} valorVendaEfetivo={40000} onConfirm={() => {}} onClose={() => {}} isLoading={false} />);
      assert.match(confirmation, /14\\/11\\/2026/);
      assert.doesNotMatch(confirmation, /Escolha a regra/);
      assert.doesNotMatch(confirmation, /A composição precisa totalizar/);
      const invalid = renderToStaticMarkup(<ConfirmSale pedido={{ ...pedido, pagamentos: [pedido.pagamentos[0]] } as any} valorVendaEfetivo={40000} onConfirm={() => {}} onClose={() => {}} isLoading={false} />);
      assert.match(invalid, /A composição precisa totalizar/);
      assert.match(invalid, /disabled=""/);

      const list = renderToStaticMarkup(<MemoryRouter><Receivables /></MemoryRouter>);
      assert.equal((list.match(/Baixar Título/g) || []).length, 10, 'Cada parcela da mesma venda deve continuar visível');
      assert.match(list, /14 registros/);
      assert.match(list, /de <span[^>]*>2<\\/span>/, 'A segunda página deve ser acessível');
      console.log('OK: centavos, prazo de 60 dias, fuso horário, quitação real, confirmação e paginação de 14 títulos.');
    ` },
    bundle: true, platform: 'node', format: 'cjs', outfile: join(temp, 'test.cjs'), logLevel: 'silent',
    plugins: [{ name: 'offline-services', setup(build) {
      build.onLoad({ filter: /lib\/supabase\.ts$/ }, () => ({ contents: 'export const supabase = {};', loader: 'ts' }));
      build.onResolve({ filter: /^@tanstack\/react-query$/ }, () => ({ path: 'query-mock', namespace: 'test' }));
      build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `
        export const useQueryClient = () => ({ invalidateQueries() {} });
        export const useMutation = () => ({ mutate() {} });
        export const useQuery = ({ queryKey }) => ({ isLoading: false, data: queryKey[0] === 'contas-receber' ? {
          count: 14, totalPages: 2, currentPage: 1,
          data: Array.from({ length: 10 }, (_, i) => ({ id: String(i), venda_pedido_id: 'same-sale', origem_tipo: 'PEDIDO_VENDA',
            descricao: 'Parcela ' + i, status: 'PENDENTE', valor_total: 100, valor_pago: 0, valor_pendente: 100, data_vencimento: '2026-11-14' }))
        } : queryKey[0] === 'financeiro-categorias' ? [] : undefined });
      `, loader: 'js' }));
    } }],
  });
  await import(pathToFileURL(join(temp, 'test.cjs')).href);
} finally {
  await rm(temp, { recursive: true, force: true });
}
