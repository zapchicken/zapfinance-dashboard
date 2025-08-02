-- Add banco_id field to contas_pagar and contas_receber tables
-- This is required for the cash flow to work properly

-- Add banco_id to contas_pagar
ALTER TABLE public.contas_pagar 
ADD COLUMN banco_id UUID REFERENCES public.bancos(id) ON DELETE SET NULL;

-- Add banco_id to contas_receber  
ALTER TABLE public.contas_receber 
ADD COLUMN banco_id UUID REFERENCES public.bancos(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_contas_pagar_banco_id ON public.contas_pagar(banco_id);
CREATE INDEX idx_contas_receber_banco_id ON public.contas_receber(banco_id); 