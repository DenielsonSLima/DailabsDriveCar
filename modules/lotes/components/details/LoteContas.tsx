import React from 'react';
import type { ITitulo } from '../../../financeiro/financeiro.types';
import type { ILoteCatalogos, ILoteDetalhes, ILoteVenda } from '../../lotes.types';
import { getTituloPendente } from '../../lotes.utils';
import { dateLabel, money, secondaryClass } from '../LoteUi';
import { LoteEmpty, LoteSection, tableTdClass, tableThClass } from './LoteDetailUi';

export function separarContasLote(detalhes: ILoteDetalhes) {
  const despesasIds = new Set(detalhes.despesas.map(despesa => despesa.titulo_id));
  const despesas = detalhes.titulos.filter(titulo => titulo.tipo === 'PAGAR'
    && (despesasIds.has(titulo.id) || titulo.origem_tipo === 'DESPESA_LOTE'));
  const entrada = detalhes.titulos.filter(titulo => titulo.tipo === 'PAGAR'
    && !despesasIds.has(titulo.id) && titulo.origem_tipo !== 'DESPESA_LOTE');
  const saidas = detalhes.titulos.filter(titulo => titulo.tipo === 'RECEBER');
  return { entrada, despesas, saidas };
}

export function totaisContas(titulos: ITitulo[]) {
  const ativos = titulos.filter(titulo => titulo.status !== 'CANCELADO');
  return {
    pago: ativos.reduce((total, titulo) => total + Math.round(Number(titulo.valor_pago || 0) * 100), 0) / 100,
    pendente: ativos.reduce((total, titulo) => total + Math.round(getTituloPendente(titulo) * 100), 0) / 100,
  };
}

function getPartesContextoTitulo(titulo: ITitulo, vendas: ILoteVenda[], catalogos?: ILoteCatalogos) {
  const venda = vendas.find(item => item.id === titulo.venda_pedido_id);
  const parceiroId = titulo.parceiro_id || venda?.cliente_id;
  const parceiro = titulo.parceiro?.nome || catalogos?.parceiros.find(item => item.id === parceiroId)?.nome || venda?.cliente_nome;
  const pessoa = parceiro || (parceiroId ? `${titulo.tipo === 'RECEBER' ? 'Cliente' : 'Fornecedor'} #${parceiroId.slice(0, 8)}` : 'Parceiro não informado');
  const vendaId = venda?.id || titulo.venda_pedido_id;
  const origem = vendaId ? `Venda ${venda?.numero_venda || `#${vendaId.slice(0, 8)}`}` : titulo.pedido_id ? `Compra #${titulo.pedido_id.slice(0, 8)}` : titulo.documento_ref || '';
  const parcela = `Parcela ${titulo.parcela_numero || 1}/${titulo.parcela_total || 1}`;
  return { pessoa, origem, parcela, vencimento: `Vencimento ${dateLabel(titulo.data_vencimento)}`, venda };
}

export function getContextoTituloLote(titulo: ITitulo, vendas: ILoteVenda[] = [], catalogos?: ILoteCatalogos): string {
  const contexto = getPartesContextoTitulo(titulo, vendas, catalogos);
  return [contexto.pessoa, contexto.origem, contexto.parcela, contexto.vencimento].filter(Boolean).join(' · ');
}

interface Props {
  title: string;
  titulos: ITitulo[];
  canCreate: boolean;
  onBaixar: (titulo: ITitulo) => void;
  vendas?: ILoteVenda[];
  catalogos?: ILoteCatalogos;
}

const statusLabels: Record<ITitulo['status'], string> = {
  PENDENTE: 'Pendente', PARCIAL: 'Parcial', PAGO: 'Pago', ATRASADO: 'Atrasado', CANCELADO: 'Cancelado',
};

export default function LoteContas({ title, titulos, canCreate, onBaixar, vendas = [], catalogos }: Props) {
  return (
    <LoteSection title={title} subtitle="Acompanhe as parcelas e faça baixas parciais mantendo o saldo restante.">
      {titulos.length === 0 ? <LoteEmpty>Nenhuma conta registrada nesta aba.</LoteEmpty> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-slate-50"><tr>{['Parceiro / origem / parcela', 'Vencimento', 'Valor', 'Liquidado', 'Em aberto', 'Situação', ''].map((label, index) => <th key={index} scope="col" className={tableThClass}>{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {titulos.map(titulo => {
                const pendente = getTituloPendente(titulo);
                const contexto = getPartesContextoTitulo(titulo, vendas, catalogos);
                return (
                  <tr key={titulo.id} className={titulo.status === 'CANCELADO' ? 'bg-slate-50 text-slate-400' : ''}>
                    <td className={`${tableTdClass} min-w-[260px]`}><p className="font-bold text-slate-900">{contexto.pessoa}</p><p className="mt-1 text-xs font-bold text-indigo-600">{[contexto.origem, contexto.parcela].filter(Boolean).join(' · ')}</p><p className="mt-1 text-xs text-slate-500">{titulo.descricao}</p></td>
                    <td className={tableTdClass}>{dateLabel(titulo.data_vencimento)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{money(titulo.valor_total)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap tabular-nums`}>{money(titulo.valor_pago)}</td>
                    <td className={`${tableTdClass} whitespace-nowrap font-bold tabular-nums`}>{money(pendente)}</td>
                    <td className={tableTdClass}><span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wide ${titulo.status === 'CANCELADO' ? 'bg-slate-100 text-slate-500' : pendente > 0.005 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{statusLabels[titulo.status]}</span></td>
                    <td className={tableTdClass}>{titulo.status !== 'CANCELADO' && pendente > 0.005 && <button type="button" disabled={!canCreate} className={secondaryClass} onClick={() => onBaixar(titulo)}>{titulo.tipo === 'RECEBER' ? 'Receber' : 'Pagar'}</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </LoteSection>
  );
}
