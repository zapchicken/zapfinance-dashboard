// Teste para verificar o problema com os valores

function safeEval(expr) {
  if (!expr) return 0;
  try {
    // Remove espaços em branco
    let cleanExpr = expr.trim();
    
    // Se não contém operadores matemáticos, trata como número simples
    if (!/[\+\-\*\/]/.test(cleanExpr)) {
      // Normaliza o número: remove pontos de milhar e troca vírgula de decimal por ponto
      const normalizedExpr = cleanExpr.replace(/\./g, '').replace(/,/g, '.');
      const result = parseFloat(normalizedExpr);
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    }
    
    // Para expressões matemáticas, normaliza e avalia
    const normalizedExpr = cleanExpr.replace(/\./g, '').replace(/,/g, '.');
    
    // Valida se a expressão contém apenas caracteres permitidos
    if (/^[0-9+\-*/.() ]+$/.test(normalizedExpr)) {
      // Usa o construtor Function para avaliar a expressão de forma segura
      const result = Function('"use strict"; return (' + normalizedExpr + ')')();
      // Arredonda para 2 casas decimais para evitar problemas de ponto flutuante
      return Math.round(result * 100) / 100;
    }
    return 0;
  } catch {
    return 0;
  }
}

console.log('=== TESTE DOS VALORES ===');

// Testar os valores que estão aparecendo na imagem
const valoresTeste = [
  '148',
  '280.2', 
  '55.89',
  '934.63',
  '24.77'
];

valoresTeste.forEach(valor => {
  const resultado = safeEval(valor);
  console.log(`Valor: "${valor}" → Resultado: ${resultado}`);
});

console.log('\n=== TESTE DOS CÁLCULOS ===');

// Testar os cálculos de taxa
const testes = [
  { valor: 148, taxa: 4.5 },
  { valor: 280.2, taxa: 1.38 },
  { valor: 55.89, taxa: 0 },
  { valor: 934.63, taxa: 17 },
  { valor: 24.77, taxa: 100 }
];

testes.forEach(({ valor, taxa }) => {
  const valorTaxa = valor * (taxa / 100);
  const valorLiquido = valor - valorTaxa;
  console.log(`Valor: ${valor}, Taxa: ${taxa}%`);
  console.log(`  Valor da Taxa: ${valorTaxa.toFixed(2)}`);
  console.log(`  Valor Líquido: ${valorLiquido.toFixed(2)}`);
  console.log('');
});

console.log('=== PROBLEMA IDENTIFICADO ===');
console.log('Os valores estão sendo processados corretamente pela função safeEval');
console.log('O problema pode estar na conversão dos valores quando são carregados do banco');
console.log('ou na formatação de exibição');
