-- Criar tabela para ajustes de saldo bancário
CREATE TABLE IF NOT EXISTS ajustes_saldo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    banco_id UUID REFERENCES bancos(id) ON DELETE CASCADE,
    saldo_anterior DECIMAL(15,2) NOT NULL,
    saldo_novo DECIMAL(15,2) NOT NULL,
    diferenca DECIMAL(15,2) NOT NULL,
    motivo TEXT NOT NULL,
    observacoes TEXT,
    data_ajuste TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ajustes_saldo_user_id ON ajustes_saldo(user_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_saldo_banco_id ON ajustes_saldo(banco_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_saldo_data ON ajustes_saldo(data_ajuste);

-- RLS (Row Level Security)
ALTER TABLE ajustes_saldo ENABLE ROW LEVEL SECURITY;

-- Política: usuário só pode ver seus próprios ajustes
CREATE POLICY "Usuários podem ver seus próprios ajustes de saldo" ON ajustes_saldo
    FOR ALL USING (auth.uid() = user_id);

-- Trigger para atualizar o saldo_atual do banco quando houver ajuste
CREATE OR REPLACE FUNCTION atualizar_saldo_banco_apos_ajuste()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o saldo_atual do banco
    UPDATE bancos 
    SET saldo_atual = NEW.saldo_novo,
        updated_at = NOW()
    WHERE id = NEW.banco_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_saldo_banco
    AFTER INSERT ON ajustes_saldo
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_saldo_banco_apos_ajuste(); 