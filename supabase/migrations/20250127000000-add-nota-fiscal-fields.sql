-- Adicionar campos de nota fiscal à tabela contas_pagar
ALTER TABLE public.contas_pagar 
ADD COLUMN data_nota_fiscal DATE,
ADD COLUMN referencia_nota_fiscal TEXT; 