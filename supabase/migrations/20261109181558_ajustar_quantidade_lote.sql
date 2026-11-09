-- Ajuste recuperável de unidades internas, sem alterar compra, títulos ou baixas.
CREATE TABLE drivecar_private.lote_quantidade_ajustes (
  request_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  lote_id uuid NOT NULL REFERENCES public.est_lotes(id),
  user_id uuid NOT NULL,
  payload jsonb NOT NULL,
  lote_antes jsonb NOT NULL,
  unidades_antes jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lote_quantidade_ajustes_lote_idx ON drivecar_private.lote_quantidade_ajustes(lote_id);
CREATE INDEX lote_quantidade_ajustes_org_idx ON drivecar_private.lote_quantidade_ajustes(organization_id);
CREATE TABLE drivecar_private.lote_unidades_arquivadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  lote_id uuid NOT NULL REFERENCES public.est_lotes(id),
  request_id uuid NOT NULL REFERENCES drivecar_private.lote_quantidade_ajustes(request_id),
  veiculo_id uuid NOT NULL,
  lote_ordem integer NOT NULL,
  snapshot jsonb NOT NULL,
  restored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX lote_unidades_arquivadas_ativas_idx ON drivecar_private.lote_unidades_arquivadas(lote_id,lote_ordem) WHERE restored_at IS NULL;
CREATE INDEX lote_unidades_arquivadas_org_idx ON drivecar_private.lote_unidades_arquivadas(organization_id);
ALTER TABLE drivecar_private.lote_quantidade_ajustes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivecar_private.lote_unidades_arquivadas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON drivecar_private.lote_quantidade_ajustes,drivecar_private.lote_unidades_arquivadas FROM PUBLIC,anon,authenticated;

CREATE FUNCTION drivecar_private.ajustar_quantidade_lote_impl(
  p_lote_id uuid,p_quantidade integer,p_descricao text,p_quantidade_atual integer,p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE l public.est_lotes%ROWTYPE; v public.est_veiculos%ROWTYPE;
  old_request drivecar_private.lote_quantidade_ajustes%ROWTYPE;
  archived drivecar_private.lote_unidades_arquivadas%ROWTYPE;
  payload jsonb; removed uuid[]; refs record; has_ref boolean;
  i integer; writable_columns text; amount numeric;
BEGIN
  SELECT * INTO l FROM public.est_lotes WHERE id=p_lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  IF p_request_id IS NULL OR p_quantidade IS NULL OR p_quantidade NOT BETWEEN 2 AND 10000
    OR p_quantidade_atual IS NULL OR length(btrim(coalesce(p_descricao,''))) NOT BETWEEN 1 AND 300 THEN
    RAISE EXCEPTION 'Informe descrição e quantidade inteira entre 2 e 10000.';
  END IF;
  payload:=jsonb_build_object('quantidade',p_quantidade,'descricao',btrim(p_descricao),'quantidade_atual',p_quantidade_atual);
  SELECT * INTO old_request FROM drivecar_private.lote_quantidade_ajustes WHERE request_id=p_request_id;
  IF FOUND THEN
    IF old_request.lote_id IS DISTINCT FROM l.id OR old_request.payload IS DISTINCT FROM payload THEN
      RAISE EXCEPTION 'Identificador de operação já utilizado com outros dados.';
    END IF;
    RETURN;
  END IF;
  IF l.encerrado THEN RAISE EXCEPTION 'O lote está encerrado.'; END IF;
  IF l.quantidade_inicial IS DISTINCT FROM p_quantidade_atual THEN
    RAISE EXCEPTION 'A quantidade foi alterada por outra operação. Atualize a página e confira o lote.';
  END IF;
  -- O mesmo lock de lote serializa vendas, despesas, identificação e ajuste.
  PERFORM 1 FROM public.est_veiculos WHERE lote_id=l.id ORDER BY lote_ordem FOR UPDATE;
  IF (SELECT count(*) FROM public.est_veiculos WHERE lote_id=l.id)<>l.quantidade_inicial
    OR EXISTS(SELECT 1 FROM public.est_veiculos WHERE lote_id=l.id AND
      (organization_id IS DISTINCT FROM l.organization_id OR pedido_id IS DISTINCT FROM l.pedido_id
       OR lote_ordem NOT BETWEEN 1 AND l.quantidade_inicial)) THEN
    RAISE EXCEPTION 'As unidades do lote estão inconsistentes; revise antes de ajustar a quantidade.';
  END IF;
  IF EXISTS(SELECT 1 FROM public.venda_pedidos WHERE lote_id=l.id)
    OR EXISTS(SELECT 1 FROM public.venda_lote_itens WHERE lote_id=l.id)
    OR EXISTS(SELECT 1 FROM public.est_veiculos WHERE lote_id=l.id AND status NOT IN ('DISPONIVEL','PREPARACAO')) THEN
    RAISE EXCEPTION 'A quantidade só pode ser ajustada antes de vendas ou reservas. O histórico existente será preservado.';
  END IF;
  SELECT array_agg(id) INTO removed FROM public.est_veiculos WHERE lote_id=l.id AND lote_ordem>p_quantidade;
  IF EXISTS(SELECT 1 FROM public.est_veiculos WHERE id=ANY(removed) AND (
      status IS DISTINCT FROM 'DISPONIVEL' OR nullif(btrim(placa),'') IS NOT NULL
      OR nullif(btrim(chassi),'') IS NOT NULL OR nullif(btrim(renavam),'') IS NOT NULL
      OR coalesce(publicado_site,false) OR coalesce(is_consignado,false)
      OR coalesce(valor_venda,0)<>0 OR valor_promocional IS NOT NULL
      OR coalesce(fotos,'[]'::jsonb)<>'[]'::jsonb
      OR (nullif(btrim(observacoes),'') IS NOT NULL AND observacoes NOT LIKE 'Unidade interna do lote: %')))
    OR EXISTS(SELECT 1 FROM public.est_lote_despesas WHERE veiculo_id=ANY(removed))
    OR EXISTS(SELECT 1 FROM public.est_veiculos_despesas WHERE veiculo_id=ANY(removed))
    OR EXISTS(SELECT 1 FROM public.fin_titulos WHERE veiculo_id=ANY(removed))
    OR EXISTS(SELECT 1 FROM public.venda_pedidos WHERE veiculo_id=ANY(removed))
    OR EXISTS(SELECT 1 FROM public.cmp_pedidos WHERE veiculo_id=ANY(removed)) THEN
    RAISE EXCEPTION 'As unidades excedentes possuem identificação, dados próprios ou vínculos. Nenhum registro foi removido.';
  END IF;
  -- Impede até cascatas/set-null em referências adicionadas por outros módulos.
  -- O lock FOR UPDATE das unidades impede inserções concorrentes por FK.
  FOR refs IN
    SELECT c.conrelid::regclass relation,a.attname column_name
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_attribute target ON target.attrelid=c.confrelid AND target.attname='id'
    JOIN pg_catalog.pg_attribute a ON a.attrelid=c.conrelid
      AND a.attnum=c.conkey[array_position(c.confkey,target.attnum)]
    WHERE c.contype='f' AND c.confrelid='public.est_veiculos'::regclass
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s WHERE %I=ANY($1))',refs.relation,refs.column_name)
      INTO has_ref USING removed;
    IF has_ref THEN RAISE EXCEPTION 'Uma unidade excedente possui vínculos em outro cadastro; ajuste bloqueado.'; END IF;
  END LOOP;
  INSERT INTO drivecar_private.lote_quantidade_ajustes(request_id,organization_id,lote_id,user_id,payload,lote_antes,unidades_antes)
    VALUES(p_request_id,l.organization_id,l.id,auth.uid(),payload,to_jsonb(l),
      (SELECT jsonb_agg(to_jsonb(u) ORDER BY lote_ordem) FROM public.est_veiculos u WHERE lote_id=l.id));
  PERFORM drivecar_private.lote_open(l.id);
  INSERT INTO drivecar_private.lote_unidades_arquivadas(organization_id,lote_id,request_id,veiculo_id,lote_ordem,snapshot)
    SELECT l.organization_id,l.id,p_request_id,id,lote_ordem,to_jsonb(u) FROM public.est_veiculos u WHERE id=ANY(removed);
  DELETE FROM public.est_veiculos WHERE id=ANY(removed);

  IF p_quantidade>l.quantidade_inicial THEN
    SELECT * INTO STRICT v FROM public.est_veiculos WHERE lote_id=l.id ORDER BY lote_ordem LIMIT 1;
    SELECT string_agg(quote_ident(attname),',' ORDER BY attnum) INTO writable_columns
      FROM pg_catalog.pg_attribute WHERE attrelid='public.est_veiculos'::regclass
        AND attnum>0 AND NOT attisdropped AND attgenerated='';
    FOR i IN l.quantidade_inicial+1..p_quantidade LOOP
      SELECT * INTO archived FROM drivecar_private.lote_unidades_arquivadas
        WHERE lote_id=l.id AND lote_ordem=i AND restored_at IS NULL FOR UPDATE;
      IF FOUND THEN
        -- A observação gerada acompanha o novo nome mesmo em restauração parcial.
        -- Textos próprios nunca são reescritos.
        IF archived.snapshot->>'observacoes' = 'Unidade interna do lote: '||(
          SELECT lote_antes->>'descricao' FROM drivecar_private.lote_quantidade_ajustes WHERE request_id=archived.request_id) THEN
          archived.snapshot:=jsonb_set(archived.snapshot,'{observacoes}',to_jsonb('Unidade interna do lote: '||btrim(p_descricao)));
        END IF;
        EXECUTE format('INSERT INTO public.est_veiculos(%s) SELECT %s FROM jsonb_populate_record(NULL::public.est_veiculos,$1)',writable_columns,writable_columns)
          USING archived.snapshot;
        UPDATE drivecar_private.lote_unidades_arquivadas SET restored_at=now() WHERE id=archived.id;
      ELSE
        INSERT INTO public.est_veiculos(user_id,organization_id,pedido_id,lote_id,lote_ordem,
          montadora_id,tipo_veiculo_id,modelo_id,versao_id,cor_id,km,ano_fabricacao,ano_modelo,
          combustivel,transmissao,motorizacao,portas,valor_custo,valor_venda,status,socios,
          caracteristicas_ids,opcionais_ids,observacoes,publicado_site,is_consignado,created_at)
        VALUES(auth.uid(),l.organization_id,l.pedido_id,l.id,i,v.montadora_id,v.tipo_veiculo_id,v.modelo_id,
          v.versao_id,v.cor_id,v.km,v.ano_fabricacao,v.ano_modelo,v.combustivel,v.transmissao,
          v.motorizacao,v.portas,0,0,'DISPONIVEL','[]',v.caracteristicas_ids,v.opcionais_ids,
          'Unidade interna do lote: '||btrim(p_descricao),false,false,v.created_at);
      END IF;
    END LOOP;
  END IF;
  UPDATE public.est_lotes SET quantidade_inicial=p_quantidade,descricao=btrim(p_descricao) WHERE id=l.id;
  UPDATE public.est_veiculos SET valor_custo=(floor(l.custo_aquisicao*100/p_quantidade)
    +CASE WHEN lote_ordem<=mod(l.custo_aquisicao*100,p_quantidade) THEN 1 ELSE 0 END)/100,
    observacoes=CASE WHEN observacoes='Unidade interna do lote: '||l.descricao
      THEN 'Unidade interna do lote: '||btrim(p_descricao) ELSE observacoes END,updated_at=now()
    WHERE lote_id=l.id;
  PERFORM drivecar_private.recalcular_lote(l.id);
  IF (SELECT count(*) FROM public.est_veiculos WHERE lote_id=l.id)<>p_quantidade
    OR (SELECT sum(valor_custo) FROM public.est_veiculos WHERE lote_id=l.id) IS DISTINCT FROM l.custo_aquisicao
    OR (SELECT sum(valor_custo_servicos) FROM public.est_veiculos WHERE lote_id=l.id)
      IS DISTINCT FROM (SELECT coalesce(sum(valor_total),0) FROM public.est_lote_despesas WHERE lote_id=l.id) THEN
    RAISE EXCEPTION 'Falha na conferência do rateio; ajuste revertido.';
  END IF;
  PERFORM drivecar_private.lote_close(l.id);
END;
$$;
CREATE FUNCTION public.ajustar_quantidade_lote(p_lote_id uuid,p_quantidade integer,p_descricao text,p_quantidade_atual integer,p_request_id uuid)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT drivecar_private.ajustar_quantidade_lote_impl(p_lote_id,p_quantidade,p_descricao,p_quantidade_atual,p_request_id);
$$;
REVOKE ALL ON FUNCTION drivecar_private.ajustar_quantidade_lote_impl(uuid,integer,text,integer,uuid),
  public.ajustar_quantidade_lote(uuid,integer,text,integer,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION drivecar_private.ajustar_quantidade_lote_impl(uuid,integer,text,integer,uuid),
  public.ajustar_quantidade_lote(uuid,integer,text,integer,uuid) TO authenticated;
