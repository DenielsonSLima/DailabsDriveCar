-- Migration: Activate "PRAZO" payment form in cad_formas_pagamento
-- Date: 2026-06-09
-- Target: cad_formas_pagamento

UPDATE public.cad_formas_pagamento
SET ativo = true
WHERE nome = 'PRAZO' OR destino_lancamento = 'CONTAS_RECEBER';
