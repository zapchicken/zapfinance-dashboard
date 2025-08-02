-- Seed data for default banks
-- This script inserts the default banks needed for the revenue modalities

-- Insert default banks (these will be associated with the first user)
-- Note: Replace 'USER_ID_HERE' with the actual user ID when running this script

INSERT INTO public.bancos (id, user_id, nome, tipo, saldo_inicial, saldo_atual, ativo, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'USER_ID_HERE', 'INTER', 'conta_corrente', 0, 0, true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'IFOOD', 'conta_corrente', 0, 0, true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'CAIXA', 'conta_corrente', 0, 0, true, now(), now());

-- Insert default revenue modalities
INSERT INTO public.modalidades_receita (id, user_id, nome, taxa_percentual, data_efetivacao, ativo, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'USER_ID_HERE', 'Crédito', 0, '2025-01-01', true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'Débito', 0, '2025-01-01', true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'Pix', 0, '2025-01-01', true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'Cortesia', 0, '2025-01-01', true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'Ifood', 0, '2025-01-01', true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'Ifood Voucher', 0, '2025-01-01', true, now(), now()),
  (gen_random_uuid(), 'USER_ID_HERE', 'Dinheiro', 0, '2025-01-01', true, now(), now()); 