-- Script para inserir transações de teste
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos pegar os IDs dos bancos existentes
-- Substitua 'USER_ID_HERE' pelo seu user_id real

-- Inserir transações de teste
INSERT INTO public.transacoes (
  id, 
  user_id, 
  banco_id, 
  categoria_id, 
  fornecedor_id, 
  descricao, 
  valor, 
  tipo, 
  data_transacao, 
  status, 
  observacoes, 
  created_at, 
  updated_at
) VALUES 
  -- Transações de receita
  (
    gen_random_uuid(), 
    '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe', -- Substitua pelo seu user_id
    (SELECT id FROM bancos WHERE nome = 'INTER' AND user_id = '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe' LIMIT 1),
    NULL,
    NULL,
    'Venda de produtos',
    1500.00,
    'receita',
    '2025-01-15',
    'efetivada',
    'Venda realizada via cartão',
    now(),
    now()
  ),
  (
    gen_random_uuid(), 
    '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe',
    (SELECT id FROM bancos WHERE nome = 'IFOOD' AND user_id = '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe' LIMIT 1),
    NULL,
    NULL,
    'Pedido iFood',
    89.90,
    'receita',
    '2025-01-16',
    'efetivada',
    'Pedido entregue com sucesso',
    now(),
    now()
  ),
  (
    gen_random_uuid(), 
    '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe',
    (SELECT id FROM bancos WHERE nome = 'CAIXA' AND user_id = '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe' LIMIT 1),
    NULL,
    NULL,
    'Pagamento em dinheiro',
    250.00,
    'receita',
    '2025-01-17',
    'efetivada',
    'Pagamento recebido em dinheiro',
    now(),
    now()
  ),
  
  -- Transações de despesa
  (
    gen_random_uuid(), 
    '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe',
    (SELECT id FROM bancos WHERE nome = 'INTER' AND user_id = '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe' LIMIT 1),
    NULL,
    NULL,
    'Compra de ingredientes',
    450.00,
    'despesa',
    '2025-01-18',
    'efetivada',
    'Compra no atacado',
    now(),
    now()
  ),
  (
    gen_random_uuid(), 
    '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe',
    (SELECT id FROM bancos WHERE nome = 'TON' AND user_id = '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe' LIMIT 1),
    NULL,
    NULL,
    'Pagamento de conta de luz',
    180.50,
    'despesa',
    '2025-01-19',
    'pendente',
    'Conta a vencer',
    now(),
    now()
  ),
  
  -- Transações de transferência
  (
    gen_random_uuid(), 
    '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe',
    (SELECT id FROM bancos WHERE nome = 'TON I' AND user_id = '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe' LIMIT 1),
    NULL,
    NULL,
    'Transferência para investimento',
    1000.00,
    'transferencia',
    '2025-01-20',
    'efetivada',
    'Aplicação mensal',
    now(),
    now()
  );

-- Verificar se as transações foram inseridas
SELECT 
  t.id,
  t.descricao,
  t.valor,
  t.tipo,
  t.status,
  t.data_transacao,
  b.nome as banco_nome
FROM transacoes t
JOIN bancos b ON t.banco_id = b.id
WHERE t.user_id = '5915e3aa-f563-4ec8-a1fb-f95d8f4ac3fe'
ORDER BY t.data_transacao DESC;
