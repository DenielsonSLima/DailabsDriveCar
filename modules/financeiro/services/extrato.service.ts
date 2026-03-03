import { supabase } from '../../../lib/supabase';
import { ITransacao, IExtratoFiltros, IExtratoResponse, IExtratoTotals } from '../financeiro.types';
import { IContaBancaria } from '../../ajustes/contas-bancarias/contas.types';

export const ExtratoService = {
    async getExtrato(filtros: IExtratoFiltros = {}): Promise<IExtratoResponse> {
        const page = filtros.page || 1;
        const limit = filtros.limit || 20;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryTransacoes = supabase
            .from('fin_transacoes')
            .select(`
        id,
        valor,
        data_pagamento,
        tipo,
        tipo_transacao,
        descricao,
        titulo:fin_titulos(descricao, status),
        conta_origem:fin_contas_bancarias(banco_nome, conta),
        forma_pagamento:cad_formas_pagamento(nome)
      `, { count: 'exact' })
            .neq('tipo_transacao', 'ESTORNO');

        if (filtros.dataInicio) queryTransacoes = queryTransacoes.gte('data_pagamento', filtros.dataInicio);
        if (filtros.dataFim) queryTransacoes = queryTransacoes.lte('data_pagamento', filtros.dataFim);
        if (filtros.tipo) queryTransacoes = queryTransacoes.eq('tipo', filtros.tipo);

        const { data: transacoes, error: errT, count } = await queryTransacoes
            .order('data_pagamento', { ascending: false })
            .range(from, to);

        if (errT) throw errT;

        const filteredData = (transacoes || []).filter((t: any) => !t.titulo || t.titulo.status !== 'CANCELADO');

        return {
            data: filteredData as unknown as ITransacao[],
            count: count || 0,
            currentPage: page,
            totalPages: Math.ceil((count || 0) / limit)
        };
    },

    async getExtratoTotals(filtros: IExtratoFiltros = {}): Promise<IExtratoTotals> {
        let query = supabase
            .from('fin_transacoes')
            .select('valor, tipo, tipo_transacao, titulo:fin_titulos(status)')
            .neq('tipo_transacao', 'ESTORNO');

        if (filtros.dataInicio) query = query.gte('data_pagamento', filtros.dataInicio);
        if (filtros.dataFim) query = query.lte('data_pagamento', filtros.dataFim);
        if (filtros.tipo) query = query.eq('tipo', filtros.tipo);

        const { data, error } = await query;
        if (error) throw error;

        const filtered = (data || []).filter((t: any) => !t.titulo || t.titulo.status !== 'CANCELADO');

        const entradas = filtered.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + (t.valor || 0), 0);
        const saidas = filtered.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + (t.valor || 0), 0);

        return {
            entradas,
            saidas,
            balanco: entradas - saidas
        };
    },

    async getExtratoPorConta(contaId: string, dataInicio: string, dataFim: string): Promise<{ saldoAnterior: number, transacoes: ITransacao[], saldoFINAL: number }> {
        const { data: conta, error: errC } = await supabase.from('fin_contas_bancarias').select('saldo_inicial').eq('id', contaId).single();
        if (errC) throw errC;
        let saldo = Number(conta?.saldo_inicial || 0);

        const { data: pastTx, error: errP } = await supabase.from('fin_transacoes').select('valor, tipo').eq('conta_origem_id', contaId).lt('data_pagamento', dataInicio)
        if (errP) throw errP;

        if (pastTx) {
            saldo += pastTx.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
            saldo -= pastTx.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
        }
        const saldoAnterior = saldo;

        const { data: currentTx, error } = await supabase
            .from('fin_transacoes')
            .select(`
        id, valor, data_pagamento, tipo, tipo_transacao, descricao,
        titulo:fin_titulos(descricao, status, parceiro:parceiros(nome)),
        forma_pagamento:cad_formas_pagamento(nome)
      `)
            .eq('conta_origem_id', contaId)
            .neq('tipo_transacao', 'ESTORNO')
            .gte('data_pagamento', dataInicio)
            .lte('data_pagamento', dataFim + 'T23:59:59')
            .order('data_pagamento', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;

        const filteredTx = (currentTx || []).filter((t: any) => !t.titulo || t.titulo.status !== 'CANCELADO');

        let saldoFINAL = saldoAnterior;
        if (filteredTx) {
            saldoFINAL += filteredTx.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
            saldoFINAL -= filteredTx.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + Number(t.valor || 0), 0);
        }

        return {
            saldoAnterior,
            transacoes: (filteredTx || []) as unknown as ITransacao[],
            saldoFINAL
        };
    },

    async getContasBancarias(): Promise<IContaBancaria[]> {
        const { data, error } = await supabase
            .from('fin_contas_bancarias')
            .select('*')
            .eq('ativo', true)
            .order('banco_nome');
        if (error) throw error;
        return data as IContaBancaria[];
    }
};
