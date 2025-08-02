-- Create tables for financial management system

-- Bancos/Contas bancárias
CREATE TABLE public.bancos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('conta_corrente', 'poupanca', 'cartao_credito', 'investimento')),
  saldo_inicial DECIMAL(15,2) DEFAULT 0,
  saldo_atual DECIMAL(15,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor TEXT DEFAULT '#6366f1',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fornecedores
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cnpj_cpf TEXT,
  endereco TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transações
CREATE TABLE public.transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banco_id UUID NOT NULL REFERENCES public.bancos(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias(id),
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  data_transacao DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'efetivada' CHECK (status IN ('pendente', 'efetivada', 'cancelada')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contas a pagar
CREATE TABLE public.contas_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  categoria_id UUID REFERENCES public.categorias(id),
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contas a receber
CREATE TABLE public.contas_receber (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cliente_nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id),
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bancos
CREATE POLICY "Users can view their own bancos" ON public.bancos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bancos" ON public.bancos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bancos" ON public.bancos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bancos" ON public.bancos FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categorias
CREATE POLICY "Users can view their own categorias" ON public.categorias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categorias" ON public.categorias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categorias" ON public.categorias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categorias" ON public.categorias FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for fornecedores
CREATE POLICY "Users can view their own fornecedores" ON public.fornecedores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fornecedores" ON public.fornecedores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fornecedores" ON public.fornecedores FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for transacoes
CREATE POLICY "Users can view their own transacoes" ON public.transacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transacoes" ON public.transacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transacoes" ON public.transacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transacoes" ON public.transacoes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for contas_pagar
CREATE POLICY "Users can view their own contas_pagar" ON public.contas_pagar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contas_pagar" ON public.contas_pagar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contas_pagar" ON public.contas_pagar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contas_pagar" ON public.contas_pagar FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for contas_receber
CREATE POLICY "Users can view their own contas_receber" ON public.contas_receber FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contas_receber" ON public.contas_receber FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contas_receber" ON public.contas_receber FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contas_receber" ON public.contas_receber FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_bancos_updated_at BEFORE UPDATE ON public.bancos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bancos_user_id ON public.bancos(user_id);
CREATE INDEX idx_categorias_user_id ON public.categorias(user_id);
CREATE INDEX idx_fornecedores_user_id ON public.fornecedores(user_id);
CREATE INDEX idx_transacoes_user_id ON public.transacoes(user_id);
CREATE INDEX idx_transacoes_banco_id ON public.transacoes(banco_id);
CREATE INDEX idx_transacoes_data ON public.transacoes(data_transacao);
CREATE INDEX idx_contas_pagar_user_id ON public.contas_pagar(user_id);
CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX idx_contas_receber_user_id ON public.contas_receber(user_id);
CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber(data_vencimento);