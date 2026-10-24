-- Índices de suporte às FKs e ao isolamento por organização dos lotes.
CREATE INDEX est_lote_despesas_categoria_idx ON public.est_lote_despesas(categoria_id);
CREATE INDEX est_lote_despesas_fornecedor_idx ON public.est_lote_despesas(fornecedor_id);
CREATE INDEX est_lote_despesas_organization_idx ON public.est_lote_despesas(organization_id);
CREATE INDEX est_lote_despesas_veiculo_idx ON public.est_lote_despesas(veiculo_id);
CREATE INDEX est_lotes_organization_idx ON public.est_lotes(organization_id);
CREATE INDEX venda_lote_itens_lote_idx ON public.venda_lote_itens(lote_id);
CREATE INDEX venda_lote_itens_organization_idx ON public.venda_lote_itens(organization_id);
