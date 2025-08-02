import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para ler arquivo CSV
function readCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    const data = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim())
        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        data.push(row)
      }
    }
    
    return data
  } catch (error) {
    console.error('❌ Erro ao ler arquivo:', error.message)
    return []
  }
}

// Função para formatar data
function formatDate(dateString) {
  if (!dateString) return null
  
  // Tentar diferentes formatos de data
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // Tentar formato brasileiro DD/MM/YYYY
    const parts = dateString.split('/')
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    return null
  }
  
  return date.toISOString().split('T')[0]
}

// Função para formatar valor monetário
function formatCurrency(value) {
  if (!value) return 0
  
  // Remover símbolos de moeda e espaços
  const cleanValue = value.toString().replace(/[R$\s.]/g, '').replace(',', '.')
  const numValue = parseFloat(cleanValue)
  
  return isNaN(numValue) ? 0 : numValue
}

async function importData() {
  console.log('📊 Iniciando importação de dados...')
  
  try {
    // Verificar se o arquivo de dados existe
    const dataFile = path.join(process.cwd(), 'dados-importacao.csv')
    
    if (!fs.existsSync(dataFile)) {
      console.log('📁 Arquivo de dados não encontrado!')
      console.log('💡 Crie um arquivo chamado "dados-importacao.csv" na raiz do projeto')
      console.log('📋 Formato esperado:')
      console.log('tipo,descricao,valor,data_vencimento,data_pagamento,data_recebimento,categoria,modalidade,status')
      console.log('receita,Ifood Voucher,100.00,2025-08-01,,,investimento,,pago')
      console.log('despesa,Aluguel,500.00,2025-08-05,2025-08-05,,fixa,,pago')
      return
    }
    
    const data = readCSV(dataFile)
    console.log(`📈 Encontrados ${data.length} registros para importar`)
    
    // Processar cada linha
    for (const row of data) {
      try {
        const tipo = row.tipo?.toLowerCase()
        
        if (tipo === 'receita') {
          await importReceita(row)
        } else if (tipo === 'despesa') {
          await importDespesa(row)
        } else if (tipo === 'categoria') {
          await importCategoria(row)
        } else if (tipo === 'modalidade') {
          await importModalidade(row)
        } else if (tipo === 'banco') {
          await importBanco(row)
        }
      } catch (error) {
        console.error(`❌ Erro ao processar linha:`, row, error.message)
      }
    }
    
    console.log('🎉 Importação concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante importação:', error)
  }
}

async function importReceita(row) {
  const receita = {
    descricao: row.descricao,
    valor: formatCurrency(row.valor),
    data_vencimento: formatDate(row.data_vencimento),
    data_recebimento: formatDate(row.data_recebimento),
    status: row.status || 'pendente'
  }
  
  const { error } = await supabase
    .from('contas_receber')
    .insert(receita)
    
  if (error) {
    console.error('❌ Erro ao importar receita:', error.message)
  } else {
    console.log(`✅ Receita importada: ${row.descricao}`)
  }
}

async function importDespesa(row) {
  const despesa = {
    descricao: row.descricao,
    valor: formatCurrency(row.valor),
    data_vencimento: formatDate(row.data_vencimento),
    data_pagamento: formatDate(row.data_pagamento),
    status: row.status || 'pendente'
  }
  
  const { error } = await supabase
    .from('contas_pagar')
    .insert(despesa)
    
  if (error) {
    console.error('❌ Erro ao importar despesa:', error.message)
  } else {
    console.log(`✅ Despesa importada: ${row.descricao}`)
  }
}

async function importCategoria(row) {
  const categoria = {
    nome: row.nome,
    tipo: row.tipo || 'despesa',
    categoria: row.categoria || 'operacional'
  }
  
  const { error } = await supabase
    .from('categorias')
    .insert(categoria)
    
  if (error) {
    console.error('❌ Erro ao importar categoria:', error.message)
  } else {
    console.log(`✅ Categoria importada: ${row.nome}`)
  }
}

async function importModalidade(row) {
  const modalidade = {
    nome: row.nome,
    taxa_percentual: parseFloat(row.taxa_percentual) || 0
  }
  
  const { error } = await supabase
    .from('modalidades_receita')
    .insert(modalidade)
    
  if (error) {
    console.error('❌ Erro ao importar modalidade:', error.message)
  } else {
    console.log(`✅ Modalidade importada: ${row.nome}`)
  }
}

async function importBanco(row) {
  const banco = {
    nome: row.nome,
    saldo_inicial: formatCurrency(row.saldo_inicial) || 0,
    data_inicial: formatDate(row.data_inicial)
  }
  
  const { error } = await supabase
    .from('bancos')
    .insert(banco)
    
  if (error) {
    console.error('❌ Erro ao importar banco:', error.message)
  } else {
    console.log(`✅ Banco importado: ${row.nome}`)
  }
}

importData() 