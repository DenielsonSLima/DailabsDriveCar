import { supabase } from '../lib/supabase';

export interface ISearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: 'PARCEIRO' | 'VEICULO' | 'PEDIDO_VENDA' | 'PEDIDO_COMPRA' | 'FINANCEIRO';
    link: string;
}

export const SearchService = {
    async globalSearch(term: string): Promise<ISearchResult[]> {
        if (!term || term.length < 2) return [];

        const cleanTerm = term.trim();
        const ilikeTerm = `%${cleanTerm}%`;

        try {
            const [parceiros, veiculos, vendas, compras, financeiro] = await Promise.all([
                // 1. Parceiros (Nome ou Documento)
                supabase
                    .from('parceiros')
                    .select('id, nome, documento')
                    .or(`nome.ilike.${ilikeTerm},documento.ilike.${ilikeTerm}`)
                    .limit(5),

                // 2. Veículos (Placa ou Modelo)
                supabase
                    .from('est_veiculos')
                    .select(`
            id, 
            placa, 
            modelo:cad_modelos(nome),
            montadora:cad_montadoras(nome)
          `)
                    .or(`placa.ilike.${ilikeTerm}`)
                    .limit(5),

                // 3. Pedidos de Venda
                supabase
                    .from('venda_pedidos')
                    .select('id, numero_venda, cliente:parceiros(nome)')
                    .ilike('numero_venda', ilikeTerm)
                    .limit(3),

                // 4. Pedidos de Compra
                supabase
                    .from('cmp_pedidos')
                    .select('id, numero_pedido, fornecedor:parceiros(nome)')
                    .ilike('numero_pedido', ilikeTerm)
                    .limit(3),

                // 5. Financeiro (Descrição)
                supabase
                    .from('fin_titulos')
                    .select('id, descricao, tipo')
                    .ilike('descricao', ilikeTerm)
                    .limit(5)
            ]);

            const results: ISearchResult[] = [];

            // Mapear Parceiros
            (parceiros.data || []).forEach(p => {
                results.push({
                    id: p.id,
                    title: p.nome,
                    subtitle: p.documento || 'Cliente/Fornecedor',
                    type: 'PARCEIRO',
                    link: `/parceiros?id=${p.id}`
                });
            });

            // Mapear Veículos
            (veiculos.data || []).forEach(v => {
                results.push({
                    id: v.id,
                    title: `${(v.montadora as any)?.nome} ${(v.modelo as any)?.nome}`,
                    subtitle: `Placa: ${v.placa}`,
                    type: 'VEICULO',
                    link: `/estoque/${v.id}`
                });
            });

            // Mapear Vendas
            (vendas.data || []).forEach(v => {
                results.push({
                    id: v.id,
                    title: `Venda #${v.numero_venda}`,
                    subtitle: `Cliente: ${(v.cliente as any)?.nome}`,
                    type: 'PEDIDO_VENDA',
                    link: `/pedidos-venda/${v.id}`
                });
            });

            // Mapear Compras
            (compras.data || []).forEach(c => {
                results.push({
                    id: c.id,
                    title: `Compra #${c.numero_pedido}`,
                    subtitle: `Fornecedor: ${(c.fornecedor as any)?.nome}`,
                    type: 'PEDIDO_COMPRA',
                    link: `/pedidos-compra/${c.id}`
                });
            });

            // Mapear Financeiro
            (financeiro.data || []).forEach(f => {
                results.push({
                    id: f.id,
                    title: f.descricao,
                    subtitle: `Título de ${f.tipo}`,
                    type: 'FINANCEIRO',
                    link: `/financeiro`
                });
            });

            return results;
        } catch (error) {
            console.error('Erro na busca global:', error);
            return [];
        }
    }
};
