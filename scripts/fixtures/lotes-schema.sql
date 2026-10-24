-- Offline fixture containing only schema, generated expressions, scoped RLS and
-- pre-lot financial triggers needed by test-lotes-sql.mjs. No production rows,
-- credentials, URLs, account identifiers or customer information are stored here.
-- This deliberately omits unrelated application tables and audit infrastructure.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE public.cad_cores (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  nome text NOT NULL,
  rgb_hex text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  organization_id uuid,
  ativo boolean DEFAULT true
);
CREATE TABLE public.cad_formas_pagamento (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid,
  nome text NOT NULL,
  tipo_movimentacao text NOT NULL,
  destino_lancamento text NOT NULL,
  permite_parcelamento boolean DEFAULT false,
  qtd_max_parcelas integer DEFAULT 1,
  observacoes text,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  organization_id uuid
);
CREATE TABLE public.cad_modelos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  montadora_id uuid NOT NULL,
  nome text NOT NULL,
  foto_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  tipo_veiculo_id uuid,
  organization_id uuid,
  ativo boolean DEFAULT true
);
CREATE TABLE public.cad_montadoras (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  nome text NOT NULL,
  logo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  organization_id uuid,
  ativo boolean DEFAULT true
);
CREATE TABLE public.cad_tipos_veiculos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid() NOT NULL,
  nome text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  ativo boolean DEFAULT true
);
CREATE TABLE public.cad_versoes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  modelo_id uuid NOT NULL,
  nome text NOT NULL,
  motorizacao text,
  transmissao text,
  ano_modelo integer,
  ano_fabricacao integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  combustivel text DEFAULT 'Flex'::text,
  organization_id uuid,
  ativo boolean DEFAULT true
);
CREATE TABLE public.cmp_pedidos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  numero_pedido integer NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  fornecedor_id uuid,
  corretor_id uuid,
  veiculo_id uuid,
  forma_pagamento_id uuid,
  data_compra timestamp with time zone DEFAULT now(),
  previsao_pagamento date,
  valor_negociado numeric DEFAULT 0,
  endereco_igual_cadastro boolean DEFAULT true,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  uf text,
  complemento text,
  descricao_veiculo text,
  placa_temp text,
  ano_fabricacao_temp integer,
  ano_modelo_temp integer,
  status text DEFAULT 'RASCUNHO'::text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  condicao_pagamento_id uuid,
  organization_id uuid
);
CREATE TABLE public.config_socios (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  nome text NOT NULL,
  cpf text,
  telefone text,
  participacao numeric DEFAULT 0,
  ativo boolean DEFAULT true,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  uf text,
  complemento text,
  patrimonio jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  organization_id uuid
);
CREATE TABLE public.est_veiculos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  montadora_id uuid,
  tipo_veiculo_id uuid,
  modelo_id uuid,
  versao_id uuid,
  cor_id uuid,
  placa text,
  chassi text,
  renavam text,
  km integer DEFAULT 0,
  ano_fabricacao integer,
  ano_modelo integer,
  portas integer DEFAULT 4,
  combustivel text,
  transmissao text,
  motorizacao text,
  valor_custo numeric DEFAULT 0,
  valor_venda numeric DEFAULT 0,
  valor_promocional numeric,
  status text DEFAULT 'PREPARACAO'::text,
  fotos jsonb DEFAULT '[]'::jsonb,
  socios jsonb DEFAULT '[]'::jsonb,
  caracteristicas_ids jsonb DEFAULT '[]'::jsonb,
  opcionais_ids jsonb DEFAULT '[]'::jsonb,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pedido_id uuid,
  publicado_site boolean DEFAULT false,
  valor_custo_servicos numeric DEFAULT 0,
  organization_id uuid,
  is_consignado boolean DEFAULT false,
  valor_total_investido numeric GENERATED ALWAYS AS (
CASE
    WHEN (is_consignado = true) THEN COALESCE(valor_custo_servicos, (0)::numeric)
    ELSE (COALESCE(valor_custo, (0)::numeric) + COALESCE(valor_custo_servicos, (0)::numeric))
END) STORED,
  valor_lucro_estimado numeric GENERATED ALWAYS AS ((COALESCE(valor_venda, (0)::numeric) -
CASE
    WHEN (is_consignado = true) THEN COALESCE(valor_custo_servicos, (0)::numeric)
    ELSE (COALESCE(valor_custo, (0)::numeric) + COALESCE(valor_custo_servicos, (0)::numeric))
END)) STORED,
  valor_margem_estimada numeric GENERATED ALWAYS AS (
CASE
    WHEN (
    CASE
        WHEN (is_consignado = true) THEN COALESCE(valor_custo_servicos, (0)::numeric)
        ELSE (COALESCE(valor_custo, (0)::numeric) + COALESCE(valor_custo_servicos, (0)::numeric))
    END > (0)::numeric) THEN (((COALESCE(valor_venda, (0)::numeric) -
    CASE
        WHEN (is_consignado = true) THEN COALESCE(valor_custo_servicos, (0)::numeric)
        ELSE (COALESCE(valor_custo, (0)::numeric) + COALESCE(valor_custo_servicos, (0)::numeric))
    END) /
    CASE
        WHEN (is_consignado = true) THEN COALESCE(valor_custo_servicos, (0)::numeric)
        ELSE (COALESCE(valor_custo, (0)::numeric) + COALESCE(valor_custo_servicos, (0)::numeric))
    END) * (100)::numeric)
    ELSE (0)::numeric
END) STORED
);
CREATE TABLE public.est_veiculos_despesas (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  veiculo_id uuid,
  data timestamp with time zone DEFAULT now(),
  data_vencimento timestamp with time zone,
  status_pagamento text DEFAULT 'PENDENTE'::text,
  tipo text DEFAULT 'VARIAVEL'::text,
  categoria_id uuid,
  descricao text NOT NULL,
  quantidade integer DEFAULT 1,
  valor_unitario numeric DEFAULT 0,
  valor_total numeric DEFAULT 0,
  forma_pagamento_id uuid,
  conta_bancaria_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid DEFAULT auth.uid(),
  organization_id uuid,
  updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.fin_categorias (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  natureza text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid
);
CREATE TABLE public.fin_contas_bancarias (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  banco_nome text NOT NULL,
  banco_codigo text,
  titular text NOT NULL,
  agencia text,
  conta text,
  tipo text DEFAULT 'CORRENTE'::text,
  cor_cartao text DEFAULT '#1e293b'::text,
  saldo_inicial numeric DEFAULT 0.00,
  data_saldo_inicial timestamp with time zone DEFAULT now(),
  saldo_atual numeric DEFAULT 0.00,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  organization_id uuid,
  permite_negativo boolean DEFAULT true
);
CREATE TABLE public.fin_titulos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  parceiro_id uuid,
  categoria_id uuid,
  pedido_id uuid,
  descricao text NOT NULL,
  tipo text NOT NULL,
  status text DEFAULT 'PENDENTE'::text NOT NULL,
  valor_total numeric DEFAULT 0 NOT NULL,
  valor_pago numeric DEFAULT 0,
  data_emissao date DEFAULT CURRENT_DATE,
  data_vencimento date NOT NULL,
  parcela_numero integer DEFAULT 1,
  parcela_total integer DEFAULT 1,
  documento_ref text,
  forma_pagamento_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  origem_tipo text,
  origem_id uuid,
  despesa_veiculo_id uuid,
  organization_id uuid,
  veiculo_id uuid,
  valor_desconto numeric DEFAULT 0,
  valor_acrescimo numeric DEFAULT 0,
  venda_pedido_id uuid,
  socios jsonb,
  valor_liquidado numeric GENERATED ALWAYS AS ((COALESCE(valor_pago, (0)::numeric) + COALESCE(valor_desconto, (0)::numeric))) STORED,
  valor_pendente numeric GENERATED ALWAYS AS (((valor_total + COALESCE(valor_acrescimo, (0)::numeric)) - (COALESCE(valor_pago, (0)::numeric) + COALESCE(valor_desconto, (0)::numeric)))) STORED
);
CREATE TABLE public.fin_transacoes (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  titulo_id uuid,
  conta_origem_id uuid,
  transferencia_id uuid,
  valor numeric NOT NULL,
  data_pagamento timestamp with time zone DEFAULT now(),
  tipo text NOT NULL,
  tipo_transacao text,
  forma_pagamento_id uuid,
  descricao text,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  retirada_id uuid
);
CREATE TABLE public.organization_members (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.parceiros (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  pessoa_tipo text,
  nome text NOT NULL,
  razao_social text,
  documento text,
  inscricao_estadual text,
  email text,
  telefone text,
  whatsapp text,
  tipo text,
  ativo boolean DEFAULT true,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  uf character varying,
  complemento text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  organization_id uuid,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
CREATE TABLE public.venda_pedidos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  numero_venda text,
  data_venda date DEFAULT now(),
  cliente_id uuid,
  veiculo_id uuid,
  valor_venda numeric DEFAULT 0,
  status text DEFAULT 'RASCUNHO'::text,
  forma_pagamento_id uuid,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  corretor_id uuid,
  endereco_igual_cadastro boolean DEFAULT true,
  cep text,
  logradouro text,
  numero text,
  bairro text,
  cidade text,
  uf text,
  complemento text,
  organization_id uuid,
  is_consignado boolean DEFAULT false,
  valor_custo_veiculo numeric DEFAULT 0,
  valor_lucro numeric DEFAULT 0
);
CREATE TABLE public.venda_pedidos_pagamentos (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  pedido_id uuid,
  data_recebimento date NOT NULL,
  forma_pagamento_id uuid,
  condicao_id uuid,
  conta_bancaria_id uuid,
  valor numeric NOT NULL,
  observacao text,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid
);
CREATE TABLE public.fin_retiradas (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid DEFAULT auth.uid(),
  data date DEFAULT CURRENT_DATE,
  socio_id uuid,
  conta_origem_id uuid,
  valor numeric NOT NULL,
  descricao text,
  tipo text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid
);
ALTER TABLE fin_titulos ADD CONSTRAINT fin_titulos_origem_tipo_check CHECK(origem_tipo IN ('PEDIDO_COMPRA','PEDIDO_VENDA','DESPESA_VEICULO','DESPESA_FIXA','DESPESA_VARIAVEL','OUTRO_CREDITO','OUTRO_DEBITO','MANUAL'));
CREATE OR REPLACE FUNCTION public.baixar_titulo(p_titulo_id uuid, p_valor numeric, p_conta_id uuid, p_forma_pagamento_id uuid, p_data_pagamento timestamp with time zone DEFAULT now(), p_desconto numeric DEFAULT 0, p_acrescimo numeric DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_titulo RECORD;
BEGIN
    -- 1. Obter dados do título e bloquear para atualização
    SELECT * INTO v_titulo FROM public.fin_titulos WHERE id = p_titulo_id FOR UPDATE;
    IF NOT FOUND THEN
        PERFORM public.raise_error('Título não encontrado', 'O título financeiro especificado não existe.');
    END IF;

    -- 2. Registrar a transação principal (Pagamento)
    IF p_valor > 0 THEN
        INSERT INTO public.fin_transacoes (
            user_id, organization_id, titulo_id, conta_origem_id, valor, tipo, 
            data_pagamento, forma_pagamento_id, descricao, tipo_transacao
        ) VALUES (
            auth.uid(), v_titulo.organization_id, p_titulo_id, p_conta_id, p_valor,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'ENTRADA' ELSE 'SAIDA' END,
            p_data_pagamento, p_forma_pagamento_id,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'BAIXA: ' ELSE 'PAGAMENTO: ' END || v_titulo.descricao,
            'RECEBIMENTO_TITULO'
        );
    END IF;

    -- 3. Registrar Desconto (se houver)
    IF p_desconto > 0 THEN
        INSERT INTO public.fin_transacoes (
            user_id, organization_id, titulo_id, valor, tipo, 
            data_pagamento, descricao, tipo_transacao
        ) VALUES (
            auth.uid(), v_titulo.organization_id, p_titulo_id, p_desconto,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'ENTRADA' ELSE 'SAIDA' END,
            p_data_pagamento,
            'DESCONTO: ' || v_titulo.descricao,
            'DESCONTO_TITULO'
        );
    END IF;

    -- 4. Registrar Acréscimo/Juros (se houver)
    IF p_acrescimo > 0 THEN
        INSERT INTO public.fin_transacoes (
            user_id, organization_id, titulo_id, valor, tipo, 
            data_pagamento, descricao, tipo_transacao
        ) VALUES (
            auth.uid(), v_titulo.organization_id, p_titulo_id, p_acrescimo,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'SAIDA' ELSE 'ENTRADA' END,
            p_data_pagamento,
            'ACRÉSCIMO/JUROS: ' || v_titulo.descricao,
            'ACRESCIMO_TITULO'
        );
    END IF;

    -- A trigger public.fn_sync_titulo_totals atualizará o saldo e o status do título automaticamente.
END;
$function$
;
CREATE OR REPLACE FUNCTION public.is_member_of(p_org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_org_id AND user_id = auth.uid()
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.fn_estoque_lifecycle()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Rule 1: Force unpublish if status is VENDIDO
    IF NEW.status = 'VENDIDO' THEN
        NEW.publicado_site := false;
    END IF;

    -- Rule 2: Prevent publishing if already VENDIDO
    IF NEW.publicado_site = true AND NEW.status = 'VENDIDO' THEN
        RAISE EXCEPTION 'Não é possível publicar um veículo com status VENDIDO.';
    END IF;

    RETURN NEW;
END;
$function$
;
CREATE TRIGGER tr_estoque_lifecycle BEFORE INSERT OR UPDATE OF status, publicado_site ON public.est_veiculos FOR EACH ROW EXECUTE FUNCTION fn_estoque_lifecycle();
CREATE OR REPLACE FUNCTION public.fn_auto_populate_vehicle_version_data()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_versao RECORD;
BEGIN
  -- Only run if versao_id is set and any target field is empty
  IF NEW.versao_id IS NOT NULL AND (
    NEW.motorizacao IS NULL OR NEW.motorizacao = '' OR
    NEW.combustivel IS NULL OR NEW.combustivel = '' OR
    NEW.transmissao IS NULL OR NEW.transmissao = ''
  ) THEN
    SELECT motorizacao, combustivel, transmissao, ano_fabricacao, ano_modelo
    INTO v_versao
    FROM cad_versoes
    WHERE id = NEW.versao_id;

    IF FOUND THEN
      IF NEW.motorizacao IS NULL OR NEW.motorizacao = '' THEN
        NEW.motorizacao := v_versao.motorizacao;
      END IF;
      IF NEW.combustivel IS NULL OR NEW.combustivel = '' THEN
        NEW.combustivel := v_versao.combustivel;
      END IF;
      IF NEW.transmissao IS NULL OR NEW.transmissao = '' THEN
        NEW.transmissao := v_versao.transmissao;
      END IF;
      -- Also fix year fields if they seem wrong (same as each other when version has different)
      IF NEW.ano_fabricacao = NEW.ano_modelo AND v_versao.ano_fabricacao != v_versao.ano_modelo THEN
        NEW.ano_fabricacao := v_versao.ano_fabricacao;
        NEW.ano_modelo := v_versao.ano_modelo;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE TRIGGER trg_auto_populate_vehicle_version_data BEFORE INSERT OR UPDATE ON public.est_veiculos FOR EACH ROW EXECUTE FUNCTION fn_auto_populate_vehicle_version_data();
CREATE OR REPLACE FUNCTION public.fn_sync_bank_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_delta NUMERIC := 0;
    v_conta_id UUID;
BEGIN
    -- Identificar a conta e o delta baseado na operação
    IF (TG_OP = 'DELETE') THEN
        v_conta_id := OLD.conta_origem_id;
        v_delta := CASE WHEN OLD.tipo = 'ENTRADA' THEN -OLD.valor ELSE OLD.valor END;
    ELSIF (TG_OP = 'INSERT') THEN
        v_conta_id := NEW.conta_origem_id;
        v_delta := CASE WHEN NEW.tipo = 'ENTRADA' THEN NEW.valor ELSE -NEW.valor END;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Se mudou a conta, precisamos reverter na antiga e aplicar na nova
        IF OLD.conta_origem_id != NEW.conta_origem_id THEN
            -- Reverter na antiga
            UPDATE public.fin_contas_bancarias 
            SET saldo_atual = saldo_atual + (CASE WHEN OLD.tipo = 'ENTRADA' THEN -OLD.valor ELSE OLD.valor END)
            WHERE id = OLD.conta_origem_id;
            
            -- Aplicar na nova
            v_conta_id := NEW.conta_origem_id;
            v_delta := CASE WHEN NEW.tipo = 'ENTRADA' THEN NEW.valor ELSE -NEW.valor END;
        ELSE
            -- Mesma conta, calcula a diferença
            v_conta_id := NEW.conta_origem_id;
            v_delta := (CASE WHEN NEW.tipo = 'ENTRADA' THEN NEW.valor ELSE -NEW.valor END) - 
                       (CASE WHEN OLD.tipo = 'ENTRADA' THEN OLD.valor ELSE -OLD.valor END);
        END IF;
    END IF;

    -- Atualizar o saldo da conta (se houver conta vinculada)
    IF v_conta_id IS NOT NULL AND v_delta != 0 THEN
        UPDATE public.fin_contas_bancarias 
        SET saldo_atual = saldo_atual + v_delta, 
            updated_at = now()
        WHERE id = v_conta_id;
    END IF;

    RETURN NULL; -- Trigger AFTER
END;
$function$
;
CREATE TRIGGER tr_sync_bank_balance AFTER INSERT OR DELETE OR UPDATE ON public.fin_transacoes FOR EACH ROW EXECUTE FUNCTION fn_sync_bank_balance();
CREATE OR REPLACE FUNCTION public.fn_sync_titulo_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_titulo_ids UUID[] := '{}';
    v_tid UUID;
    v_pago NUMERIC;
    v_desconto NUMERIC;
    v_acrescimo NUMERIC;
    v_titulo RECORD;
    v_liquidado NUMERIC;
    v_devido NUMERIC;
    v_status TEXT; 
BEGIN
    -- Coleta os IDs dos títulos que precisam de sincronização
    IF (TG_OP = 'DELETE') THEN
        v_titulo_ids := ARRAY[OLD.titulo_id];
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.titulo_id IS DISTINCT FROM NEW.titulo_id) THEN
            v_titulo_ids := ARRAY[OLD.titulo_id, NEW.titulo_id];
        ELSE
            v_titulo_ids := ARRAY[NEW.titulo_id];
        END IF;
    ELSE
        v_titulo_ids := ARRAY[NEW.titulo_id];
    END IF;

    -- Processa cada título afetado
    FOREACH v_tid IN ARRAY v_titulo_ids
    LOOP
        CONTINUE WHEN v_tid IS NULL;

        -- 1. Buscar dados do título
        SELECT * INTO v_titulo
        FROM public.fin_titulos
        WHERE id = v_tid;

        IF FOUND THEN
            -- 2. Calcular Somatórios das Transações
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN tipo_transacao NOT IN ('DESCONTO_TITULO', 'ACRESCIMO_TITULO', 'EMPRESTIMO_CONCEDIDO') THEN
                            CASE 
                                WHEN v_titulo.tipo = 'RECEBER' THEN (CASE WHEN tipo = 'ENTRADA' THEN valor ELSE -valor END)
                                WHEN v_titulo.tipo = 'PAGAR' THEN (CASE WHEN tipo = 'SAIDA' THEN valor ELSE -valor END)
                                ELSE 0
                            END
                        ELSE 0
                    END
                ), 0),
                COALESCE(SUM(CASE WHEN tipo_transacao = 'DESCONTO_TITULO' THEN valor ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN tipo_transacao = 'ACRESCIMO_TITULO' THEN valor ELSE 0 END), 0)
            INTO v_pago, v_desconto, v_acrescimo
            FROM public.fin_transacoes
            WHERE titulo_id = v_tid;

            -- 3. Calcular Status
            v_liquidado := v_pago + v_desconto;
            v_devido := v_titulo.valor_total + COALESCE(v_acrescimo, 0);

            IF v_liquidado >= v_devido - 0.01 THEN
                v_status := 'PAGO';
            ELSIF v_liquidado > 0 THEN
                v_status := 'PARCIAL';
            ELSE
                v_status := 'PENDENTE';
            END IF;

            -- 4. Atualizar o Título Corretamente
            UPDATE public.fin_titulos
            SET 
                valor_pago = v_pago,
                valor_desconto = v_desconto,
                valor_acrescimo = v_acrescimo,
                status = v_status,
                updated_at = now()
            WHERE id = v_tid;
        END IF;
    END LOOP;

    RETURN NULL;
END;
$function$
;
CREATE TRIGGER tr_sync_titulo_totals AFTER INSERT OR DELETE OR UPDATE ON public.fin_transacoes FOR EACH ROW EXECUTE FUNCTION fn_sync_titulo_totals();
CREATE OR REPLACE FUNCTION public.fn_sync_venda_pedidos_finance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_custo DECIMAL(15,2);
    v_custo_servicos DECIMAL(15,2);
BEGIN
    -- Busca custos atuais do veículo
    SELECT valor_custo, valor_custo_servicos 
    INTO v_custo, v_custo_servicos
    FROM est_veiculos
    WHERE id = NEW.veiculo_id;

    -- Define o custo total do veículo pro pedido
    NEW.valor_custo_veiculo := COALESCE(v_custo, 0) + COALESCE(v_custo_servicos, 0);
    
    -- Calcula o lucro baseado no valor de venda do pedido
    NEW.valor_lucro := COALESCE(NEW.valor_venda, 0) - NEW.valor_custo_veiculo;

    RETURN NEW;
END;
$function$
;
CREATE TRIGGER trg_sync_venda_pedidos_finance BEFORE INSERT OR UPDATE OF veiculo_id, valor_venda ON public.venda_pedidos FOR EACH ROW EXECUTE FUNCTION fn_sync_venda_pedidos_finance();GRANT USAGE ON SCHEMA public,auth TO authenticated; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER TABLE est_veiculos ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON est_veiculos FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE cmp_pedidos ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON cmp_pedidos FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE venda_pedidos ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON venda_pedidos FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE fin_titulos ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON fin_titulos FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE fin_transacoes ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON fin_transacoes FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE venda_pedidos_pagamentos ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON venda_pedidos_pagamentos FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON parceiros FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE fin_categorias ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON fin_categorias FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE cad_formas_pagamento ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON cad_formas_pagamento FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
ALTER TABLE fin_contas_bancarias ENABLE ROW LEVEL SECURITY; CREATE POLICY fixture_org ON fin_contas_bancarias FOR ALL TO authenticated USING (public.is_member_of(organization_id)) WITH CHECK (public.is_member_of(organization_id));
