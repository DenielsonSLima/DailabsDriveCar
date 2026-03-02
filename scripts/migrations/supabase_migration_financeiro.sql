-- ============================================================
-- LIMPEZA (Se for re-criar tudo, cuidado com os dados reais)
-- ============================================================

drop view if exists financeiro_extrato cascade;
drop view if exists contas_bancarias_saldos cascade;

-- As tabelas antigas (Atenção: Drop em Produção apaga dados)
drop table if exists fin_transacoes cascade;
drop table if exists fin_ajustes cascade;
drop table if exists fin_titulos cascade;

-- Mantém fin_categorias e fin_contas_bancarias e parceiros intactos

drop type if exists fin_titulo_tipo cascade;
drop type if exists fin_titulo_status cascade;
drop type if exists fin_transacao_tipo cascade;
drop type if exists fin_origem_sistema cascade;


-- ============================================================
-- ENUMS (Regras de negócio garantidas pelo BD)
-- ============================================================

create type fin_titulo_tipo as enum (
  'PAGAR',
  'RECEBER'
);

create type fin_titulo_status as enum (
  'PENDENTE',
  'PARCIAL',
  'PAGO',
  'ATRASADO',
  'CANCELADO'
);

create type fin_transacao_tipo as enum (
  'CREDITO',   -- Entrada na conta (Pagou um receber, Recebeu Transf, Aporte)
  'DEBITO'     -- Saída da conta (Pagou um pagar, Enviou Transf, Retirada)
);

-- Integração com módulos do Nexus ERP
create type fin_origem_sistema as enum (
  'PEDIDO_COMPRA',
  'PEDIDO_VENDA',
  'DESPESA_VEICULO',
  'DESPESA_FIXA',
  'DESPESA_VARIAVEL',
  'OUTRO_CREDITO',
  'TRANSFERENCIA',
  'RETIRADA_SOCIO',
  'APORTE_SOCIO',
  'MANUAL'
);


-- ============================================================
-- LANÇAMENTOS (Previsões e Obrigações)
-- ============================================================

create table fin_titulos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid, -- ou null se o Nexus for tenant unico por enquant
  
  -- Vínculos Nexus ERP
  parceiro_id uuid references parceiros(id) on delete set null,
  categoria_id uuid references fin_categorias(id) on delete set null,
  forma_pagamento_id uuid references formas_pagamento(id) on delete set null,
  conta_prevista_id uuid references fin_contas_bancarias(id) on delete set null,
  
  -- Rastros Automotivos
  veiculo_id uuid,
  
  tipo fin_titulo_tipo not null,
  
  -- Origem
  origem_tipo fin_origem_sistema,
  origem_id uuid,
  
  descricao text not null,
  
  -- Valores
  valor_total numeric(14,2) not null check (valor_total >= 0),
  valor_pago numeric(14,2) default 0 check (valor_pago >= 0),
  
  -- Datas
  data_emissao date default current_date,
  data_vencimento date not null,
  
  -- Parcelas
  parcela_numero integer default 1,
  parcela_total integer default 1,
  grupo_id uuid, -- Para agrupar as parcelas 1/5, 2/5, etc.
  
  status fin_titulo_status default 'PENDENTE',
  created_at timestamp default now(),
  updated_at timestamp default now()
);


-- ============================================================
-- AJUSTES (Descontos, Acréscimos, Juros)
-- ============================================================

create table fin_ajustes (
  id uuid primary key default gen_random_uuid(),
  titulo_id uuid references fin_titulos(id) on delete cascade,
  tipo text not null, -- 'desconto', 'juros', 'acrescimo'
  valor numeric(14,2) not null check (valor > 0),
  motivo text,
  created_at timestamp default now()
);


-- ============================================================
-- TRANSAÇÕES REAIS (O Extrato Bancário)
-- ============================================================

create table fin_transacoes (
  id uuid primary key default gen_random_uuid(),
  titulo_id uuid references fin_titulos(id) on delete set null, -- Títulos sendo pagos
  conta_id uuid references fin_contas_bancarias(id) on delete restrict,
  forma_pagamento_id uuid references formas_pagamento(id) on delete set null,
  
  origem_tipo fin_origem_sistema, -- Para transacoes diretas sem titulo (Transferencias)
  origem_id uuid,
  
  tipo_movimento fin_transacao_tipo not null,
  valor numeric(14,2) not null check (valor > 0),
  descricao text,
  
  data_pagamento timestamp default now(),
  created_at timestamp default now()
);


-- ============================================================
-- VIEW: SALDO DAS CONTAS EM TEMPO REAL
-- ============================================================

create or replace view contas_bancarias_saldos as
select
  c.id as conta_id,
  c.nome,
  c.banco,
  c.agencia,
  c.conta,
  -- Saldo inicial que a conta foi criada
  coalesce(c.saldo_inicial, 0) +
  coalesce(sum(
    case
      when t.tipo_movimento = 'CREDITO' then t.valor
      when t.tipo_movimento = 'DEBITO' then -t.valor
      else 0
    end
  ), 0) as saldo_atual
from fin_contas_bancarias c
left join fin_transacoes t on t.conta_id = c.id
group by c.id;


-- ============================================================
-- FUNÇÃO (RPC): PAGAR UM TÍTULO
-- ============================================================
-- Garante a inserção da transação e a atualização do título de forma segura.

create or replace function fn_pagar_titulo(
  p_titulo_id uuid,
  p_conta_id uuid,
  p_valor numeric,
  p_forma_pagamento_id uuid default null,
  p_data_pagamento timestamp default now()
)
returns void
language plpgsql
security definer
as $$
declare
  v_titulo_valor_pago numeric;
  v_titulo_valor_total numeric;
  v_titulo_tipo fin_titulo_tipo;
  v_status_atualizado fin_titulo_status;
begin

  -- Busca o título
  select valor_total, valor_pago, tipo
  into v_titulo_valor_total, v_titulo_valor_pago, v_titulo_tipo
  from fin_titulos
  where id = p_titulo_id
  for update; -- Lock row for concurrency

  if not found then
    raise exception 'Título não encontrado.';
  end if;

  if p_valor <= 0 then
    raise exception 'O valor do pagamento deve ser maior que zero.';
  end if;

  -- 1. Insere a transação no extrato
  insert into fin_transacoes (
    titulo_id,
    conta_id,
    forma_pagamento_id,
    tipo_movimento,
    valor,
    data_pagamento,
    descricao
  ) values (
    p_titulo_id,
    p_conta_id,
    p_forma_pagamento_id,
    case
      when v_titulo_tipo = 'RECEBER' then 'CREDITO'::fin_transacao_tipo
      else 'DEBITO'::fin_transacao_tipo
    end,
    p_valor,
    p_data_pagamento,
    'Pagamento de Título'
  );

  -- 2. Recalcula o valor pago do título baseando-se no extrato real
  -- (A forma mais segura de evitar bugs de dessincronização)
  select coalesce(sum(valor), 0)
  into v_titulo_valor_pago
  from fin_transacoes
  where titulo_id = p_titulo_id;

  -- 3. Define o Status
  if v_titulo_valor_pago >= v_titulo_valor_total then
    v_status_atualizado := 'PAGO';
  elsif v_titulo_valor_pago > 0 then
    v_status_atualizado := 'PARCIAL';
  else
    v_status_atualizado := 'PENDENTE';
  end if;

  -- 4. Atualiza o Título
  update fin_titulos
  set 
    valor_pago = v_titulo_valor_pago,
    status = v_status_atualizado,
    updated_at = now()
  where id = p_titulo_id;

end;
$$;


-- ============================================================
-- FUNÇÃO (RPC): TRANSFERÊNCIA ENTRE CONTAS
-- ============================================================

create or replace function fn_transferir_saldo(
  p_conta_origem_id uuid,
  p_conta_destino_id uuid,
  p_valor numeric,
  p_descricao text default 'Transferência',
  p_data_pagamento timestamp default now()
)
returns void
language plpgsql
security definer
as $$
declare
  v_transferencia_id uuid := gen_random_uuid();
begin

  if p_valor <= 0 then
    raise exception 'O valor da transferência deve ser maior que zero.';
  end if;

  -- Débito na origem
  insert into fin_transacoes (
    conta_id,
    tipo_movimento,
    valor,
    origem_tipo,
    origem_id,
    descricao,
    data_pagamento
  ) values (
    p_conta_origem_id,
    'DEBITO',
    p_valor,
    'TRANSFERENCIA',
    v_transferencia_id,
    p_descricao || ' (Saída)',
    p_data_pagamento
  );

  -- Crédito no destino
  insert into fin_transacoes (
    conta_id,
    tipo_movimento,
    valor,
    origem_tipo,
    origem_id,
    descricao,
    data_pagamento
  ) values (
    p_conta_destino_id,
    'CREDITO',
    p_valor,
    'TRANSFERENCIA',
    v_transferencia_id,
    p_descricao || ' (Entrada)',
    p_data_pagamento
  );

end;
$$;


-- ============================================================
-- TRIGGER: ATUALIZAR STATUS DE ATRASO
-- Função utilitária para rodar periodicamente usando pg_cron ou script frontend
-- ============================================================
create or replace function cron_marcar_atrasados()
returns void
language plpgsql
as $$
begin
  update fin_titulos
  set status = 'ATRASADO'
  where status in ('PENDENTE', 'PARCIAL')
    and data_vencimento < current_date;
end;
$$;

