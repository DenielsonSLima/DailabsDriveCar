import { supabase } from '../../../lib/supabase';
import { ICategoriaFinanceira } from '../financeiro.types';

export const CategoriasService = {
    async getCategorias(): Promise<ICategoriaFinanceira[]> {
        const { data, error } = await supabase
            .from('fin_categorias')
            .select('id, nome, tipo, natureza')
            .order('nome');
        if (error) throw error;
        return data as ICategoriaFinanceira[];
    }
};
