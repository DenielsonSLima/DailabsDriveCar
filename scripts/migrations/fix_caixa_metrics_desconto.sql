-- ============================================================
-- CORREÇÃO: Desconto não reduzia "Contas a Receber" no Caixa
-- ============================================================
-- PROBLEMA: As funções calculavam o saldo em aberto dos
-- títulos sem subtrair o valor_desconto. Ao dar um desconto
-- num título de Contas a Receber, o valor no módulo Caixa
-- não diminuía.
--
-- COMO APLICAR:
--   1. Abra o Supabase Dashboard
--   2. Vá em "SQL Editor"
--   3. Execute o BLOCO 1 para diagnosticar
--   4. Execute o BLOCO 2 para corrigir as funções
-- ============================================================


-- ============================================================
-- BLOCO 1 — DIAGNÓSTICO (execute primeiro, só leitura)
-- Mostra quais títulos têm desconto e quanto falta corrigir
-- ============================================================
/*
SELECT
    tipo,
    COUNT(*) AS qtd_titulos,
    SUM(valor_total - valor_pago) AS saldo_sem_desconto,
    SUM(valor_total
        + COALESCE(valor_acrescimo, 0)
        - valor_pago
        - COALESCE(valor_desconto, 0)) AS saldo_com_desconto,
    SUM(COALESCE(valor_desconto, 0)) AS total_desconto_ignorado
FROM fin_titulos
WHERE status NOT IN ('PAGO', 'CANCELADO')
GROUP BY tipo;
*/


-- ============================================================
-- BLOCO 2 — CORREÇÃO AUTOMÁTICA via substituição de string
-- Tenta corrigir sem precisar reescrever a função inteira.
-- Execute este bloco no SQL Editor do Supabase.
-- ============================================================

DO $$
DECLARE
    v_funcoes text[] := ARRAY['get_caixa_metrics', 'get_submodule_kpis', 'get_financeiro_kpis'];
    v_nome    text;
    v_def     text;
    v_fixed   text;
    v_alterou boolean;
BEGIN
    FOREACH v_nome IN ARRAY v_funcoes LOOP
        -- Pega a definição atual da função
        SELECT pg_get_functiondef(oid) INTO v_def
        FROM pg_proc
        WHERE proname = v_nome
          AND pronamespace = 'public'::regnamespace
        LIMIT 1;

        IF v_def IS NULL THEN
            RAISE NOTICE 'Função % não encontrada, pulando.', v_nome;
            CONTINUE;
        END IF;

        v_fixed   := v_def;
        v_alterou := false;

        -- ── Padrão 1: valor_total - valor_pago (sem qualquer COALESCE)
        IF v_fixed LIKE '%valor_total - valor_pago%' THEN
            v_fixed := REPLACE(v_fixed,
                'valor_total - valor_pago',
                'valor_total + COALESCE(valor_acrescimo, 0) - valor_pago - COALESCE(valor_desconto, 0)');
            v_alterou := true;
        END IF;

        -- ── Padrão 2: t.valor_total - t.valor_pago (com alias t.)
        IF v_fixed LIKE '%t.valor_total - t.valor_pago%' THEN
            v_fixed := REPLACE(v_fixed,
                't.valor_total - t.valor_pago',
                't.valor_total + COALESCE(t.valor_acrescimo, 0) - t.valor_pago - COALESCE(t.valor_desconto, 0)');
            v_alterou := true;
        END IF;

        -- ── Padrão 3: valor_total - COALESCE(valor_pago, 0)
        IF v_fixed LIKE '%valor_total - COALESCE(valor_pago, 0)%' THEN
            v_fixed := REPLACE(v_fixed,
                'valor_total - COALESCE(valor_pago, 0)',
                'valor_total + COALESCE(valor_acrescimo, 0) - COALESCE(valor_pago, 0) - COALESCE(valor_desconto, 0)');
            v_alterou := true;
        END IF;

        -- ── Padrão 4: t.valor_total - COALESCE(t.valor_pago, 0)
        IF v_fixed LIKE '%t.valor_total - COALESCE(t.valor_pago, 0)%' THEN
            v_fixed := REPLACE(v_fixed,
                't.valor_total - COALESCE(t.valor_pago, 0)',
                't.valor_total + COALESCE(t.valor_acrescimo, 0) - COALESCE(t.valor_pago, 0) - COALESCE(t.valor_desconto, 0)');
            v_alterou := true;
        END IF;

        IF v_alterou THEN
            EXECUTE v_fixed;
            RAISE NOTICE 'Função % corrigida com sucesso!', v_nome;
        ELSE
            RAISE NOTICE 'Função % não precisou de correção ou o padrão não foi reconhecido.', v_nome;
            RAISE NOTICE 'Se o problema persistir, rode o BLOCO 3 abaixo e mande o resultado para análise.';
        END IF;
    END LOOP;
END;
$$;


-- ============================================================
-- BLOCO 3 — Se o BLOCO 2 não resolver: exporta as funções
-- Cole o resultado aqui e enviará para análise e correção manual
-- ============================================================
/*
SELECT
    proname AS funcao,
    pg_get_functiondef(oid) AS definicao
FROM pg_proc
WHERE proname IN ('get_caixa_metrics', 'get_submodule_kpis')
  AND pronamespace = 'public'::regnamespace
ORDER BY proname;
*/
