-- Script para verificar e resolver bancos duplicados
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todos os bancos do usuário atual
SELECT 
  id,
  nome,
  tipo,
  saldo_inicial,
  saldo_atual,
  ativo,
  created_at,
  user_id
FROM bancos 
WHERE user_id = auth.uid()
ORDER BY nome, created_at;

-- 2. Verificar se há bancos com nomes similares (case insensitive)
SELECT 
  LOWER(nome) as nome_lower,
  COUNT(*) as quantidade,
  STRING_AGG(nome, ', ') as nomes_originais,
  STRING_AGG(id::text, ', ') as ids
FROM bancos 
WHERE user_id = auth.uid()
GROUP BY LOWER(nome)
HAVING COUNT(*) > 1
ORDER BY nome_lower;

-- 3. Verificar bancos "CAIXA" especificamente
SELECT 
  id,
  nome,
  tipo,
  saldo_inicial,
  saldo_atual,
  ativo,
  created_at
FROM bancos 
WHERE user_id = auth.uid() 
  AND LOWER(nome) LIKE '%caixa%'
ORDER BY created_at;

-- 4. Para deletar bancos duplicados (execute apenas se necessário)
-- Substitua 'ID_DO_BANCO_DUPLICADO' pelo ID que você quer remover
-- DELETE FROM bancos WHERE id = 'ID_DO_BANCO_DUPLICADO' AND user_id = auth.uid();

-- 5. Para atualizar o nome de um banco (execute apenas se necessário)
-- UPDATE bancos 
-- SET nome = 'CAIXA' 
-- WHERE id = 'ID_DO_BANCO' AND user_id = auth.uid();
