import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReceitas } from "@/hooks/useReceitas";
import { useContasPagar } from "@/hooks/useContasPagar";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  AlertTriangle,
  Calendar,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Receipt
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import FaturamentoChart from "@/components/FaturamentoChart";

interface Banco {
  id: string;
  nome: string;
  saldo_inicial: number;
  saldo_atual: number;
  tipo: string;
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: 'Pendente' | 'Pago';
}

interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  status: 'Pendente' | 'Recebido';
  tipo_receita: string;
  taxa_cartao_credito: number | null;
  taxa_boleto: number | null;
  taxa_percentual?: number;
  valor_taxa?: number;
  valor_liquido?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: receitas } = useReceitas(user?.id);
  const { data: contasPagar } = useContasPagar(user?.id);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [categoriasDespesas, setCategoriasDespesas] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch bancos
  const fetchBancos = async () => {
    if (!user) return;
    const { data } = await supabase.from("bancos").select("*").eq("user_id", user.id);
    setBancos(data as Banco[] || []);
  };

  // Fetch categorias de despesas
  const fetchCategoriasDespesas = async () => {
    if (!user) return;
    const { data } = await supabase.from("categorias").select("*").eq("tipo", "despesa");
    setCategoriasDespesas(data || []);
  };

  useEffect(() => {
    fetchBancos();
    fetchCategoriasDespesas();
  }, [user]);

  const {
    totalReceitas,
    custosVariaveis,
    margemContribuicao,
    despesasFixas,
    lucroOperacional,
    investimentos,
    resultadoLiquido,
    receitaNaoOperacional,
    despesaNaoOperacional,
    resultadoNaoOperacional,
    totalTarifasModalidades,
    custosOperacionais,
    outrosInvestimentos,
    investimentosIfood,
    percentualMargemContribuicao,
    pontoEquilibrio,
    diferencaEquilibrio,
    fatMinimoDiario,
    diasUteis,
    contasVencendoHoje,
    aReceberProximos7Dias,
    aPagarProximos7Dias
  } = useMemo(() => {
    const primeiroDia = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const ultimoDia = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

    console.log('Mês selecionado:', selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
    console.log('Primeiro dia do mês:', primeiroDia);
    console.log('Último dia do mês:', ultimoDia);

    const receitasMesAtual = (receitas || []).filter(r => {
      const dataReceita = new Date(r.data_recebimento || r.data_vencimento);
      return dataReceita >= primeiroDia && dataReceita <= ultimoDia;
    });

    console.log('Receitas filtradas para o mês atual (\'receitasMesAtual\'):', receitasMesAtual);
    console.log('📅 Debug datas das receitas:', receitasMesAtual.map(r => ({
      descricao: r.descricao,
      data_vencimento: r.data_vencimento,
      data_recebimento: r.data_recebimento,
      data_usada: r.data_recebimento || r.data_vencimento
    })));

    const despesasMesAtual = (contasPagar || []).filter(d => {
      // Criar data no fuso horário local para evitar problemas de fuso
      const [ano, mes, dia] = d.data_vencimento.split('-').map(Number);
      const dataDespesa = new Date(ano, mes - 1, dia, 12, 0, 0); // Meio-dia para garantir
      const dentroDoPeriodo = dataDespesa >= primeiroDia && dataDespesa <= ultimoDia;
      
      console.log('🔍 Debug despesa:', {
        descricao: d.descricao,
        data_vencimento: d.data_vencimento,
        dataDespesa: dataDespesa.toLocaleDateString('pt-BR'),
        primeiroDia: primeiroDia.toLocaleDateString('pt-BR'),
        ultimoDia: ultimoDia.toLocaleDateString('pt-BR'),
        dentroDoPeriodo: dentroDoPeriodo
      });
      
      return dentroDoPeriodo;
    });

    console.log('📋 Debug despesas:', {
      totalContasPagar: contasPagar?.length || 0,
      despesasMesAtual: despesasMesAtual.length,
      despesas: despesasMesAtual.map(d => ({
        descricao: d.descricao,
        valor: d.valor,
        data_vencimento: d.data_vencimento,
        categoria_id: d.categoria_id
      }))
    });

    console.log('🔍 SIMPLES - Contas a pagar:', contasPagar?.length || 0);
    console.log('🔍 SIMPLES - Despesas do mês:', despesasMesAtual.length);
    
    // Debug detalhado da conta a pagar
    console.log('🔍 DEBUG - ContasPagar existe?', !!contasPagar);
    console.log('🔍 DEBUG - ContasPagar length:', contasPagar?.length);
    
    if (contasPagar && contasPagar.length > 0) {
      console.log('📋 Detalhes da conta a pagar:', contasPagar.map(cp => ({
        descricao: cp.descricao,
        valor: cp.valor,
        data_vencimento: cp.data_vencimento,
        categoria_id: cp.categoria_id,
        dataFormatada: new Date(cp.data_vencimento).toLocaleDateString('pt-BR'),
        dentroDoPeriodo: new Date(cp.data_vencimento) >= primeiroDia && new Date(cp.data_vencimento) <= ultimoDia
      })));
    }

    const totalReceitas = (receitasMesAtual || []).reduce((sum, r) => sum + r.valor, 0);

    const totalTarifasModalidades = (receitasMesAtual || []).reduce((sum, r) => {
      // Usar o campo valor_taxa que já está calculado
      const valorTaxa = (r as any).valor_taxa || 0;
      
      // Debug log para taxas
      if (valorTaxa > 0) {
        console.log('💰 Taxa encontrada:', {
          descricao: r.descricao,
          valor: r.valor,
          taxa_percentual: (r as any).taxa_percentual,
          valor_taxa: valorTaxa
        });
      }
      
      return sum + valorTaxa;
    }, 0);

          console.log('📊 Resumo Taxas Modalidades:', {
        totalTarifasModalidades: totalTarifasModalidades,
        receitasComTaxa: (receitasMesAtual || []).filter(r => (r as any).valor_taxa > 0).map(r => ({
          descricao: r.descricao,
          valor: r.valor,
          valor_taxa: (r as any).valor_taxa
        }))
      });

    const despesasFixas = (despesasMesAtual || []).filter(d => {
      const categoria = categoriasDespesas.find(cat => cat.id === d.categoria_id);
      const isDespesaFixa = categoria?.categoria === 'Despesa Fixa';
      
      if (isDespesaFixa) {
        console.log('💰 Despesa Fixa encontrada:', {
          descricao: d.descricao,
          valor: d.valor,
          categoria: categoria?.categoria,
          categoria_id: d.categoria_id
        });
      }
      
      return isDespesaFixa;
    }).reduce((sum, d) => sum + d.valor, 0);

    console.log('📊 Debug categorias:', {
      totalCategoriasDespesas: categoriasDespesas.length,
      categorias: categoriasDespesas.map(cat => ({
        id: cat.id,
        nome: cat.nome,
        categoria: cat.categoria
      }))
    });

    const custosOperacionais = (despesasMesAtual || []).filter(d => {
      const categoria = categoriasDespesas.find(cat => cat.id === d.categoria_id);
      const isCustoOperacional = categoria?.categoria === 'Custo Variável';
      
      if (isCustoOperacional) {
        console.log('💰 Custo Operacional encontrado:', {
          descricao: d.descricao,
          valor: d.valor,
          categoria: categoria?.categoria,
          categoria_id: d.categoria_id,
          data_vencimento: d.data_vencimento
        });
      }
      
      return isCustoOperacional;
    }).reduce((sum, d) => sum + d.valor, 0);

    console.log('📊 Debug Custos Operacionais:', {
      totalDespesasMes: despesasMesAtual.length,
      custosOperacionais: custosOperacionais,
      despesasComCategoria: despesasMesAtual.map(d => ({
        descricao: d.descricao,
        valor: d.valor,
        categoria_id: d.categoria_id,
        categoria: categoriasDespesas.find(cat => cat.id === d.categoria_id)?.categoria
      }))
    });

    const custosVariaveis = custosOperacionais + totalTarifasModalidades;
    
    // Total de investimentos = Outros Investimentos + Ifood Voucher
    const outrosInvestimentos = (despesasMesAtual || []).filter(d => {
      const categoria = categoriasDespesas.find(cat => cat.id === d.categoria_id);
      return categoria?.categoria === 'Investimento';
    }).reduce((sum, d) => sum + d.valor, 0);

    // Debug: verificar todas as receitas
            console.log('📋 Todas as receitas do mês:', {
          total: receitasMesAtual?.length || 0,
          receitas: receitasMesAtual?.map(r => ({
            descricao: r.descricao,
            valor: r.valor,
            tipo_receita: (r as any).tipo_receita,
            data_vencimento: r.data_vencimento
          })) || []
        });

    const investimentosIfood = (receitasMesAtual || []).filter(r => {
      // Verificar se é APENAS "Ifood Voucher" (não "Ifood" sozinho)
      const descricaoLower = r.descricao.toLowerCase();
      const isIfoodVoucher = descricaoLower === 'ifood voucher' || 
                            descricaoLower.includes('ifood voucher');
      
      // Debug log para todas as receitas
              console.log('🔍 Verificando receita:', {
          descricao: r.descricao,
          descricaoLower: descricaoLower,
          valor: r.valor,
          cliente_nome: r.cliente_nome,
          tipo_receita: (r as any).tipo_receita,
          isIfoodVoucher: isIfoodVoucher
        });
      
              if (isIfoodVoucher) {
          console.log('✅ Receita Ifood Voucher encontrada:', {
            descricao: r.descricao,
            valor: r.valor,
            cliente_nome: r.cliente_nome,
            tipo_receita: (r as any).tipo_receita
          });
        }
      
      return isIfoodVoucher;
    }).reduce((sum, r) => sum + r.valor, 0);

    console.log('📊 Resumo Ifood Voucher:', {
      totalReceitas: receitasMesAtual?.length || 0,
      investimentosIfood: investimentosIfood,
      receitasFiltradas: (receitasMesAtual || []).filter(r => {
        const descricaoLower = r.descricao.toLowerCase();
        return descricaoLower === 'ifood voucher' || 
               descricaoLower.includes('ifood voucher');
      }).map(r => ({ descricao: r.descricao, valor: r.valor }))
    });

    const investimentos = outrosInvestimentos + investimentosIfood;

    // Debug logs
    console.log('Debug Investimentos:', {
      totalInvestimentos: investimentos,
      investimentosIfood: investimentosIfood,
      outrosInvestimentos: outrosInvestimentos,
      receitasMesAtual: receitasMesAtual?.length || 0,
      despesasMesAtual: despesasMesAtual?.length || 0
    });

    const margemContribuicao = totalReceitas - custosVariaveis;
    const lucroOperacional = margemContribuicao - despesasFixas;
    const resultadoLiquido = lucroOperacional - investimentos;

    // Receitas e despesas não operacionais
    const receitaNaoOperacional = (receitasMesAtual || []).filter(r => (r as any).tipo_receita === 'nao_operacional').reduce((sum, r) => sum + r.valor, 0);
    const despesaNaoOperacional = (despesasMesAtual || []).filter(d => {
      const categoria = categoriasDespesas.find(cat => cat.id === d.categoria_id);
      return categoria?.categoria === 'Despesa Não Operacional';
    }).reduce((sum, d) => sum + d.valor, 0);
    const resultadoNaoOperacional = receitaNaoOperacional - despesaNaoOperacional;

    // Cálculos para ponto de equilíbrio
    const percentualMargemContribuicao = totalReceitas > 0 ? (margemContribuicao / totalReceitas) * 100 : 0;
    const pontoEquilibrio = percentualMargemContribuicao > 0 ? despesasFixas / (percentualMargemContribuicao / 100) : 0;
    const diferencaEquilibrio = totalReceitas - pontoEquilibrio;
    const diasUteis = 22;
    const fatMinimoDiario = pontoEquilibrio > 0 ? pontoEquilibrio / diasUteis : 0;

    // Contas vencendo hoje
    const hoje = new Date();
    const hojeSemFuso = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const contasVencendoHoje = (contasPagar || []).filter(c => {
      // Criar data sem problemas de fuso horário
      const [ano, mes, dia] = c.data_vencimento.split('-').map(Number);
      const dataVencimento = new Date(ano, mes - 1, dia, 12, 0, 0);
      const dataVencimentoSemFuso = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate());
      return dataVencimentoSemFuso.getTime() === hojeSemFuso.getTime() && c.status === 'Pendente';
    }).length;

    // Contas a receber próximos 7 dias
    const proximos7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    const proximos7DiasSemFuso = new Date(proximos7Dias.getFullYear(), proximos7Dias.getMonth(), proximos7Dias.getDate());
    
    const aReceberProximos7Dias = (receitas || []).filter(r => {
      // Usar data_recebimento com fallback para data_vencimento
      const dataReferencia = r.data_recebimento || r.data_vencimento;
      const [ano, mes, dia] = dataReferencia.split('-').map(Number);
      const dataReceita = new Date(ano, mes - 1, dia, 12, 0, 0);
      const dataReceitaSemFuso = new Date(dataReceita.getFullYear(), dataReceita.getMonth(), dataReceita.getDate());
      return dataReceitaSemFuso >= hojeSemFuso && dataReceitaSemFuso <= proximos7DiasSemFuso && r.status === 'Pendente';
    }).reduce((sum, r) => sum + r.valor, 0);

    // Contas a pagar próximos 7 dias
    const aPagarProximos7Dias = (contasPagar || []).filter(c => {
      // Criar data sem problemas de fuso horário
      const [ano, mes, dia] = c.data_vencimento.split('-').map(Number);
      const dataVencimento = new Date(ano, mes - 1, dia, 12, 0, 0);
      const dataVencimentoSemFuso = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), dataVencimento.getDate());
      return dataVencimentoSemFuso >= hojeSemFuso && dataVencimentoSemFuso <= proximos7DiasSemFuso && c.status === 'Pendente';
    }).reduce((sum, c) => sum + c.valor, 0);

    // Debug para os cards
    console.log('🔍 Debug Cards:', {
      hoje: hojeSemFuso.toLocaleDateString('pt-BR'),
      proximos7Dias: proximos7DiasSemFuso.toLocaleDateString('pt-BR'),
      contasVencendoHoje,
      aReceberProximos7Dias,
      aPagarProximos7Dias,
      totalReceitas: receitas?.length || 0,
      totalContasPagar: contasPagar?.length || 0
    });

    // Debug detalhado das receitas
    if (receitas && receitas.length > 0) {
      console.log('📋 Debug Receitas para próximos 7 dias:', receitas.map(r => ({
        descricao: r.descricao,
        valor: r.valor,
        status: r.status,
        data_vencimento: r.data_vencimento,
        data_recebimento: r.data_recebimento,
        data_usada: r.data_recebimento || r.data_vencimento
      })));
    }

    // Debug detalhado das contas a pagar
    if (contasPagar && contasPagar.length > 0) {
      console.log('📋 Debug Contas a Pagar para próximos 7 dias:', contasPagar.map(c => ({
        descricao: c.descricao,
        valor: c.valor,
        status: c.status,
        data_vencimento: c.data_vencimento
      })));
    }

    return {
      totalReceitas,
      custosVariaveis,
      margemContribuicao,
      despesasFixas,
      lucroOperacional,
      investimentos,
      resultadoLiquido,
      receitaNaoOperacional,
      despesaNaoOperacional,
      resultadoNaoOperacional,
      totalTarifasModalidades,
      custosOperacionais,
      outrosInvestimentos,
      investimentosIfood,
      percentualMargemContribuicao,
      pontoEquilibrio,
      diferencaEquilibrio,
      fatMinimoDiario,
      diasUteis,
      contasVencendoHoje,
      aReceberProximos7Dias,
      aPagarProximos7Dias
    };
  }, [receitas, contasPagar, selectedMonth, categoriasDespesas]);

  const handlePreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const formatPercent = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(0) + "%" : "0%";
  };

  const getNumberColor = (value: number) =>
    value < 0 ? "text-destructive" : "text-foreground";

  const cardData = [
    {
      title: "Receita Bruta",
      value: formatCurrency(totalReceitas),
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      border: "border-l-primary",
      subtitle: "100% do faturamento"
    },
    {
      title: "Margem de Contribuição",
      value: formatCurrency(margemContribuicao),
      icon: <BarChart3 className="h-5 w-5 text-accent" />,
      border: "border-l-accent",
      subtitle: `${formatPercent(margemContribuicao, totalReceitas)} do faturamento`
    },
    {
      title: "Lucro Operacional",
      value: formatCurrency(lucroOperacional),
      icon: <DollarSign className="h-5 w-5 text-success" />,
      border: "border-l-success",
      subtitle: `${formatPercent(lucroOperacional, totalReceitas)} do faturamento`
    },
    {
      title: "Resultado Líquido",
      value: formatCurrency(resultadoLiquido),
      icon: <PiggyBank className="h-5 w-5 text-destructive" />,
      border: "border-l-destructive",
      subtitle: `${formatPercent(Math.abs(resultadoLiquido), totalReceitas)} do faturamento`,
      colorClass: getNumberColor(resultadoLiquido)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header com navegação de mês */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral das finanças da ZapChicken</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((card, idx) => (
          <Card key={idx} className={`border-l-4 ${card.border} hover:shadow-lg transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.colorClass ?? 'text-foreground'} text-nowrap`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-nowrap">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DRE estilizado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex gap-2 items-center">
            <BarChart3 className="h-5 w-5" /> Demonstrativo de Resultado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-12 gap-4 border-b pb-2">
            <div className="col-span-6 font-semibold">Receita Operacional Bruta</div>
            <div className="col-span-3 text-right font-bold">{formatCurrency(totalReceitas)}</div>
            <div className="col-span-3 text-right text-muted-foreground">100%</div>
          </div>

          <div className="grid grid-cols-12 gap-4 border-b pb-2">
            <div className="col-span-6 text-red-600 font-semibold">Custos Variáveis</div>
            <div className="col-span-3 text-right font-bold text-red-600">{formatCurrency(custosVariaveis)}</div>
            <div className="col-span-3 text-right text-red-600">{formatPercent(custosVariaveis, totalReceitas)}</div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="custos">
              <AccordionTrigger className="text-red-600 font-semibold text-sm">
                Ver detalhamento dos custos variáveis
              </AccordionTrigger>
              <AccordionContent className="pl-4 space-y-1">
                <div className="grid grid-cols-12 gap-4 text-muted-foreground">
                  <div className="col-span-6">Custos Operacionais (sem fixas)</div>
                  <div className="col-span-3 text-right">{formatCurrency(custosOperacionais)}</div>
                  <div className="col-span-3 text-right">{formatPercent(custosOperacionais, totalReceitas)}</div>
                </div>
                <div className="grid grid-cols-12 gap-4 text-muted-foreground">
                  <div className="col-span-6">Taxas Modalidades</div>
                  <div className="col-span-3 text-right">{formatCurrency(totalTarifasModalidades)}</div>
                  <div className="col-span-3 text-right">{formatPercent(totalTarifasModalidades, totalReceitas)}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="grid grid-cols-12 gap-4 border-t pt-2">
            <div className="col-span-6 text-green-600 font-semibold">Margem de Contribuição</div>
            <div className="col-span-3 text-right font-bold text-green-600">{formatCurrency(margemContribuicao)}</div>
            <div className="col-span-3 text-right text-green-600">{formatPercent(margemContribuicao, totalReceitas)}</div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 text-destructive font-semibold">Despesa Fixa</div>
            <div className="col-span-3 text-right font-bold text-destructive">{formatCurrency(despesasFixas)}</div>
            <div className="col-span-3 text-right text-destructive">{formatPercent(despesasFixas, totalReceitas)}</div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6 text-green-600 font-semibold">Lucro Operacional</div>
            <div className="col-span-3 text-right font-bold text-green-600">{formatCurrency(lucroOperacional)}</div>
            <div className="col-span-3 text-right text-green-600">{formatPercent(lucroOperacional, totalReceitas)}</div>
          </div>

          <div className="grid grid-cols-12 gap-4 border-b pb-2">
            <div className="col-span-6 text-destructive font-semibold">Investimentos</div>
            <div className="col-span-3 text-right font-bold text-destructive">{formatCurrency(investimentos)}</div>
            <div className="col-span-3 text-right text-destructive">{formatPercent(investimentos, totalReceitas)}</div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="investimentos">
              <AccordionTrigger className="text-destructive font-semibold text-sm">
                Ver detalhamento dos investimentos
              </AccordionTrigger>
              <AccordionContent className="pl-4 space-y-1">
                <div className="grid grid-cols-12 gap-4 text-muted-foreground">
                  <div className="col-span-6">Outros Investimentos</div>
                  <div className="col-span-3 text-right">{formatCurrency(outrosInvestimentos)}</div>
                  <div className="col-span-3 text-right">{formatPercent(outrosInvestimentos, totalReceitas)}</div>
                </div>
                <div className="grid grid-cols-12 gap-4 text-muted-foreground">
                  <div className="col-span-6">Ifood Voucher</div>
                  <div className="col-span-3 text-right">{formatCurrency(investimentosIfood)}</div>
                  <div className="col-span-3 text-right">{formatPercent(investimentosIfood, totalReceitas)}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-muted/10 p-4 rounded-lg mt-4 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-6 font-bold text-green-700 text-lg">Resultado Líquido</div>
            <div className="col-span-3 text-right text-lg font-bold text-green-700">
              {formatCurrency(resultadoLiquido)}
            </div>
            <div className="col-span-3 text-right font-semibold text-green-700">
              {formatPercent(resultadoLiquido, totalReceitas)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ponto de Equilíbrio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex gap-2 items-center">
            <Target className="h-5 w-5" /> Ponto de Equilíbrio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Ponto de Equilíbrio</span>
              <span className="font-semibold">{formatCurrency(pontoEquilibrio)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Diferença para Equilíbrio</span>
              <div className="text-right">
                <span className={`font-semibold ${diferencaEquilibrio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(diferencaEquilibrio)}
                </span>
                <Badge variant={diferencaEquilibrio >= 0 ? "secondary" : "destructive"} className="ml-2">
                  {diferencaEquilibrio >= 0 ? 'Acima do PE' : 'Abaixo do PE'}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Margem de Contribuição</span>
              <span className="font-semibold">{percentualMargemContribuicao.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Faturamento Mínimo Diário</span>
              <div className="text-right">
                <span className="font-semibold">{formatCurrency(fatMinimoDiario)}</span>
                <p className="text-xs text-muted-foreground">Para atingir o equilíbrio</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Contas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-yellow-50 border-yellow-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{contasVencendoHoje}</div>
              <div className="text-sm text-muted-foreground">Contas Vencendo Hoje</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(aReceberProximos7Dias)}</div>
              <div className="text-sm text-muted-foreground">A Receber (Próximos 7 dias)</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(aPagarProximos7Dias)}</div>
              <div className="text-sm text-muted-foreground">A Pagar (Próximos 7 dias)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movimentações Não Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex gap-2 items-center">
            <Receipt className="h-5 w-5" /> Movimentações Não Operacionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Receita Não Operacional</span>
              <div className="text-right min-w-[120px]">
                <div className="font-semibold">{formatCurrency(receitaNaoOperacional)}</div>
                <div className="text-xs text-muted-foreground">{totalReceitas > 0 ? Math.round((receitaNaoOperacional / totalReceitas) * 100) : 0}%</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-red-600">Despesa Não Operacional</span>
              <div className="text-right min-w-[120px]">
                <div className="font-semibold text-red-600">{formatCurrency(despesaNaoOperacional)}</div>
                <div className="text-xs text-muted-foreground">{totalReceitas > 0 ? Math.round((despesaNaoOperacional / totalReceitas) * 100) : 0}%</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 bg-gray-50 rounded-lg px-3">
              <span className="text-sm font-bold text-green-600">Resultado Não Operacional</span>
              <div className="text-right min-w-[120px]">
                <div className="font-bold text-green-600">{formatCurrency(resultadoNaoOperacional)}</div>
                <div className="text-xs text-muted-foreground">{totalReceitas > 0 ? Math.round((resultadoNaoOperacional / totalReceitas) * 100) : 0}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Faturamento Diário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex gap-2 items-center">
            <BarChart3 className="h-5 w-5" /> Análise de Faturamento Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FaturamentoChart receitas={receitas || []} selectedMonth={selectedMonth} />
        </CardContent>
      </Card>
    </div>
  );
}
