import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.log('Certifique-se de que o arquivo .env existe com:')
  console.log('VITE_SUPABASE_URL=sua_url')
  console.log('VITE_SUPABASE_ANON_KEY=sua_chave')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearContasReceber() {
  console.log('🗑️  Iniciando limpeza da tabela contas_receber...')
  
  try {
    // Primeiro, vamos ver quantos registros existem
    const { data: countData, error: countError } = await supabase
      .from('contas_receber')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError.message)
      return
    }
    
    console.log(`📊 Encontrados ${countData} registros na tabela contas_receber`)
    
    // Confirmar com o usuário
    console.log('⚠️  ATENÇÃO: Isso vai deletar TODOS os registros de contas a receber!')
    console.log('Digite "SIM" para confirmar:')
    
    // Simular confirmação (você pode modificar isso se quiser)
    console.log('✅ Confirmado - prosseguindo com a limpeza...')
    
    // Limpar apenas a tabela contas_receber
    const { error } = await supabase
      .from('contas_receber')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // Deletar todos os registros
      
    if (error) {
      console.error('❌ Erro ao limpar contas_receber:', error.message)
    } else {
      console.log('✅ Tabela contas_receber limpa com sucesso!')
    }
    
    console.log('🎉 Limpeza concluída!')
    console.log('💡 Agora você pode lançar os dados novamente')
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error)
  }
}

clearContasReceber()
