-- Create transferencias table
CREATE TABLE IF NOT EXISTS public.transferencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    banco_origem_id UUID REFERENCES public.bancos(id) ON DELETE CASCADE,
    banco_destino_id UUID REFERENCES public.bancos(id) ON DELETE CASCADE,
    valor DECIMAL(15,2) NOT NULL,
    descricao TEXT,
    data_transferencia DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transferencias_banco_origem ON public.transferencias(banco_origem_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_banco_destino ON public.transferencias(banco_destino_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_data ON public.transferencias(data_transferencia);

-- Add RLS policies
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on transferencias" ON public.transferencias
    FOR ALL USING (true); 