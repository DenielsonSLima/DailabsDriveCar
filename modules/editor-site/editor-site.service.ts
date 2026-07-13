import { supabase } from '../../lib/supabase';
import { ISiteConteudo, SiteConteudoSchema } from './editor-site.types';
import { EmpresaService } from '../ajustes/empresa/empresa.service';

export const EditorSiteService = {

    /**
     * Busca o conteúdo atual do site (específico para a organização do usuário logado).
     */
    async getSiteContent(): Promise<ISiteConteudo> {
        // 1. Obter os dados da empresa do usuário logado (para pegar o organization_id)
        const empresa = await EmpresaService.getDadosEmpresa();
        const orgId = empresa?.organization_id;

        let query = supabase.from('site_conteudo').select('*');
        if (orgId) {
            query = query.eq('organization_id', orgId);
        } else {
            query = query.is('organization_id', null);
        }

        const { data, error } = await query
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar conteúdo do site:', error);
            throw error;
        }

        if (!data) {
            // Se não encontrou registro específico para a org, busca o padrão (null) como fallback
            const { data: defaultData, error: defaultError } = await supabase
                .from('site_conteudo')
                .select('*')
                .is('organization_id', null)
                .limit(1)
                .maybeSingle();

            if (defaultError || !defaultData) {
                throw new Error('Nenhum conteúdo do site encontrado. Insira um registro na tabela site_conteudo.');
            }

            // Se o usuário tem uma organização vinculada, cria um registro específico para ela com base no padrão
            if (orgId) {
                const { id: _, created_at: __, updated_at: ___, ...templateData } = defaultData;
                const { data: insertedData, error: insertError } = await supabase
                    .from('site_conteudo')
                    .insert({
                        ...templateData,
                        organization_id: orgId,
                        updated_at: new Date().toISOString()
                    })
                    .select('*')
                    .single();

                if (insertError) {
                    console.error('Erro ao criar conteúdo do site para a organização:', insertError);
                    throw insertError;
                }

                return SiteConteudoSchema.parse(insertedData);
            }

            return SiteConteudoSchema.parse(defaultData);
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
