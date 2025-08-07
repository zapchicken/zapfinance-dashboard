import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Calendar, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Banco {
  id: string;
  nome: string;
  saldo_inicial: number;
  saldo_atual: number;
}

interface AjusteSaldo {
  id: string;
  banco_id: string;
  saldo_anterior: number;
  saldo_novo: number;
  diferenca: number;
  data_ajuste: string;
}

export default function FluxoCaixa() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("60");
  const [bancoSelecionado, setBancoSelecionado] = useState("todos");
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [ajustesSaldo, setAjustesSaldo] = useState<AjusteSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // 1. Adicionar estados para data de início e término:
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchAll = async () => {
      // Buscar bancos ativos
      const { data: bancosData } = await supabase
        .from('bancos')
        .select('*')
        .eq('ativo', true);
      setBancos(bancosData || []);

      // Usar datas do filtro
      const dataInicialStr = dataInicio || "";
      const dataFinalStr = dataFim || "";

      // Buscar entradas (contas_receber) - todas as contas
      let entradasQuery = supabase
        .from('contas_receber')
        .select('*');
      if (dataInicialStr) entradasQuery = entradasQuery.gte('data_recebimento', dataInicialStr);
      if (dataFinalStr) entradasQuery = entradasQuery.lte('data_recebimento', dataFinalStr);
      const { data: entradasData } = await entradasQuery;
      
      // Filtrar apenas as que têm data de recebimento (já foram recebidas)
      const entradasFiltradas = (entradasData || []).filter(e => e.data_recebimento);
      setEntradas(entradasFiltradas);
      
      console.log('Entradas carregadas:', entradasData);
      console.log('Entradas filtradas (com data_recebimento):', entradasFiltradas);

      // Buscar saídas (contas_pagar) - todas as contas
      let saidasQuery = supabase
        .from('contas_pagar')
        .select('*');
      if (dataInicialStr) saidasQuery = saidasQuery.gte('data_vencimento', dataInicialStr);
      if (dataFinalStr) saidasQuery = saidasQuery.lte('data_vencimento', dataFinalStr);
      const { data: saidasData } = await saidasQuery;
      
      // Filtrar apenas as que têm banco_id (para aparecer no fluxo de caixa)
      const saidasFiltradas = (saidasData || []).filter((s: any) => s.banco_id);
      setSaidas(saidasFiltradas);
      
      console.log('Saídas carregadas:', saidasData);
      console.log('Saídas filtradas (com data_pagamento):', saidasFiltradas);
      console.log('Filtros aplicados:', { dataInicialStr, dataFinalStr });
      
      // Buscar ajustes de saldo usando any para contornar o problema de tipos
      const { data: ajustesData } = await (supabase as any)
        .from('ajustes_saldo')
        .select('*')
        .order('data_ajuste', { ascending: true });
      setAjustesSaldo(ajustesData || []);
      
      console.log('Ajustes de saldo carregados:', ajustesData);
      
      // Debug dos bancos
      console.log('Bancos carregados:', bancosData);
      console.log('Bancos com saldo inicial:', bancosData?.map(b => ({ nome: b.nome, saldo_inicial: b.saldo_inicial, saldo_atual: b.saldo_atual })));
      
      setLoading(false);
    };
    fetchAll();
  }, [user, dataInicio, dataFim, bancoSelecionado]);

  // Montar movimentações agrupadas por banco
  const bancosComResumo = useMemo(() => {
    const resultado = bancos.map(banco => {
      const entradasBanco = entradas.filter((e: any) => e.banco_id === banco.id);
      const saidasBanco = saidas.filter((s: any) => s.banco_id === banco.id);
      const totalEntradas = entradasBanco.reduce((sum, e) => sum + (e.valor_liquido || e.valor || 0), 0);
      const totalSaidas = saidasBanco.reduce((sum, s) => sum + (s.valor || 0), 0);
      
      // Calcular ajustes de saldo para este banco
      const ajustesBanco = ajustesSaldo.filter(a => a.banco_id === banco.id);
      const totalAjustes = ajustesBanco.reduce((sum, a) => sum + a.diferenca, 0);
      
      // Calcular o saldo real baseado no saldo inicial + movimentações do período + ajustes de saldo
      const saldoReal = (banco.saldo_inicial || 0) + totalEntradas - totalSaidas + totalAjustes;
      
      // Debug específico para TON I
      if (banco.nome.includes('TON I') || banco.nome.includes('TONI')) {
        console.log(`🔍 DEBUG ESPECÍFICO - Banco ${banco.nome}:`, {
          banco_id: banco.id,
          saldo_atual_banco: banco.saldo_atual,
          saldo_inicial: banco.saldo_inicial,
          totalEntradas_periodo: totalEntradas,
          totalSaidas_periodo: totalSaidas,
          totalAjustes: totalAjustes,
          saldo_final_calculado: saldoReal,
          entradas_count: entradasBanco.length,
          saidas_count: saidasBanco.length,
          ajustes_count: ajustesBanco.length,
          ajustes_detalhados: ajustesBanco.map(a => ({
            data: a.data_ajuste,
            diferenca: a.diferenca,
            saldo_anterior: a.saldo_anterior,
            saldo_novo: a.saldo_novo
          }))
        });
      }
      
      // Debug para cada banco
      console.log(`Banco ${banco.nome}:`, {
        saldo_atual: banco.saldo_atual,
        saldo_inicial: banco.saldo_inicial,
        totalEntradas_periodo: totalEntradas,
        totalSaidas_periodo: totalSaidas,
        totalAjustes: totalAjustes,
        saldo_final: saldoReal,
        entradas_count: entradasBanco.length,
        saidas_count: saidasBanco.length,
        ajustes_count: ajustesBanco.length
      });
      
      return {
        ...banco,
        totalEntradas,
        totalSaidas,
        totalAjustes,
        saldo: saldoReal
      };
    });
    
    console.log('Bancos com resumo calculado:', resultado);
    return resultado;
  }, [bancos, entradas, saidas, ajustesSaldo]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const totalSaldos = bancosComResumo.reduce((sum, banco) => sum + (banco.saldo || 0), 0);
  const totalEntradas = bancosComResumo.reduce((sum, banco) => sum + banco.totalEntradas, 0);
  const totalSaidas = bancosComResumo.reduce((sum, banco) => sum + banco.totalSaidas, 0);
  const saldoLiquido = totalEntradas - totalSaidas;

  // Montar lista de movimentações recentes (entradas + saídas)
  const movimentacoesRecentes = useMemo(() => {
    const entradasFormatadas = entradas.map(e => ({
      id: e.id,
      data: e.data_recebimento,
      descricao: e.descricao,
      banco: bancos.find(b => b.id === e.banco_id)?.nome || '-',
      entrada: e.valor_liquido || e.valor,
      saida: 0,
      saldo: null,
      tipo: 'receita'
    }));
    const saidasFormatadas = saidas.map(s => ({
      id: s.id,
      data: s.data_pagamento,
      descricao: s.descricao,
      banco: bancos.find(b => b.id === s.banco_id)?.nome || '-',
      entrada: 0,
      saida: s.valor,
      saldo: null,
      tipo: 'despesa'
    }));
    return [...entradasFormatadas, ...saidasFormatadas]
      .filter(m => m.data)
      .sort((a, b) => {
        // Ordenar por data (mais antiga primeiro - ordem crescente)
        const dateA = new Date(a.data);
        const dateB = new Date(b.data);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 20); // últimos 20
  }, [entradas, saidas, bancos]);

  // Mover o cálculo das variáveis para antes do return:
  // 1. Calcular todas as datas relevantes
  // 2. Calcular saldos acumulados por banco
  // 3. Montar linhas da tabela
  // Renderizar a tabela comparativa após os cards de resumo:
  // 1. Gerar todas as datas do range selecionado:
  function getDateRange(start: string, end: string) {
    if (!start || !end) return [];
    const result = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      result.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return result;
  }
  const todasDatas = (dataInicio && dataFim)
    ? getDateRange(dataInicio, dataFim)
    : Array.from(new Set([
        ...entradas.map(e => e.data_recebimento),
        ...saidas.map(s => s.data_vencimento)
      ].filter(Boolean))).filter(data => {
        if (dataInicio && data < dataInicio) return false;
        if (dataFim && data > dataFim) return false;
        return true;
      }).sort();
  const saldosPorBanco: Record<string, number> = {};
  bancos.forEach(b => { saldosPorBanco[b.id] = b.saldo_inicial || 0; });
  const linhas = todasDatas.map(data => {
    const celulas = bancos.map(banco => {
      const entrada = entradas.filter(e => e.banco_id === banco.id && e.data_recebimento === data).reduce((sum, e) => sum + (e.valor_liquido || e.valor || 0), 0);
      const saida = saidas.filter(s => s.banco_id === banco.id && s.data_vencimento === data).reduce((sum, s) => sum + (s.valor || 0), 0);
      saldosPorBanco[banco.id] += entrada - saida;
      return { entrada, saida, saldo: saldosPorBanco[banco.id] };
    });
    return { data, celulas };
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Controle de movimentações financeiras</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Últimos {periodoSelecionado} dias</span>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium">Data Início</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Data Fim</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border rounded px-2 py-1" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Banco</label>
              <Select value={bancoSelecionado} onValueChange={setBancoSelecionado}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Bancos</SelectItem>
                  {bancos.map(banco => (
                    <SelectItem key={banco.id} value={banco.id}>{banco.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalSaldos)}
            </div>
            <p className="text-xs text-muted-foreground">Todos os bancos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEntradas)}
            </div>
            <p className="text-xs text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalSaidas)}
            </div>
            <p className="text-xs text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(saldoLiquido)}
            </div>
            <p className="text-xs text-muted-foreground">Entrada - Saída</p>
          </CardContent>
        </Card>
      </div>

      {/* Saldos por banco */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Saldos por Banco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bancosComResumo.map((banco) => (
              <div key={banco.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium text-lg">{banco.nome}</div>
                  <div className="text-sm text-muted-foreground">Saldo atual</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">{formatCurrency(banco.saldo)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Substituir o bloco de tabelas por banco por uma única tabela comparativa: */}
      {/* 1. Calcular todas as datas relevantes */}
      {/* 2. Calcular saldos acumulados por banco */}
      {/* 3. Montar linhas da tabela */}
      {/* Renderizar a tabela comparativa após os cards de resumo: */}
      {/* 1. Calcular todas as datas relevantes */}
      {/* 2. Calcular saldos acumulados por banco */}
      {/* 3. Montar linhas da tabela */}
      {/* Renderizar a tabela comparativa após os cards de resumo: */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Fluxo de Caixa por Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-center align-bottom w-24">Data</th>
                  {bancos.map(banco => (
                    <th key={banco.id} className="p-2 text-center align-bottom">
                      <div className="font-bold text-center text-sm">{banco.nome}</div>
                      <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                        <span className="text-success">Entrada</span>
                        <span className="text-accent">Saída</span>
                        <span className="font-medium">Saldo</span>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 text-center align-bottom">
                    <div className="font-bold text-center text-sm">Saldo Total</div>
                    <div className="grid grid-cols-3 gap-1 text-xs mt-1">
                      <span className="text-success">Entrada</span>
                      <span className="text-accent">Saída</span>
                      <span className="font-medium">Saldo</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha, idx) => {
                  // Calcular totais para esta data
                  const totalEntrada = linha.celulas.reduce((sum, cel) => sum + cel.entrada, 0);
                  const totalSaida = linha.celulas.reduce((sum, cel) => sum + cel.saida, 0);
                  const totalSaldo = linha.celulas.reduce((sum, cel) => sum + cel.saldo, 0);
                  
                  return (
                    <tr key={linha.data + idx} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-mono text-center text-sm w-24">{linha.data ? linha.data.split('-').reverse().join('/') : '-'}</td>
                      {linha.celulas.map((cel, bidx) => (
                        <td key={bidx} className="p-2 text-center">
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <span className="text-success font-medium">
                              {cel.entrada > 0 ? formatNumber(cel.entrada) : '-'}
                            </span>
                            <span className="text-accent font-medium">
                              {cel.saida > 0 ? formatNumber(cel.saida) : '-'}
                            </span>
                            <span className={
                              'font-bold ' +
                              (cel.saldo > 0 ? 'text-success' : cel.saldo < 0 ? 'text-destructive' : 'text-foreground')
                            }>{formatNumber(cel.saldo)}</span>
                          </div>
                        </td>
                      ))}
                      <td className="p-2 text-center bg-muted/20">
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <span className="text-success font-medium">
                            {totalEntrada > 0 ? formatNumber(totalEntrada) : '-'}
                          </span>
                          <span className="text-accent font-medium">
                            {totalSaida > 0 ? formatNumber(totalSaida) : '-'}
                          </span>
                          <span className={
                            'font-bold ' +
                            (totalSaldo > 0 ? 'text-success' : totalSaldo < 0 ? 'text-destructive' : 'text-foreground')
                          }>{formatNumber(totalSaldo)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {linhas.length === 0 && (
                  <tr><td colSpan={bancos.length + 2} className="text-center py-4 text-muted-foreground">Sem movimentações</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-left p-4 font-medium">Descrição</th>
                  <th className="text-left p-4 font-medium">Banco</th>
                  <th className="text-right p-4 font-medium">Entrada</th>
                  <th className="text-right p-4 font-medium">Saída</th>
                  <th className="text-right p-4 font-medium">Saldo</th>
                  <th className="text-center p-4 font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesRecentes.map((mov) => (
                  <tr key={mov.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-mono text-sm">
                      {mov.data ? mov.data.split('-').reverse().join('/') : '-'}
                    </td>
                    <td className="p-4 max-w-64 truncate">{mov.descricao}</td>
                    <td className="p-4">{mov.banco}</td>
                    <td className="p-4 text-right font-mono">
                      {mov.entrada > 0 ? (
                        <span className="text-success font-medium">
                          {formatCurrency(mov.entrada)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {mov.saida > 0 ? (
                        <span className="text-accent font-medium">
                          {formatCurrency(mov.saida)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-medium">
                      {formatCurrency(mov.saldo)}
                    </td>
                    <td className="p-4 text-center">
                      {mov.tipo === "receita" ? (
                        <Badge className="bg-success text-success-foreground">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Receita
                        </Badge>
                      ) : (
                        <Badge className="bg-accent text-accent-foreground">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Despesa
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}