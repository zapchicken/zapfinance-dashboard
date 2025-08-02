import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, TrendingUp, DollarSign, BarChart3, Calendar, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState("mes-atual");
  const [tipo, setTipo] = useState("todos");
  const [formato, setFormato] = useState("excel");
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do Supabase
      const { data: receitas } = await supabase
        .from('contas_receber')
        .select('*')
        .order('data_vencimento');

      const { data: despesas } = await supabase
        .from('contas_pagar')
        .select('*')
        .order('data_vencimento');

      const { data: categorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true);

      setDados({ receitas: receitas || [], despesas: despesas || [], categorias: categorias || [] });
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