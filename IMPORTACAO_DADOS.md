# 📊 Guia de Importação de Dados

## 🗑️ 1. Limpar Banco de Dados

Para limpar todos os dados existentes:

```bash
node clear-database.js
```

## 📋 2. Preparar Dados da Planilha

### Formato do Arquivo CSV

Crie um arquivo chamado `dados-importacao.csv` na raiz do projeto com o seguinte formato:

```csv
tipo,descricao,valor,data_vencimento,data_pagamento,data_recebimento,categoria,modalidade,status
```

### Tipos de Dados Suportados

#### Categorias
```csv
categoria,Nome da Categoria,tipo,categoria
```
- **tipo**: `receita` ou `despesa`
- **categoria**: `operacional` ou `não operacional`

#### Modalidades de Receita
```csv
modalidade,Nome da Modalidade,taxa_percentual
```
- **taxa_percentual**: percentual da taxa (ex: 10 para 10%)

#### Bancos
```csv
banco,Nome do Banco,saldo_inicial,data_inicial
```

#### Receitas
```csv
receita,Descrição,valor,data_vencimento,data_recebimento,categoria,status
```

#### Despesas
```csv
despesa,Descrição,valor,data_vencimento,data_pagamento,categoria,status
```

### Exemplo Completo

```csv
tipo,descricao,valor,data_vencimento,data_pagamento,data_recebimento,categoria,modalidade,status
categoria,Água e Gás,despesa,operacional
categoria,Internet e Telefone,despesa,operacional
categoria,Aluguel,despesa,operacional
categoria,Alimentos e Bebidas,despesa,operacional
categoria,Investimentos,despesa,operacional
categoria,Ifood,receita,operacional
categoria,Uber Eats,receita,operacional
categoria,Rappi,receita,operacional
modalidade,Ifood,10
modalidade,Uber Eats,15
modalidade,Rappi,12
banco,Nubank,1000.00,2025-01-01
receita,Ifood Voucher,100.00,2025-08-01,2025-08-01,,investimento,,pago
receita,Ifood,500.00,2025-08-05,,2025-08-05,Ifood,,pago
receita,Uber Eats,300.00,2025-08-10,,2025-08-10,Uber Eats,,pago
despesa,Aluguel,800.00,2025-08-05,2025-08-05,,Aluguel,,pago
despesa,Água,150.00,2025-08-10,2025-08-10,,Água e Gás,,pago
despesa,Internet,200.00,2025-08-15,2025-08-15,,Internet e Telefone,,pago
despesa,Alimentos,400.00,2025-08-20,2025-08-20,,Alimentos e Bebidas,,pago
```

## 📊 3. Importar Dados

```bash
node import-spreadsheet.js
```

## 🔧 4. Verificar Importação

Após a importação, verifique no dashboard se os dados foram importados corretamente.

## 🚀 5. Próximos Passos

1. ✅ Testar dados no ambiente local
2. 🔄 Fazer deploy para Supabase (produção)
3. 📊 Implementar relatórios
4. 🔗 Conectar GitHub e Vercel

## 📝 Notas Importantes

- **Datas**: Use formato YYYY-MM-DD ou DD/MM/YYYY
- **Valores**: Use vírgula como separador decimal (ex: 100,50)
- **Status**: `pago`, `pendente`, `vencido`
- **Categorias**: Importe primeiro as categorias, depois os lançamentos
- **Modalidades**: Importe antes das receitas que usam modalidades

## 🐛 Solução de Problemas

### Erro de Variáveis de Ambiente
Certifique-se de que o arquivo `.env` existe com:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### Erro de Formato de Data
Use apenas os formatos aceitos:
- YYYY-MM-DD
- DD/MM/YYYY

### Erro de Valor Monetário
Use apenas números e vírgula:
- ✅ 100,50
- ✅ 1000
- ❌ R$ 100,50
- ❌ 100.50 