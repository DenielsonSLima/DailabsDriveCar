import { supabase } from '../../../lib/supabase';
import { IFinanceiroKpis, IPendencias } from '../financeiro.types';

export const DashboardService = {
    async getKpis(): Promise<IFinanceiroKpis> {
        const { data, error } = await supabase.rpc('get_financeiro_kpis');
        if (error) {
            console.error('Erro ao buscar KPIs via RPC:', error);
            throw error;
        }
        return data as IFinanceiroKpis;
    },

    async getPendencias(): Promise<IPendencias> {
        const { data, error } = await supabase.rpc('get_financeiro_pendencias');
        if (error) {
            console.error('Erro ao buscar pendências via RPC:', error);
            throw error;
        }
        return data as IPendencias;
    }
};
