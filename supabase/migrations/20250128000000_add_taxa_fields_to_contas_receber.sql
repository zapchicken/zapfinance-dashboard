-- Add missing fields to contas_receber table
-- This migration adds the fields that are being used in the application but missing from the database

-- Add taxa_percentual field to contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN taxa_percentual NUMERIC DEFAULT 0;

-- Add valor_taxa field to contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN valor_taxa NUMERIC DEFAULT 0;

-- Add valor_liquido field to contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN valor_liquido NUMERIC DEFAULT 0;

-- Add tipo_receita field to contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN tipo_receita TEXT DEFAULT 'operacional';

-- Add banco_id field to contas_receber
ALTER TABLE public.contas_receber 
ADD COLUMN banco_id UUID;

-- Add foreign key constraint for banco_id
ALTER TABLE public.contas_receber
ADD CONSTRAINT fk_contas_receber_banco_id
FOREIGN KEY (banco_id) REFERENCES public.bancos(id);

-- Create indexes for better performance
CREATE INDEX idx_contas_receber_taxa_percentual ON public.contas_receber(taxa_percentual);
CREATE INDEX idx_contas_receber_valor_taxa ON public.contas_receber(valor_taxa);
CREATE INDEX idx_contas_receber_valor_liquido ON public.contas_receber(valor_liquido);
CREATE INDEX idx_contas_receber_tipo_receita ON public.contas_receber(tipo_receita);
CREATE INDEX idx_contas_receber_banco_id ON public.contas_receber(banco_id); 