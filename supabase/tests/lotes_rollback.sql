-- Executar somente após aplicar a migration, em ambiente de validação autorizado.
-- Forneça o UUID de um usuário de teste membro da organização. O UUID zero
-- abaixo aborta antes de qualquer escrita. Todos os registros e saldos sofrem
-- ROLLBACK ao final; sequências PostgreSQL podem conservar lacunas de numeração.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000000',true);

DO $$
<<teste>>
DECLARE
  org uuid; cliente uuid; categoria uuid; forma uuid; conta uuid;
  pedido uuid:=gen_random_uuid(); origem uuid:=gen_random_uuid(); compra uuid:=gen_random_uuid();
  lote uuid; venda uuid; despesa uuid; req uuid:=gen_random_uuid(); final_venda uuid;
  dados jsonb; idempotent uuid; blocked boolean; saldo_inicial numeric; current_cost numeric;
  snapshot_cost numeric; stock_cost numeric; unidade uuid; title_row record;
BEGIN
  SELECT organization_id INTO org FROM public.organization_members WHERE user_id=auth.uid() LIMIT 1;
  IF org IS NULL THEN RAISE EXCEPTION 'Configure um usuário de teste autenticado antes de executar os cenários.'; END IF;
  SELECT id INTO cliente FROM public.parceiros WHERE organization_id=org LIMIT 1;
  SELECT id INTO categoria FROM public.fin_categorias WHERE organization_id=org AND natureza='SAIDA' AND tipo='VARIAVEL' LIMIT 1;
  SELECT id INTO forma FROM public.cad_formas_pagamento WHERE (organization_id=org OR organization_id IS NULL)
    AND ativo AND tipo_movimentacao='AMBOS' AND destino_lancamento<>'CONSIGNACAO' LIMIT 1;
  SELECT id,saldo_atual INTO conta,saldo_inicial FROM public.fin_contas_bancarias WHERE organization_id=org AND ativo LIMIT 1;
  IF cliente IS NULL OR categoria IS NULL OR forma IS NULL OR conta IS NULL THEN
    RAISE EXCEPTION 'O ambiente de teste precisa de parceiro, categoria variável, forma compatível e conta ativa.';
  END IF;

  INSERT INTO public.cmp_pedidos(id,organization_id,status,valor_negociado,descricao_veiculo)
    VALUES(pedido,org,'CONCLUIDO',304000,'TESTE ROLLBACK LOTE');
  INSERT INTO public.est_veiculos(id,organization_id,pedido_id,status,valor_custo,valor_venda,valor_promocional)
    VALUES(origem,org,pedido,'DISPONIVEL',304000,500000,450000);
  INSERT INTO public.fin_titulos(id,organization_id,pedido_id,veiculo_id,descricao,tipo,valor_total,data_vencimento,origem_tipo,origem_id)
    VALUES(compra,org,pedido,origem,'Compra de teste rollback','PAGAR',304000,CURRENT_DATE,'PEDIDO_COMPRA',pedido);

  lote:=public.criar_lote(origem,50,'TESTE ROLLBACK 50 MOTOS');
  IF public.criar_lote(origem,50,'TESTE ROLLBACK 50 MOTOS')<>lote THEN RAISE EXCEPTION 'Conversão duplicada.'; END IF;
  IF (SELECT count(*) FROM public.est_veiculos WHERE lote_id=lote)<>50
    OR (SELECT sum(valor_custo) FROM public.est_veiculos WHERE lote_id=lote)<>304000
    OR EXISTS(SELECT 1 FROM public.est_veiculos WHERE lote_id=lote AND (publicado_site OR valor_venda<>0 OR valor_promocional IS NOT NULL))
    OR (SELECT count(*) FROM public.fin_titulos WHERE lote_id=lote)<>1 THEN
    RAISE EXCEPTION 'Conversão não preservou quantidade, custo, preços ou dívida única.';
  END IF;
  IF (SELECT saldo_atual FROM public.fin_contas_bancarias WHERE id=teste.conta) IS DISTINCT FROM saldo_inicial THEN
    RAISE EXCEPTION 'Conversão movimentou indevidamente o caixa.';
  END IF;

  blocked:=false;
  BEGIN UPDATE public.est_veiculos SET valor_custo=1 WHERE id=origem;
  EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Edição legada de custo deveria ser bloqueada.'; END IF;

  dados:=jsonb_build_object('cliente_id',cliente,'quantidade',20,'valor_total',160000,'data_venda',CURRENT_DATE,
    'pagamentos',jsonb_build_array(jsonb_build_object('valor',160000,'data_recebimento',CURRENT_DATE+30,'forma_pagamento_id',forma,'conta_bancaria_id',conta)));
  venda:=public.registrar_venda_lote(lote,dados,req);
  idempotent:=public.registrar_venda_lote(lote,dados,req);
  IF idempotent<>venda OR (SELECT count(*) FROM public.fin_titulos WHERE venda_pedido_id=venda)<>1
    OR EXISTS(SELECT 1 FROM public.fin_transacoes WHERE titulo_id IN(SELECT id FROM public.fin_titulos WHERE venda_pedido_id=venda)) THEN
    RAISE EXCEPTION 'Retry duplicou a venda ou conta futura gerou recebimento antecipado.';
  END IF;
  SELECT sum(custo_na_venda) INTO snapshot_cost FROM public.venda_lote_itens WHERE venda_id=venda;
  IF snapshot_cost<>121600 THEN RAISE EXCEPTION 'Snapshot inicial incorreto: %.',snapshot_cost; END IF;

  req:=gen_random_uuid();
  dados:=jsonb_build_object('descricao','Frete tardio','valor_total',10000,'data_vencimento',CURRENT_DATE+10,
    'categoria_id',categoria,'fornecedor_id',cliente,'pago_agora',false);
  despesa:=public.registrar_despesa_lote(lote,dados,req);
  IF public.registrar_despesa_lote(lote,dados,req)<>despesa THEN RAISE EXCEPTION 'Despesa duplicada no retry.'; END IF;
  SELECT valor_custo_veiculo INTO current_cost FROM public.venda_pedidos WHERE id=venda;
  SELECT sum(valor_custo+valor_custo_servicos) INTO stock_cost FROM public.est_veiculos WHERE lote_id=lote AND status='DISPONIVEL';
  IF current_cost<>125600 OR stock_cost<>188400 OR (SELECT sum(custo_na_venda) FROM public.venda_lote_itens WHERE venda_id=venda)<>121600 THEN
    RAISE EXCEPTION 'Despesa tardia deve alocar 4000 às 20 vendidas e 6000 às 30 restantes, preservando o snapshot.';
  END IF;
  IF (public.get_caixa_metrics(CURRENT_DATE-1,CURRENT_DATE+60)->>'total_custo_vendas')::numeric<125600 THEN
    RAISE EXCEPTION 'Relatório global omitiu o custo tardio das unidades vendidas.';
  END IF;

  SELECT id INTO unidade FROM public.est_veiculos WHERE lote_id=lote AND status='DISPONIVEL' ORDER BY lote_ordem LIMIT 1;
  PERFORM public.registrar_despesa_lote(lote,jsonb_build_object('descricao','Mecânico específico','valor_total',500,
    'data_vencimento',CURRENT_DATE,'categoria_id',categoria,'veiculo_id',unidade,'pago_agora',false),gen_random_uuid());
  IF (SELECT valor_custo_veiculo FROM public.venda_pedidos WHERE id=venda)<>125600
    OR (SELECT sum(valor_custo+valor_custo_servicos) FROM public.est_veiculos WHERE lote_id=lote AND status='DISPONIVEL')<>188900 THEN
    RAISE EXCEPTION 'Despesa específica não deveria alterar as outras unidades.';
  END IF;
  PERFORM public.registrar_despesa_lote(lote,jsonb_build_object('descricao','Teste de três centavos','valor_total',0.03,
    'data_vencimento',CURRENT_DATE,'categoria_id',categoria,'pago_agora',false),gen_random_uuid());
  IF (SELECT sum(valor_custo_servicos) FROM public.est_veiculos WHERE lote_id=lote)<>10500.03
    OR (SELECT valor_custo_veiculo FROM public.venda_pedidos WHERE id=venda)<>125600.03 THEN
    RAISE EXCEPTION 'Rateio de centavos não fechou exatamente ou não foi atribuído às primeiras unidades.';
  END IF;

  PERFORM public.cancelar_venda_lote(venda);
  PERFORM public.cancelar_venda_lote(venda);
  IF (SELECT count(*) FROM public.est_veiculos WHERE lote_id=lote AND status='DISPONIVEL')<>50
    OR EXISTS(SELECT 1 FROM public.fin_titulos WHERE venda_pedido_id=venda AND status<>'CANCELADO') THEN
    RAISE EXCEPTION 'Cancelamento não devolveu todas as unidades ou não cancelou o título.';
  END IF;
  dados:=jsonb_build_object('cliente_id',cliente,'quantidade',50,'valor_total',400000,'data_venda',CURRENT_DATE,
    'pagamentos',jsonb_build_array(jsonb_build_object('valor',400000,'data_recebimento',CURRENT_DATE,'forma_pagamento_id',forma,'conta_bancaria_id',conta)));
  final_venda:=public.registrar_venda_lote(lote,dados,gen_random_uuid());
  blocked:=false;
  BEGIN PERFORM public.cancelar_venda_lote(final_venda);
  EXCEPTION WHEN raise_exception THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Venda recebida deveria exigir operação específica de estorno/reembolso.'; END IF;

  -- Pagamento parcial com retry deve gerar uma única baixa.
  req:=gen_random_uuid();
  PERFORM public.baixar_titulo_lote(compra,1000,conta,forma,CURRENT_DATE,req);
  PERFORM public.baixar_titulo_lote(compra,1000,conta,forma,CURRENT_DATE,req);
  IF (SELECT valor_pago FROM public.fin_titulos WHERE id=compra)<>1000 THEN RAISE EXCEPTION 'Baixa parcial duplicada.'; END IF;
  blocked:=false;
  BEGIN PERFORM public.encerrar_lote(lote);
  EXCEPTION WHEN raise_exception THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Lote com dívidas abertas não pode encerrar.'; END IF;
  FOR title_row IN SELECT id,valor_pendente FROM public.fin_titulos WHERE lote_id=lote AND status NOT IN('PAGO','CANCELADO') LOOP
    PERFORM public.baixar_titulo_lote(title_row.id,title_row.valor_pendente,conta,forma,CURRENT_DATE,gen_random_uuid());
  END LOOP;
  IF NOT public.encerrar_lote(lote) THEN RAISE EXCEPTION 'Encerramento não confirmou.'; END IF;
  blocked:=false;
  BEGIN PERFORM public.registrar_despesa_lote(lote,dados,gen_random_uuid());
  EXCEPTION WHEN raise_exception THEN blocked:=true; END;
  IF NOT blocked THEN RAISE EXCEPTION 'Lote encerrado não pode receber custos.'; END IF;

  RAISE NOTICE 'PASS: conversão, dívida única, centavos, 20/50, custo tardio/específico, cancelamento, recebimento, baixa idempotente e encerramento.';
END;
$$;
ROLLBACK;
