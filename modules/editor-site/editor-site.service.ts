import { supabase } from '../../lib/supabase';
import { ISiteConteudo, SiteConteudoSchema } from './editor-site.types';

export const EditorSiteService = {

    /**
     * Busca o conteúdo atual do site (singleton — retorna sempre 1 registro).
     */
    async getSiteContent(): Promise<ISiteConteudo> {
        const { data, error } = await supabase
            .from('site_conteudo')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar conteúdo do site:', error);
            throw error;
        }

        if (!data) {
            throw new Error('Nenhum conteúdo do site encontrado. Insira um registro na tabela site_conteudo.');
        }

        return SiteConteudoSchema.parse(data);
    },

    /**
     * Atualiza o conteúdo do site.
     */
    async updateSiteContent(id: string, updates: Partial<Omit<ISiteConteudo, 'id'>>): Promise<ISiteConteudo> {
        const { data, error } = await supabase
            .from('site_conteudo')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Erro ao atualizar conteúdo do site:', error);
            throw error;
        }

        return SiteConteudoSchema.parse(data);
    },
};
