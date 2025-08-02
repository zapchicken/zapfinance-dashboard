-- Create table for expense categories (categorias de despesas)
CREATE TABLE public.categorias_despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#ef4444',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for despesas (expenses) with installment support
CREATE TABLE public.despesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria_id UUID REFERENCES public.categorias_despesas(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  descricao TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  valor_parcela NUMERIC NOT NULL DEFAULT 0,
  total_parcelas INTEGER DEFAULT 1,
  parcela_atual INTEGER DEFAULT 1,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  observacoes TEXT,
  despesa_principal_id UUID REFERENCES public.despesas(id), -- Reference to main expense if this is an installment
  eh_parcelada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for revenue modalities (modalidades de receitas)
CREATE TABLE public.modalidades_receita (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  taxa_percentual NUMERIC DEFAULT 0,
  data_efetivacao DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categorias_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modalidades_receita ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categorias_despesas
CREATE POLICY "Users can view their own categorias_despesas" 
ON public.categorias_despesas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categorias_despesas" 
ON public.categorias_despesas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorias_despesas" 
ON public.categorias_despesas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorias_despesas" 
ON public.categorias_despesas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for despesas
CREATE POLICY "Users can view their own despesas" 
ON public.despesas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own despesas" 
ON public.despesas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own despesas" 
ON public.despesas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own despesas" 
ON public.despesas 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for modalidades_receita
CREATE POLICY "Users can view their own modalidades_receita" 
ON public.modalidades_receita 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own modalidades_receita" 
ON public.modalidades_receita 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own modalidades_receita" 
ON public.modalidades_receita 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own modalidades_receita" 
ON public.modalidades_receita 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categorias_despesas_updated_at
BEFORE UPDATE ON public.categorias_despesas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_despesas_updated_at
BEFORE UPDATE ON public.despesas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modalidades_receita_updated_at
BEFORE UPDATE ON public.modalidades_receita
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_categorias_despesas_user_id ON public.categorias_despesas(user_id);
CREATE INDEX idx_despesas_user_id ON public.despesas(user_id);
CREATE INDEX idx_despesas_categoria_id ON public.despesas(categoria_id);
CREATE INDEX idx_despesas_fornecedor_id ON public.despesas(fornecedor_id);
CREATE INDEX idx_despesas_principal_id ON public.despesas(despesa_principal_id);
CREATE INDEX idx_despesas_status ON public.despesas(status);
CREATE INDEX idx_modalidades_receita_user_id ON public.modalidades_receita(user_id);