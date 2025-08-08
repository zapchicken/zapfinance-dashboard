import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, TrendingUp, DollarSign, BarChart3, Calendar, Filter, Download, ArrowUp, ArrowDown, Circle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';

export default function Relatorios() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("mes-atual");
  const [tipo, setTipo] = useState("todos");
  const [formato, setFormato] = useState("excel");
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [relatorioComparativo, setRelatorioComparativo] = useState<any>(null);
  const [mesesComparacao, setMesesComparacao] = useState(6); // Últimos 6 meses
  const [detalhamento, setDetalhamento] = useState<any>(null);
  const [top5, setTop5] = useState<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    if (user) {
      fetchDados();
    }
  }, [user]);

  const fetchDados = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do Supabase
      const { data: receitas } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('user_id', user.id)
        .order('data_vencimento');

      const { data: despesas } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('user_id', user.id)
        .order('data_vencimento');

      const { data: categorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true);

      setDados({ receitas: receitas || [], despesas: despesas || [], categorias: categorias || [] });
      
      // Gerar relatório comparativo
      gerarRelatorioComparativo(receitas || [], despesas || [], categorias || []);
      
      // Gerar detalhamento
      gerarDetalhamento(receitas || [], despesas || [], categorias || []);
      
      // Gerar Top 5
      gerarTop5(receitas || [], despesas || [], categorias || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados para os relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioComparativo = (receitas: any[], despesas: any[], categorias: any[]) => {
    const hoje = new Date();
    const meses = [];
    
    // Gerar array dos últimos meses
    for (let i = mesesComparacao - 1; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push({
        ano: data.getFullYear(),
        mes: data.getMonth(),
        nome: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        inicio: new Date(data.getFullYear(), data.getMonth(), 1),
        fim: new Date(data.getFullYear(), data.getMonth() + 1, 0)
      });
    }

    const dadosMensais = meses.map((mes, index) => {
      // Filtrar dados do mês
      const receitasMes = receitas.filter(r => {
        const dataVenc = new Date(r.data_vencimento);
        return dataVenc >= mes.inicio && dataVenc <= mes.fim;
      });

      const despesasMes = despesas.filter(d => {
        const dataVenc = new Date(d.data_vencimento);
        return dataVenc >= mes.inicio && dataVenc <= mes.fim;
      });

      // Calcular indicadores
      const faturamento = receitasMes.reduce((sum, r) => sum + (r.valor || 0), 0);
      
      // Categorizar despesas
      const categoriasFixasIds = categorias.filter(c => c.tipo === 'despesa' && c.nome.toLowerCase().includes('fixa')).map(c => c.id);
      const categoriasInvestimentoIds = categorias.filter(c => c.tipo === 'despesa' && c.nome.toLowerCase().includes('investimento')).map(c => c.id);
      
      const custoVariavel = despesasMes
        .filter(d => !categoriasFixasIds.includes(d.categoria_id) && !categoriasInvestimentoIds.includes(d.categoria_id))
        .reduce((sum, d) => sum + (d.valor || 0), 0);
      
      const despesaFixa = despesasMes
        .filter(d => categoriasFixasIds.includes(d.categoria_id))
        .reduce((sum, d) => sum + (d.valor || 0), 0);
      
      const investimentos = despesasMes
        .filter(d => categoriasInvestimentoIds.includes(d.categoria_id))
        .reduce((sum, d) => sum + (d.valor || 0), 0);

      const margemContribuicao = faturamento - custoVariavel;
      const lucroOperacionalAntesInvestimentos = margemContribuicao - despesaFixa;
      const lucroOperacional = lucroOperacionalAntesInvestimentos - investimentos;

      // Movimentações não operacionais (simulado)
      const receitaNaoOperacional = receitasMes
        .filter(r => r.descricao?.toLowerCase().includes('não operacional') || r.descricao?.toLowerCase().includes('nao operacional'))
        .reduce((sum, r) => sum + (r.valor || 0), 0);
      
      const despesaNaoOperacional = despesasMes
        .filter(d => d.descricao?.toLowerCase().includes('não operacional') || d.descricao?.toLowerCase().includes('nao operacional'))
        .reduce((sum, d) => sum + (d.valor || 0), 0);

      const movimentacoesNaoOperacionais = receitaNaoOperacional - despesaNaoOperacional;
      const resultadoLiquido = lucroOperacional + movimentacoesNaoOperacionais;

      // Calcular percentuais
      const percentualCustoVariavel = faturamento > 0 ? (custoVariavel / faturamento) * 100 : 0;
      const percentualMargemContribuicao = faturamento > 0 ? (margemContribuicao / faturamento) * 100 : 0;
      const percentualDespesaFixa = faturamento > 0 ? (despesaFixa / faturamento) * 100 : 0;
      const percentualLucroOperacional = faturamento > 0 ? (lucroOperacional / faturamento) * 100 : 0;
      const percentualInvestimentos = faturamento > 0 ? (investimentos / faturamento) * 100 : 0;
      const percentualMovimentacoesNaoOperacionais = faturamento > 0 ? (movimentacoesNaoOperacionais / faturamento) * 100 : 0;
      const percentualResultadoLiquido = faturamento > 0 ? (resultadoLiquido / faturamento) * 100 : 0;

      // Calcular variação mensal (A/H)
      const variacaoMensal = index > 0 ? {
        faturamento: faturamento > 0 ? ((faturamento - dadosMensais[index - 1].faturamento) / dadosMensais[index - 1].faturamento) * 100 : 0,
        custoVariavel: custoVariavel > 0 ? ((custoVariavel - dadosMensais[index - 1].custoVariavel) / dadosMensais[index - 1].custoVariavel) * 100 : 0,
        margemContribuicao: margemContribuicao > 0 ? ((margemContribuicao - dadosMensais[index - 1].margemContribuicao) / dadosMensais[index - 1].margemContribuicao) * 100 : 0,
        despesaFixa: despesaFixa > 0 ? ((despesaFixa - dadosMensais[index - 1].despesaFixa) / dadosMensais[index - 1].despesaFixa) * 100 : 0,
        lucroOperacional: lucroOperacional > 0 ? ((lucroOperacional - dadosMensais[index - 1].lucroOperacional) / dadosMensais[index - 1].lucroOperacional) * 100 : 0,
        investimentos: investimentos > 0 ? ((investimentos - dadosMensais[index - 1].investimentos) / dadosMensais[index - 1].investimentos) * 100 : 0,
        movimentacoesNaoOperacionais: movimentacoesNaoOperacionais > 0 ? ((movimentacoesNaoOperacionais - dadosMensais[index - 1].movimentacoesNaoOperacionais) / dadosMensais[index - 1].movimentacoesNaoOperacionais) * 100 : 0,
        resultadoLiquido: resultadoLiquido > 0 ? ((resultadoLiquido - dadosMensais[index - 1].resultadoLiquido) / dadosMensais[index - 1].resultadoLiquido) * 100 : 0
      } : null;

      return {
        mes: mes.nome,
        faturamento,
        custoVariavel,
        margemContribuicao,
        despesaFixa,
        lucroOperacionalAntesInvestimentos,
        investimentos,
        lucroOperacional,
        receitaNaoOperacional,
        despesaNaoOperacional,
        movimentacoesNaoOperacionais,
        resultadoLiquido,
        percentualCustoVariavel,
        percentualMargemContribuicao,
        percentualDespesaFixa,
        percentualLucroOperacional,
        percentualInvestimentos,
        percentualMovimentacoesNaoOperacionais,
        percentualResultadoLiquido,
        variacaoMensal
      };
    });

    setRelatorioComparativo(dadosMensais);
  };

  const gerarDetalhamento = (receitas: any[], despesas: any[], categorias: any[]) => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Filtrar dados do mês atual
    const receitasMes = receitas.filter(r => {
      const dataVenc = new Date(r.data_vencimento);
      return dataVenc >= inicioMes && dataVenc <= fimMes;
    });

    const despesasMes = despesas.filter(d => {
      const dataVenc = new Date(d.data_vencimento);
      return dataVenc >= inicioMes && dataVenc <= fimMes;
    });

    // 1. FATURAMENTO - Agrupar por modalidade/descrição
    const faturamentoPorModalidade = receitasMes.reduce((acc: any, receita) => {
      const modalidade = receita.descricao || 'Outros';
      if (!acc[modalidade]) {
        acc[modalidade] = 0;
      }
      acc[modalidade] += receita.valor || 0;
      return acc;
    }, {});

    const faturamentoTotal = Object.values(faturamentoPorModalidade).reduce((sum: any, valor: any) => sum + valor, 0);
    
    const faturamentoDetalhado = Object.entries(faturamentoPorModalidade)
      .map(([modalidade, valor]: [string, any]) => ({
        categoria: modalidade,
        valor: valor,
        percentual: faturamentoTotal > 0 ? (valor / faturamentoTotal) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor);

    // 2. CUSTO VARIÁVEL - Agrupar por categoria
    const categoriasFixasIds = categorias.filter(c => c.tipo === 'despesa' && c.nome.toLowerCase().includes('fixa')).map(c => c.id);
    const categoriasInvestimentoIds = categorias.filter(c => c.tipo === 'despesa' && c.nome.toLowerCase().includes('investimento')).map(c => c.id);
    
    const custoVariavelPorCategoria = despesasMes
      .filter(d => !categoriasFixasIds.includes(d.categoria_id) && !categoriasInvestimentoIds.includes(d.categoria_id))
      .reduce((acc: any, despesa) => {
        const categoria = categorias.find(c => c.id === despesa.categoria_id)?.nome || 'Outros';
        if (!acc[categoria]) {
          acc[categoria] = 0;
        }
        acc[categoria] += despesa.valor || 0;
        return acc;
      }, {});

    const custoVariavelTotal = Object.values(custoVariavelPorCategoria).reduce((sum: any, valor: any) => sum + valor, 0);
    
    const custoVariavelDetalhado = Object.entries(custoVariavelPorCategoria)
      .map(([categoria, valor]: [string, any]) => ({
        categoria: categoria,
        valor: valor,
        variacao: 0 // Placeholder para variação
      }))
      .sort((a, b) => b.valor - a.valor);

    // 3. SOMA DE TAXA - Calcular taxas das receitas
    const taxasPorModalidade = receitasMes.reduce((acc: any, receita) => {
      const modalidade = receita.descricao || 'Outros';
      if (!acc[modalidade]) {
        acc[modalidade] = 0;
      }
      acc[modalidade] += receita.valor_taxa || 0;
      return acc;
    }, {});

    const taxaTotal = Object.values(taxasPorModalidade).reduce((sum: any, valor: any) => sum + valor, 0);
    
    const taxasDetalhado = Object.entries(taxasPorModalidade)
      .map(([modalidade, valor]: [string, any]) => ({
        categoria: modalidade,
        valor: valor
      }))
      .sort((a, b) => b.valor - a.valor);

    setDetalhamento({
      faturamento: {
        items: faturamentoDetalhado,
        total: faturamentoTotal
      },
      custoVariavel: {
        items: custoVariavelDetalhado,
        total: custoVariavelTotal
      },
      taxas: {
        items: taxasDetalhado,
        total: taxaTotal
      }
    });
  };

  const gerarTop5 = (receitas: any[], despesas: any[], categorias: any[]) => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Filtrar dados do mês atual
    const receitasMes = receitas.filter(r => {
      const dataVenc = new Date(r.data_vencimento);
      return dataVenc >= inicioMes && dataVenc <= fimMes;
    });

    const despesasMes = despesas.filter(d => {
      const dataVenc = new Date(d.data_vencimento);
      return dataVenc >= inicioMes && dataVenc <= fimMes;
    });

    // Top 5 Receitas
    const top5Receitas = receitasMes
      .sort((a, b) => (b.valor || 0) - (a.valor || 0))
      .slice(0, 5)
      .map((receita, index) => ({
        posicao: index + 1,
        descricao: receita.descricao || 'Sem descrição',
        valor: receita.valor || 0,
        data: receita.data_vencimento,
        tipo: 'receita'
      }));

    // Top 5 Despesas
    const top5Despesas = despesasMes
      .sort((a, b) => (b.valor || 0) - (a.valor || 0))
      .slice(0, 5)
      .map((despesa, index) => ({
        posicao: index + 1,
        descricao: despesa.descricao || 'Sem descrição',
        valor: despesa.valor || 0,
        data: despesa.data_vencimento,
        categoria: categorias.find(c => c.id === despesa.categoria_id)?.nome || 'Sem categoria',
        tipo: 'despesa'
      }));

    setTop5({
      receitas: top5Receitas,
      despesas: top5Despesas
    });
  };

  const calcularDadosRelatorio = () => {
    if (!dados) return null;

    const receitas = dados.receitas || [];
    const despesas = dados.despesas || [];
    const categorias = dados.categorias || [];

    // Filtrar por período
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const receitasFiltradas = receitas.filter((r: any) => {
      const dataVenc = new Date(r.data_vencimento);
      return dataVenc >= inicioMes && dataVenc <= fimMes;
    });

    const despesasFiltradas = despesas.filter((d: any) => {
      const dataVenc = new Date(d.data_vencimento);
      return dataVenc >= inicioMes && dataVenc <= fimMes;
    });

    // Calcular totais
    const totalReceitas = receitasFiltradas.reduce((sum: number, r: any) => sum + (r.valor || 0), 0);
    const totalDespesas = despesasFiltradas.reduce((sum: number, d: any) => sum + (d.valor || 0), 0);
    const lucroOperacional = totalReceitas - totalDespesas;

    // Categorizar despesas
    const categoriasFixasIds = categorias.filter((c: any) => c.categoria === 'Despesa Fixa').map((c: any) => c.id);
    const categoriasInvestimentoIds = categorias.filter((c: any) => c.categoria === 'Investimento').map((c: any) => c.id);

    const despesasFixas = despesasFiltradas
      .filter((d: any) => categoriasFixasIds.includes(d.categoria_id))
      .reduce((sum: number, d: any) => sum + (d.valor || 0), 0);

    const investimentos = despesasFiltradas
      .filter((d: any) => categoriasInvestimentoIds.includes(d.categoria_id))
      .reduce((sum: number, d: any) => sum + (d.valor || 0), 0);

    const custosVariaveis = despesasFiltradas
      .filter((d: any) => !categoriasFixasIds.includes(d.categoria_id) && !categoriasInvestimentoIds.includes(d.categoria_id))
      .reduce((sum: number, d: any) => sum + (d.valor || 0), 0);

    return {
      totalReceitas,
      totalDespesas,
      lucroOperacional,
      despesasFixas,
      investimentos,
      custosVariaveis,
      receitasFiltradas,
      despesasFiltradas
    };
  };

  async function handleGerarRelatorio(contexto?: string) {
    if (!dados) {
      toast({
        title: "Erro",
        description: "Dados não carregados. Tente novamente.",
        variant: "destructive"
      });
      return;
    }

    const dadosRelatorio = calcularDadosRelatorio();
    if (!dadosRelatorio) {
      toast({
        title: "Erro",
        description: "Não foi possível calcular os dados do relatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const tipoRelatorio = contexto || 'Relatório Geral';
      
      // Gerar relatório em Excel
      gerarRelatorioEspecifico(tipoRelatorio, dadosRelatorio, 'excel');

      toast({
        title: "Sucesso",
        description: `Relatório ${tipoRelatorio} gerado com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const exportarDetalhamento = () => {
    if (!detalhamento) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive"
      });
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    // Planilha 1: Faturamento
    const faturamentoData = detalhamento.faturamento.items.map((item: any) => ({
      'Modalidade': item.categoria,
      'Valor': item.valor,
      '%Part': item.percentual.toFixed(1) + '%'
    }));
    faturamentoData.push({
      'Modalidade': 'FATURAMENTO TOTAL',
      'Valor': detalhamento.faturamento.total,
      '%Part': '100%'
    });
    
    const faturamentoSheet = XLSX.utils.json_to_sheet(faturamentoData);
    XLSX.utils.book_append_sheet(workbook, faturamentoSheet, 'Faturamento');

    // Planilha 2: Custo Variável
    const custoVariavelData = detalhamento.custoVariavel.items.map((item: any) => ({
      'Categoria': item.categoria,
      'Valor': item.valor,
      'Variação': item.variacao
    }));
    custoVariavelData.push({
      'Categoria': 'CUSTO VARIÁVEL TOTAL',
      'Valor': detalhamento.custoVariavel.total,
      'Variação': ''
    });
    
    const custoVariavelSheet = XLSX.utils.json_to_sheet(custoVariavelData);
    XLSX.utils.book_append_sheet(workbook, custoVariavelSheet, 'Custo Variável');

    // Planilha 3: Taxas
    const taxasData = detalhamento.taxas.items.map((item: any) => ({
      'Modalidade': item.categoria,
      'Total': item.valor
    }));
    taxasData.push({
      'Modalidade': 'TOTAL TAXAS',
      'Total': detalhamento.taxas.total
    });
    
    const taxasSheet = XLSX.utils.json_to_sheet(taxasData);
    XLSX.utils.book_append_sheet(workbook, taxasSheet, 'Taxas');
    
    // Salvar arquivo
    XLSX.writeFile(workbook, `detalhamento_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Sucesso",
      description: "Detalhamento exportado com sucesso!",
    });
  };

  const exportarTop5 = () => {
    if (!top5) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive"
      });
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    // Planilha 1: Top 5 Receitas
    const top5ReceitasData = top5.receitas.map((item: any) => ({
      'Posição': item.posicao,
      'Descrição': item.descricao,
      'Valor': item.valor,
      'Data': item.data
    }));
    
    const top5ReceitasSheet = XLSX.utils.json_to_sheet(top5ReceitasData);
    XLSX.utils.book_append_sheet(workbook, top5ReceitasSheet, 'Top 5 Receitas');

    // Planilha 2: Top 5 Despesas
    const top5DespesasData = top5.despesas.map((item: any) => ({
      'Posição': item.posicao,
      'Descrição': item.descricao,
      'Valor': item.valor,
      'Categoria': item.categoria,
      'Data': item.data
    }));
    
    const top5DespesasSheet = XLSX.utils.json_to_sheet(top5DespesasData);
    XLSX.utils.book_append_sheet(workbook, top5DespesasSheet, 'Top 5 Despesas');
    
    // Salvar arquivo
    XLSX.writeFile(workbook, `top5_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Sucesso",
      description: "Top 5 exportado com sucesso!",
    });
  };

  const exportarRelatorioComparativo = () => {
    if (!relatorioComparativo || relatorioComparativo.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive"
      });
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    // Dados para exportação
    const dadosExport = relatorioComparativo.map((mes: any) => ({
      'Mês': mes.mes,
      'Faturamento': mes.faturamento,
      'Custo Variável': mes.custoVariavel,
      'Margem de Contribuição': mes.margemContribuicao,
      'Despesa Fixa': mes.despesaFixa,
      'Lucro Operacional (Antes Investimentos)': mes.lucroOperacionalAntesInvestimentos,
      'Investimentos': mes.investimentos,
      'Lucro Operacional': mes.lucroOperacional,
      'Receita Não Operacional': mes.receitaNaoOperacional,
      'Despesa Não Operacional': mes.despesaNaoOperacional,
      'Movimentações Não Operacionais': mes.movimentacoesNaoOperacionais,
      'Resultado Líquido': mes.resultadoLiquido,
      '% Custo Variável': mes.percentualCustoVariavel,
      '% Margem Contribuição': mes.percentualMargemContribuicao,
      '% Despesa Fixa': mes.percentualDespesaFixa,
      '% Lucro Operacional': mes.percentualLucroOperacional,
      '% Investimentos': mes.percentualInvestimentos,
      '% Movimentações Não Operacionais': mes.percentualMovimentacoesNaoOperacionais,
      '% Resultado Líquido': mes.percentualResultadoLiquido
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExport);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Comparativo');
    
    // Salvar arquivo
    XLSX.writeFile(workbook, `relatorio_comparativo_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Sucesso",
      description: "Relatório comparativo exportado com sucesso!",
    });
  };

  const gerarRelatorioEspecifico = (tipoRelatorio: string, dadosRelatorio: any, formato: string) => {
    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Funções de formatação
    const formatarMoeda = (valor: number) => `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatarPercentual = (valor: number) => `${valor.toFixed(2)}%`;

    // Função para criar gráfico de barras em texto
    const criarGraficoBarras = (valor: number, maximo: number, largura: number = 20) => {
      const porcentagem = maximo > 0 ? (valor / maximo) * 100 : 0;
      const barras = Math.round((porcentagem / 100) * largura);
      return '█'.repeat(barras) + '░'.repeat(largura - barras) + ` ${porcentagem.toFixed(1)}%`;
    };

    // Função para análise de tendências
    const analisarTendencia = (valor: number, referencia: number) => {
      if (valor > referencia * 1.1) return '📈 Crescente';
      if (valor < referencia * 0.9) return '📉 Decrescente';
      return '➡️ Estável';
    };

    // Função para classificar performance
    const classificarPerformance = (percentual: number) => {
      if (percentual >= 20) return '🟢 Excelente';
      if (percentual >= 10) return '🟡 Boa';
      if (percentual >= 0) return '🟠 Regular';
      return '🔴 Crítica';
    };

    let dados = [];

    switch (tipoRelatorio) {
      case 'DRE - Demonstrativo de Resultado':
        const margemContribuicao = dadosRelatorio.totalReceitas - dadosRelatorio.custosVariaveis;
        const rentabilidade = dadosRelatorio.totalReceitas > 0 ? ((dadosRelatorio.lucroOperacional - dadosRelatorio.investimentos) / dadosRelatorio.totalReceitas * 100) : 0;
        
        dados = [
          ['📊 DRE - DEMONSTRATIVO DE RESULTADO'],
          [''],
          ['📅 Período:', periodo],
          ['📆 Data:', new Date().toLocaleDateString('pt-BR')],
          ['⏰ Hora:', new Date().toLocaleTimeString('pt-BR')],
          [''],
          ['📋 RECEITAS OPERACIONAIS'],
          ['Receita Bruta', formatarMoeda(dadosRelatorio.totalReceitas)],
          ['Receitas Não Operacionais', formatarMoeda(0)],
          ['Total de Receitas', formatarMoeda(dadosRelatorio.totalReceitas)],
          [''],
          ['📋 CUSTOS E DESPESAS OPERACIONAIS'],
          ['Custos Variáveis', formatarMoeda(dadosRelatorio.custosVariaveis)],
          ['Despesas Fixas', formatarMoeda(dadosRelatorio.despesasFixas)],
          ['Total de Custos e Despesas', formatarMoeda(dadosRelatorio.totalDespesas)],
          [''],
          ['📋 RESULTADO OPERACIONAL'],
          ['Margem de Contribuição', formatarMoeda(margemContribuicao)],
          ['Lucro Operacional', formatarMoeda(dadosRelatorio.lucroOperacional)],
          [''],
          ['📋 INVESTIMENTOS E RESULTADO LÍQUIDO'],
          ['Investimentos', formatarMoeda(dadosRelatorio.investimentos)],
          ['Resultado Líquido', formatarMoeda(dadosRelatorio.lucroOperacional - dadosRelatorio.investimentos)],
          [''],
          ['📋 INDICADORES DE PERFORMANCE'],
          ['Margem de Contribuição %', formatarPercentual(dadosRelatorio.totalReceitas > 0 ? (margemContribuicao / dadosRelatorio.totalReceitas * 100) : 0)],
          ['Lucro Operacional %', formatarPercentual(dadosRelatorio.totalReceitas > 0 ? (dadosRelatorio.lucroOperacional / dadosRelatorio.totalReceitas * 100) : 0)],
          ['Rentabilidade %', formatarPercentual(rentabilidade)],
          [''],
          ['📋 ANÁLISE GRÁFICA'],
          ['Receitas', criarGraficoBarras(dadosRelatorio.totalReceitas, dadosRelatorio.totalReceitas + dadosRelatorio.totalDespesas)],
          ['Custos Variáveis', criarGraficoBarras(dadosRelatorio.custosVariaveis, dadosRelatorio.totalReceitas + dadosRelatorio.totalDespesas)],
          ['Despesas Fixas', criarGraficoBarras(dadosRelatorio.despesasFixas, dadosRelatorio.totalReceitas + dadosRelatorio.totalDespesas)],
          ['Investimentos', criarGraficoBarras(dadosRelatorio.investimentos, dadosRelatorio.totalReceitas + dadosRelatorio.totalDespesas)],
          [''],
          ['📋 CLASSIFICAÇÃO DE PERFORMANCE'],
          ['Performance Geral', classificarPerformance(rentabilidade)],
          ['Tendência Receitas', analisarTendencia(dadosRelatorio.totalReceitas, dadosRelatorio.totalDespesas)],
          ['Eficiência Operacional', dadosRelatorio.totalReceitas > 0 ? (margemContribuicao / dadosRelatorio.totalReceitas * 100 > 30 ? '🟢 Alta' : margemContribuicao / dadosRelatorio.totalReceitas * 100 > 15 ? '🟡 Média' : '🔴 Baixa') : 'N/A'],
          [''],
          ['📈 Relatório gerado automaticamente pelo sistema ZapFinance']
        ];
        break;

      case 'Análise de Despesas':
        const maiorCategoria = dadosRelatorio.custosVariaveis > dadosRelatorio.despesasFixas ? 'Custos Variáveis' : 'Despesas Fixas';
        const menorCategoria = dadosRelatorio.investimentos < Math.min(dadosRelatorio.custosVariaveis, dadosRelatorio.despesasFixas) ? 'Investimentos' : (dadosRelatorio.custosVariaveis < dadosRelatorio.despesasFixas ? 'Custos Variáveis' : 'Despesas Fixas');
        const proporcaoFixasVariaveis = dadosRelatorio.custosVariaveis > 0 ? (dadosRelatorio.despesasFixas / dadosRelatorio.custosVariaveis).toFixed(2) : 'N/A';
        
        dados = [
          ['📊 ANÁLISE DE DESPESAS'],
          [''],
          ['📅 Período:', periodo],
          ['📆 Data:', new Date().toLocaleDateString('pt-BR')],
          ['⏰ Hora:', new Date().toLocaleTimeString('pt-BR')],
          [''],
          ['📋 CLASSIFICAÇÃO DAS DESPESAS'],
          ['Despesas Fixas', formatarMoeda(dadosRelatorio.despesasFixas)],
          ['Custos Variáveis', formatarMoeda(dadosRelatorio.custosVariaveis)],
          ['Investimentos', formatarMoeda(dadosRelatorio.investimentos)],
          ['Total de Despesas', formatarMoeda(dadosRelatorio.totalDespesas)],
          [''],
          ['📋 PARTICIPAÇÃO PERCENTUAL'],
          ['Despesas Fixas %', formatarPercentual(dadosRelatorio.totalDespesas > 0 ? (dadosRelatorio.despesasFixas / dadosRelatorio.totalDespesas * 100) : 0)],
          ['Custos Variáveis %', formatarPercentual(dadosRelatorio.totalDespesas > 0 ? (dadosRelatorio.custosVariaveis / dadosRelatorio.totalDespesas * 100) : 0)],
          ['Investimentos %', formatarPercentual(dadosRelatorio.totalDespesas > 0 ? (dadosRelatorio.investimentos / dadosRelatorio.totalDespesas * 100) : 0)],
          [''],
          ['📋 ANÁLISE GRÁFICA'],
          ['Despesas Fixas', criarGraficoBarras(dadosRelatorio.despesasFixas, dadosRelatorio.totalDespesas)],
          ['Custos Variáveis', criarGraficoBarras(dadosRelatorio.custosVariaveis, dadosRelatorio.totalDespesas)],
          ['Investimentos', criarGraficoBarras(dadosRelatorio.investimentos, dadosRelatorio.totalDespesas)],
          [''],
          ['📋 ANÁLISE DE COMPOSIÇÃO'],
          ['Maior Categoria', maiorCategoria],
          ['Menor Categoria', menorCategoria],
          ['Proporção Fixas/Variáveis', proporcaoFixasVariaveis],
          [''],
          ['📋 INDICADORES DE EFICIÊNCIA'],
          ['Concentração de Custos', dadosRelatorio.totalDespesas > 0 ? (Math.max(dadosRelatorio.despesasFixas, dadosRelatorio.custosVariaveis, dadosRelatorio.investimentos) / dadosRelatorio.totalDespesas * 100).toFixed(1) + '%' : 'N/A'],
          ['Diversificação', dadosRelatorio.totalDespesas > 0 ? (dadosRelatorio.investimentos / dadosRelatorio.totalDespesas * 100 > 10 ? '🟢 Boa' : '🟡 Baixa') : 'N/A'],
          ['Flexibilidade', dadosRelatorio.custosVariaveis > dadosRelatorio.despesasFixas ? '🟢 Alta' : '🟡 Baixa'],
          [''],
          ['📋 RECOMENDAÇÕES'],
          ['Foco Principal', maiorCategoria === 'Custos Variáveis' ? '📉 Reduzir custos variáveis' : maiorCategoria === 'Despesas Fixas' ? '📊 Otimizar estrutura fixa' : '📈 Manter investimentos'],
          ['Prioridade', dadosRelatorio.investimentos / dadosRelatorio.totalDespesas * 100 < 5 ? '💡 Aumentar investimentos' : '✅ Manter proporção atual'],
          ['Estratégia', proporcaoFixasVariaveis !== 'N/A' && parseFloat(proporcaoFixasVariaveis) > 1 ? '🔄 Revisar estrutura de custos' : '✅ Estrutura equilibrada'],
          [''],
          ['📊 Relatório gerado automaticamente pelo sistema ZapFinance']
        ];
        break;

      case 'Fluxo de Caixa':
        const fluxoOperacional = dadosRelatorio.totalReceitas - dadosRelatorio.custosVariaveis - dadosRelatorio.despesasFixas;
        const fluxoLiquido = dadosRelatorio.totalReceitas - dadosRelatorio.totalDespesas;
        const capacidadeGeracao = dadosRelatorio.totalDespesas > 0 ? (dadosRelatorio.totalReceitas / dadosRelatorio.totalDespesas) : 0;
        const coberturaDespesas = dadosRelatorio.totalDespesas > 0 ? (dadosRelatorio.totalReceitas / dadosRelatorio.totalDespesas) : 0;
        const margemSeguranca = dadosRelatorio.totalReceitas > 0 ? ((dadosRelatorio.totalReceitas - dadosRelatorio.totalDespesas) / dadosRelatorio.totalReceitas * 100) : 0;
        
        dados = [
          ['💰 FLUXO DE CAIXA'],
          [''],
          ['📅 Período:', periodo],
          ['📆 Data:', new Date().toLocaleDateString('pt-BR')],
          ['⏰ Hora:', new Date().toLocaleTimeString('pt-BR')],
          [''],
          ['📋 MOVIMENTAÇÕES FINANCEIRAS'],
          ['Entradas (Receitas)', formatarMoeda(dadosRelatorio.totalReceitas)],
          ['Saídas (Despesas)', formatarMoeda(dadosRelatorio.totalDespesas)],
          ['Saldo Líquido', formatarMoeda(fluxoLiquido)],
          [''],
          ['📋 DETALHAMENTO DAS SAÍDAS'],
          ['Despesas Fixas', formatarMoeda(dadosRelatorio.despesasFixas)],
          ['Custos Variáveis', formatarMoeda(dadosRelatorio.custosVariaveis)],
          ['Investimentos', formatarMoeda(dadosRelatorio.investimentos)],
          [''],
          ['📋 ANÁLISE GRÁFICA'],
          ['Entradas', criarGraficoBarras(dadosRelatorio.totalReceitas, dadosRelatorio.totalReceitas + dadosRelatorio.totalDespesas)],
          ['Saídas', criarGraficoBarras(dadosRelatorio.totalDespesas, dadosRelatorio.totalReceitas + dadosRelatorio.totalDespesas)],
          ['Saldo', criarGraficoBarras(Math.abs(fluxoLiquido), Math.max(dadosRelatorio.totalReceitas, dadosRelatorio.totalDespesas))],
          [''],
          ['📋 INDICADORES DE FLUXO'],
          ['Fluxo de Caixa Operacional', formatarMoeda(fluxoOperacional)],
          ['Fluxo de Caixa Líquido', formatarMoeda(fluxoLiquido)],
          ['Capacidade de Geração de Caixa', formatarPercentual(capacidadeGeracao * 100)],
          [''],
          ['📋 ANÁLISE DE LIQUIDEZ'],
          ['Cobertura de Despesas', coberturaDespesas.toFixed(2) + 'x'],
          ['Margem de Segurança', formatarPercentual(margemSeguranca)],
          ['Capacidade de Investimento', dadosRelatorio.totalReceitas > 0 ? formatarPercentual((dadosRelatorio.investimentos / dadosRelatorio.totalReceitas) * 100) : 'N/A'],
          [''],
          ['📋 CLASSIFICAÇÃO DE SAÚDE FINANCEIRA'],
          ['Saúde Geral', fluxoLiquido > 0 ? '🟢 Saudável' : '🔴 Crítica'],
          ['Capacidade Operacional', fluxoOperacional > 0 ? '🟢 Positiva' : '🔴 Negativa'],
          ['Sustentabilidade', margemSeguranca > 20 ? '🟢 Alta' : margemSeguranca > 10 ? '🟡 Média' : '🔴 Baixa'],
          [''],
          ['📋 RECOMENDAÇÕES'],
          ['Ação Imediata', fluxoLiquido < 0 ? '🚨 Reduzir despesas urgentemente' : '✅ Manter controle atual'],
          ['Estratégia de Crescimento', margemSeguranca > 30 ? '📈 Aumentar investimentos' : '📊 Manter reservas'],
          ['Foco Operacional', fluxoOperacional < 0 ? '⚡ Otimizar operações' : '✅ Operação eficiente'],
          [''],
          ['💰 Relatório gerado automaticamente pelo sistema ZapFinance']
        ];
        break;

      default:
        // Relatório geral
        const margemContribuicaoGeral = dadosRelatorio.totalReceitas - dadosRelatorio.custosVariaveis;
        const rentabilidadeGeral = dadosRelatorio.totalReceitas > 0 ? ((dadosRelatorio.lucroOperacional - dadosRelatorio.investimentos) / dadosRelatorio.totalReceitas * 100) : 0;
        
        dados = [
          ['📊 RELATÓRIO GERAL'],
          [''],
          ['📅 Período:', periodo],
          ['📆 Data:', new Date().toLocaleDateString('pt-BR')],
          ['⏰ Hora:', new Date().toLocaleTimeString('pt-BR')],
          ['📋 Tipo:', tipoRelatorio],
          [''],
          ['📋 RESUMO FINANCEIRO'],
          ['Receita Total', formatarMoeda(dadosRelatorio.totalReceitas)],
          ['Despesa Total', formatarMoeda(dadosRelatorio.totalDespesas)],
          ['Lucro Operacional', formatarMoeda(dadosRelatorio.lucroOperacional)],
          ['Resultado Líquido', formatarMoeda(dadosRelatorio.lucroOperacional - dadosRelatorio.investimentos)],
          [''],
          ['📋 DETALHAMENTO DE DESPESAS'],
          ['Despesas Fixas', formatarMoeda(dadosRelatorio.despesasFixas)],
          ['Custos Variáveis', formatarMoeda(dadosRelatorio.custosVariaveis)],
          ['Investimentos', formatarMoeda(dadosRelatorio.investimentos)],
          [''],
          ['📋 INDICADORES DE PERFORMANCE'],
          ['Margem de Contribuição', formatarMoeda(margemContribuicaoGeral)],
          ['Margem de Contribuição %', formatarPercentual(dadosRelatorio.totalReceitas > 0 ? (margemContribuicaoGeral / dadosRelatorio.totalReceitas * 100) : 0)],
          ['Lucro Operacional %', formatarPercentual(dadosRelatorio.totalReceitas > 0 ? (dadosRelatorio.lucroOperacional / dadosRelatorio.totalReceitas * 100) : 0)],
          ['Rentabilidade %', formatarPercentual(rentabilidadeGeral)],
          [''],
          ['📋 ANÁLISE DE VIABILIDADE'],
          ['Ponto de Equilíbrio', dadosRelatorio.custosVariaveis > 0 ? formatarMoeda(dadosRelatorio.despesasFixas / (1 - (dadosRelatorio.custosVariaveis / dadosRelatorio.totalReceitas))) : 'N/A'],
          ['Margem de Segurança', formatarPercentual(dadosRelatorio.totalReceitas > 0 ? ((dadosRelatorio.totalReceitas - (dadosRelatorio.despesasFixas / (1 - (dadosRelatorio.custosVariaveis / dadosRelatorio.totalReceitas)))) / dadosRelatorio.totalReceitas * 100) : 0)],
          [''],
          ['📈 Relatório gerado automaticamente pelo sistema ZapFinance']
        ];
    }

    // Adicionar dados ao worksheet
    XLSX.utils.sheet_add_aoa(worksheet, dados, { origin: 'A1' });

    // Configurar largura das colunas
    const colWidths = [
      { wch: 40 }, // Coluna A
      { wch: 30 }, // Coluna B
    ];
    worksheet['!cols'] = colWidths;

    const sheetName = tipoRelatorio.length > 31 ? tipoRelatorio.slice(0, 31) : tipoRelatorio;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar arquivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download do arquivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${tipoRelatorio.toLowerCase().replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análises e relatórios financeiros</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Julho 2025</span>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes-atual">Mês Atual</SelectItem>
                  <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="ano">Ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receitas">Receitas</SelectItem>
                  <SelectItem value="despesas">Despesas</SelectItem>
                  <SelectItem value="fluxo">Fluxo de Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato</label>
              <Select value={formato} onValueChange={setFormato}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                onClick={() => handleGerarRelatorio()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar Excel
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              DRE - Demonstrativo de Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Análise completa da receita, custos e lucro operacional
            </p>
            {(() => {
              const dadosRelatorio = calcularDadosRelatorio();
              if (!dadosRelatorio) {
                return (
                  <div className="text-sm text-muted-foreground">
                    Carregando dados...
                  </div>
                );
              }
              return (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Receita Bruta:</span>
                      <span className="font-medium">{formatCurrency(dadosRelatorio.totalReceitas)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Lucro Operacional:</span>
                      <span className={`font-medium ${dadosRelatorio.lucroOperacional >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(dadosRelatorio.lucroOperacional)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Resultado Líquido:</span>
                      <span className={`font-medium ${dadosRelatorio.lucroOperacional >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(dadosRelatorio.lucroOperacional)}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => handleGerarRelatorio('DRE - Demonstrativo de Resultado')}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Excel
                      </>
                    )}
                  </Button>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-success" />
              Análise de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detalhamento das receitas por modalidade e categoria
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Débito:</span>
                <span className="font-medium">R$ 8.450,30</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Crédito:</span>
                <span className="font-medium">R$ 6.890,20</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>iFood:</span>
                <span className="font-medium">R$ 4.120,15</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => handleGerarRelatorio('Análise de Receitas')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-accent" />
              Análise de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Classificação das despesas por categoria e fornecedor
            </p>
            {(() => {
              const dadosRelatorio = calcularDadosRelatorio();
              if (!dadosRelatorio) {
                return (
                  <div className="text-sm text-muted-foreground">
                    Carregando dados...
                  </div>
                );
              }
              return (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Despesas Fixas:</span>
                      <span className="font-medium">{formatCurrency(dadosRelatorio.despesasFixas)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Custos Variáveis:</span>
                      <span className="font-medium">{formatCurrency(dadosRelatorio.custosVariaveis)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Investimentos:</span>
                      <span className="font-medium">{formatCurrency(dadosRelatorio.investimentos)}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => handleGerarRelatorio('Análise de Despesas')}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Gerar Excel
                      </>
                    )}
                  </Button>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-warning" />
              Fluxo de Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Movimentação financeira detalhada por banco
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Entradas:</span>
                <span className="font-medium text-success">R$ 18.450,75</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Saídas:</span>
                <span className="font-medium text-accent">R$ 15.890,20</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Saldo Líquido:</span>
                <span className="font-medium text-success">R$ 2.560,55</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => handleGerarRelatorio('Fluxo de Caixa')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Análise Horizontal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comparativo de desempenho dos últimos 12 meses
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Variação Receita:</span>
                <span className="font-medium text-success">+12,5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Variação Custos:</span>
                <span className="font-medium text-accent">+8,2%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Variação Lucro:</span>
                <span className="font-medium text-destructive">-5,8%</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => handleGerarRelatorio('Análise Horizontal')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Análise Vertical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Participação percentual de cada item no faturamento
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CMV:</span>
                <span className="font-medium">61%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Despesas Fixas:</span>
                <span className="font-medium">34%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Lucro Líquido:</span>
                <span className="font-medium">5%</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => handleGerarRelatorio('Análise Vertical')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Excel
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento e Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalhamento */}
        <Card className="col-span-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-6 w-6 text-primary" />
                  Detalhamento
                </CardTitle>
                <CardDescription>
                  Análise detalhada de faturamento, custos e taxas
                </CardDescription>
              </div>
              <Button onClick={exportarDetalhamento} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando dados...</span>
              </div>
            ) : detalhamento ? (
              <div className="space-y-6">
                {/* Faturamento */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800 bg-yellow-100 p-2 rounded">Faturamento</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-yellow-200">
                          <th className="text-left p-2 font-bold text-sm">Faturamento</th>
                          <th className="text-right p-2 font-bold text-sm">%Part</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalhamento.faturamento.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-muted/30">
                            <td className="p-2 text-sm">{item.categoria}</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(item.valor)}</td>
                            <td className="p-2 text-right text-sm">{item.percentual.toFixed(0)}%</td>
                          </tr>
                        ))}
                        <tr className="bg-yellow-100 font-bold">
                          <td className="p-2 text-sm">FATURAMENTO TOTAL</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(detalhamento.faturamento.total)}</td>
                          <td className="p-2 text-right text-sm">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Custo Variável */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-800 bg-blue-100 p-2 rounded">Custo Variável</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-blue-200">
                          <th className="text-left p-2 font-bold text-sm">Soma de Valor</th>
                          <th className="text-right p-2 font-bold text-sm">Variação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalhamento.custoVariavel.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-muted/30">
                            <td className="p-2 text-sm">{item.categoria}</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(item.valor)}</td>
                            <td className="p-2 text-right text-sm">{item.variacao}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-100 font-bold">
                          <td className="p-2 text-sm">CUSTO VARIÁVEL TOTAL</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(detalhamento.custoVariavel.total)}</td>
                          <td className="p-2 text-right text-sm"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Soma de Taxa */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-800 bg-green-100 p-2 rounded">Soma de Taxa</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-green-200">
                          <th className="text-left p-2 font-bold text-sm">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalhamento.taxas.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b hover:bg-muted/30">
                            <td className="p-2 text-sm">{item.categoria}</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(item.valor)}</td>
                          </tr>
                        ))}
                        <tr className="bg-green-100 font-bold">
                          <td className="p-2 text-sm">TOTAL TAXAS</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(detalhamento.taxas.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 */}
        <Card className="col-span-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Top 5
                </CardTitle>
                <CardDescription>
                  Maiores receitas e despesas do mês
                </CardDescription>
              </div>
              <Button onClick={exportarTop5} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando dados...</span>
              </div>
            ) : top5 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 5 Receitas */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-800 bg-green-100 p-2 rounded">Top 5 Receitas</h3>
                  <div className="space-y-2">
                    {top5.receitas.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold text-sm">
                            {item.posicao}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{item.descricao}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(item.data).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(item.valor)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 5 Despesas */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-800 bg-red-100 p-2 rounded">Top 5 Despesas</h3>
                  <div className="space-y-2">
                    {top5.despesas.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-200 rounded-full flex items-center justify-center text-red-800 font-bold text-sm">
                            {item.posicao}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{item.descricao}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.categoria} • {new Date(item.data).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{formatCurrency(item.valor)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Relatório Comparativo Mensal */}
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-6 w-6 text-primary" />
                Relatório Comparativo Mensal
              </CardTitle>
              <CardDescription>
                Análise detalhada dos indicadores financeiros por mês
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={mesesComparacao.toString()} onValueChange={(value) => setMesesComparacao(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportarRelatorioComparativo} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando dados...</span>
            </div>
          ) : relatorioComparativo && relatorioComparativo.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-sm">Indicadores</th>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <th key={index} className="text-center p-3 font-medium text-sm border-l">
                        <div className="text-xs text-muted-foreground mb-1">{mes.mes}</div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span>Valores</span>
                          <span>A/H</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Faturamento */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-sm">Faturamento</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className="font-medium">{formatCurrency(mes.faturamento)}</div>
                        <div className="text-xs text-muted-foreground">100%</div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.faturamento >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mes.variacaoMensal.faturamento >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.faturamento).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Custo Variável */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-sm">Custo Variável</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className="font-medium">{formatCurrency(mes.custoVariavel)}</div>
                        <div className="text-xs text-muted-foreground">{mes.percentualCustoVariavel.toFixed(1)}%</div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.custoVariavel >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {mes.variacaoMensal.custoVariavel >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.custoVariavel).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Margem de Contribuição */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-sm">Margem de Contribuição</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className="font-medium">{formatCurrency(mes.margemContribuicao)}</div>
                        <div className="text-xs text-muted-foreground">{mes.percentualMargemContribuicao.toFixed(1)}%</div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.margemContribuicao >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mes.variacaoMensal.margemContribuicao >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.margemContribuicao).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Despesa Fixa */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-sm">Despesa Fixa</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className="font-medium">{formatCurrency(mes.despesaFixa)}</div>
                        <div className="text-xs text-muted-foreground">{mes.percentualDespesaFixa.toFixed(1)}%</div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.despesaFixa >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {mes.variacaoMensal.despesaFixa >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.despesaFixa).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Lucro Operacional Antes Investimentos */}
                  <tr className="border-b hover:bg-muted/30 bg-blue-50">
                    <td className="p-3 font-bold text-sm text-blue-800">LUCRO OPERACIONAL ANTES INVESTIMENTOS</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className={`font-bold ${mes.lucroOperacionalAntesInvestimentos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(mes.lucroOperacionalAntesInvestimentos)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mes.faturamento > 0 ? ((mes.lucroOperacionalAntesInvestimentos / mes.faturamento) * 100).toFixed(1) : 0}%
                        </div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.lucroOperacional >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mes.variacaoMensal.lucroOperacional >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.lucroOperacional).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Investimentos */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium text-sm">Investimentos</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className="font-medium">{formatCurrency(mes.investimentos)}</div>
                        <div className="text-xs text-muted-foreground">{mes.percentualInvestimentos.toFixed(1)}%</div>
                        {mes.variacaoMensal && (
                          <div className="text-xs flex items-center justify-center gap-1 mt-1 text-blue-600">
                            <Circle className="h-3 w-3" />
                            {Math.abs(mes.variacaoMensal.investimentos).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Lucro Operacional */}
                  <tr className="border-b hover:bg-muted/30 bg-green-50">
                    <td className="p-3 font-bold text-sm text-green-800">LUCRO OPERACIONAL</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className={`font-bold ${mes.lucroOperacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(mes.lucroOperacional)}
                        </div>
                        <div className="text-xs text-muted-foreground">{mes.percentualLucroOperacional.toFixed(1)}%</div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.lucroOperacional >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mes.variacaoMensal.lucroOperacional >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.lucroOperacional).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Movimentações Não Operacionais */}
                  <tr className="border-b hover:bg-muted/30 bg-orange-50">
                    <td className="p-3 font-bold text-sm text-orange-800">MOVIMENTAÇÕES NÃO OPERACIONAIS</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className={`font-bold ${mes.movimentacoesNaoOperacionais >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(mes.movimentacoesNaoOperacionais)}
                        </div>
                        <div className="text-xs text-muted-foreground">{mes.percentualMovimentacoesNaoOperacionais.toFixed(1)}%</div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.movimentacoesNaoOperacionais >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mes.variacaoMensal.movimentacoesNaoOperacionais >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.movimentacoesNaoOperacionais).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Resultado Líquido */}
                  <tr className="border-b hover:bg-muted/30 bg-purple-50">
                    <td className="p-3 font-bold text-sm text-purple-800">RESULTADO LÍQUIDO</td>
                    {relatorioComparativo.map((mes: any, index: number) => (
                      <td key={index} className="text-center p-3 border-l">
                        <div className={`font-bold ${mes.resultadoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(mes.resultadoLiquido)}
                        </div>
                        <div className="text-xs text-muted-foreground">{mes.percentualResultadoLiquido.toFixed(1)}%</div>
                        {mes.variacaoMensal && (
                          <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${
                            mes.variacaoMensal.resultadoLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {mes.variacaoMensal.resultadoLiquido >= 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )}
                            {Math.abs(mes.variacaoMensal.resultadoLiquido).toFixed(1)}%
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">DRE - Junho 2025</div>
                  <div className="text-sm text-muted-foreground">Gerado em 15/07/2025 às 14:30</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-success" />
                <div>
                  <div className="font-medium">Análise de Receitas - Junho 2025</div>
                  <div className="text-sm text-muted-foreground">Gerado em 10/07/2025 às 09:15</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div>
                  <div className="font-medium">Fluxo de Caixa - Maio 2025</div>
                  <div className="text-sm text-muted-foreground">Gerado em 05/06/2025 às 16:45</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}