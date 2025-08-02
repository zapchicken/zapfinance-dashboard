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

async function clearDatabase() {
  console.log('🗑️  Iniciando limpeza do banco de dados...')
  
  try {
    // Lista de tabelas para limpar (em ordem de dependência)
    const tables = [
      'transferencias',
      'contas_receber',
      'contas_pagar',
      'categorias',
      'modalidades_receita',
      'bancos'
    ]
    
    for (const table of tables) {
      console.log(`📋 Limpando tabela: ${table}`)
      const { error } = await supabase
        .from(table)
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000') // Deletar todos os registros
        
      if (error) {
        console.error(`❌ Erro ao limpar ${table}:`, error.message)
      } else {
        console.log(`✅ Tabela ${table} limpa com sucesso`)
      }
    }
    
    console.log('🎉 Limpeza concluída!')
    console.log('💡 Agora você pode importar os dados da sua planilha')
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error)
  }
}

clearDatabase() 