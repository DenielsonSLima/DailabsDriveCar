-- Save the draft batch settings with the representative vehicle. Existing rows
-- keep NULL, and creating a batch continues to use the existing atomic RPC.
SET lock_timeout = '5s';
ALTER TABLE public.est_veiculos
  ADD COLUMN entrada_lote_quantidade integer,
  ADD COLUMN entrada_lote_descricao text,
  ADD CONSTRAINT est_veiculos_entrada_lote_valida CHECK (
    (entrada_lote_quantidade IS NULL AND entrada_lote_descricao IS NULL) OR (
      entrada_lote_quantidade IS NOT NULL AND
      entrada_lote_descricao IS NOT NULL AND
      entrada_lote_quantidade BETWEEN 2 AND 1000 AND
      char_length(entrada_lote_descricao) BETWEEN 1 AND 200 AND
      entrada_lote_descricao ~ '[^[:space:]]'
    )
  ) NOT VALID;
-- The nullable columns are new, so existing rows already satisfy the check.
ALTER TABLE public.est_veiculos VALIDATE CONSTRAINT est_veiculos_entrada_lote_valida;
RESET lock_timeout;
