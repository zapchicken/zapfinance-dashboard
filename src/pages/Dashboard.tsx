import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function Dashboard() {
  const [receitas, setReceitas] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Verificar autenticação
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('Usuário autenticado:', user?.id);
        
        if (authError) {
          console.error('Erro de autenticação:', authError);
        }

        // Buscar dados das tabelas corretas
        const { data: receitasData, error: receitasError } = await supabase.from('contas_receber').select('*');
        const { data: contasPagarData, error: contasPagarError } = await supabase.from('contas_pagar').select('*');
        const { data: categoriasData, error: categoriasError } = await supabase.from('categorias').select('*');
        const { data: modalidadesData, error: modalidadesError } = await supabase.from('modalidades_receita').select('*');

        // Log para debug
        console.log('Dados carregados:', {
          receitas: receitasData?.length || 0,
          contasPagar: contasPagarData?.length || 0,
          categorias: categoriasData?.length || 0,
          modalidades: modalidadesData?.length || 0
        });

        // Log detalhado dos dados
        if (receitasData && receitasData.length > 0) {
          console.log('Exemplo de receita:', receitasData[0]);
        }
        if (contasPagarData && contasPagarData.length > 0) {
          console.log('Exemplo de conta a pagar:', contasPagarData[0]);
        }
        if (categoriasData && categoriasData.length > 0) {
          console.log('Categorias disponíveis:', categoriasData.map(cat => ({ id: cat.id, nome: cat.nome, tipo: cat.tipo })));
        }
        if (modalidadesData && modalidadesData.length > 0) {
          console.log('Modalidades disponíveis:', modalidadesData.map(mod => ({ id: mod.id, nome: mod.nome, taxa_percentual: mod.taxa_percentual })));
        }

        if (receitasError) console.error('Erro ao carregar receitas:', receitasError);
        if (contasPagarError) console.error('Erro ao carregar contas a pagar:', contasPagarError);
        if (categoriasError) console.error('Erro ao carregar categorias:', categoriasError);
        if (modalidadesError) console.error('Erro ao carregar modalidades:', modalidadesError);

        setReceitas(receitasData || []);
        setContasPagar(contasPagarData || []);
        setCategorias(categoriasData || []);
        setModalidades(modalidadesData || []);
      } catch (error) {
        console.error('Erro geral ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Estado para o mês selecionado
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estados para controlar dropdowns (se necessário no futuro)
  // const [custosVariaveisExpanded, setCustosVariaveisExpanded] = useState(false);
  // const [investimentosExpanded, setInvestimentosExpanded] = useState(false);

  // Função para obter o primeiro e último dia do mês selecionado
  const getMesSelecionado = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    return { primeiroDia, ultimoDia };
  };

  // Função para filtrar receitas por período (baseado na data de recebimento)
  const filtrarReceitasPorPeriodo = (receitas: any[], dataInicio: Date, dataFim: Date) => {
    return receitas.filter(receita => {
      // Usar data de recebimento se existir, senão usar data de vencimento
      const dataReferencia = receita.data_recebimento || receita.data_vencimento;
      if (!dataReferencia) return false;
      const data = new Date(dataReferencia);
      return data >= dataInicio && data <= dataFim;
    });
  };

  // Função para filtrar despesas por período (baseado na data de pagamento)
  const filtrarDespesasPorPeriodo = (despesas: any[], dataInicio: Date, dataFim: Date) => {
    return despesas.filter(despesa => {
      // Usar data de pagamento se existir, senão usar data de vencimento
      const dataReferencia = despesa.data_pagamento || despesa.data_vencimento;
      if (!dataReferencia) return false;
      const data = new Date(dataReferencia);
      return data >= dataInicio && data <= dataFim;
    });
  };



  // Obter período do mês selecionado
  const { primeiroDia, ultimoDia } = getMesSelecionado(mesSelecionado);

  // Filtrar dados do mês atual baseado nas datas de vencimento
  const receitasMesAtual = filtrarReceitasPorPeriodo(receitas, primeiroDia, ultimoDia);
  const despesasMesAtual = filtrarDespesasPorPeriodo(contasPagar, primeiroDia, ultimoDia);

  // Usar apenas os dados filtrados do mês selecionado
  const receitasParaUsar = receitasMesAtual;
  const despesasParaUsar = despesasMesAtual;

  // Log para debug dos dados filtrados
  console.log('Dados filtrados do mês atual:', {
    mesSelecionado,
    receitasTotal: receitas.length,
    receitasMesAtual: receitasMesAtual.length,
    contasPagarTotal: contasPagar.length,
    despesasMesAtual: despesasMesAtual.length,
    primeiroDia: primeiroDia.toISOString(),
    ultimoDia: ultimoDia.toISOString()
  });

  // Log detalhado das receitas e despesas
  if (receitas.length > 0) {
    console.log('Todas as receitas:', receitas.map(r => ({
      id: r.id,
      descricao: r.descricao,
      valor: r.valor,
      data_vencimento: r.data_vencimento,
      data_recebimento: r.data_recebimento,
      status: r.status
    })));
  }

  if (contasPagar.length > 0) {
    console.log('Todas as contas a pagar:', contasPagar.map(c => ({
      id: c.id,
      descricao: c.descricao,
      valor: c.valor,
      data_vencimento: c.data_vencimento,
      data_pagamento: c.data_pagamento,
      status: c.status,
      categoria_id: c.categoria_id
    })));
  } else {
    console.log('Nenhuma conta a pagar encontrada');
  }

  if (receitasMesAtual.length > 0) {
    console.log('Receitas do mês atual:', receitasMesAtual.map(r => ({
      id: r.id,
      descricao: r.descricao,
      valor: r.valor,
      data_vencimento: r.data_vencimento,
      status: r.status
    })));
  }

  if (despesasMesAtual.length > 0) {
    console.log('Despesas do mês atual:', despesasMesAtual.map(d => ({
      id: d.id,
      descricao: d.descricao,
      valor: d.valor,
      data_vencimento: d.data_vencimento,
      status: d.status,
      categoria_id: d.categoria_id
    })));
  } else {
    console.log('Nenhuma despesa encontrada para o mês atual');
  }

  // Filtrar receitas e despesas do mês atual por tipo
  // Separar receitas por modalidade: Ifood Voucher vai para investimento
  const receitasOperacionais = (receitasParaUsar || []).filter(r => 
    r.descricao.toLowerCase() !== 'ifood voucher'
  );
  const receitasInvestimento = (receitasParaUsar || []).filter(r => 
    r.descricao.toLowerCase() === 'ifood voucher'
  );
  const receitasNaoOperacionais = []; // Outras receitas não operacionais
  const totalReceitas = receitasOperacionais.reduce((sum, c) => sum + (c.valor || 0), 0);
  // Calcular taxas modalidades baseado nas modalidades configuradas
  const totalTarifasModalidades = receitasOperacionais.reduce((sum, r) => {
    // Buscar modalidade baseada na descrição da receita
    const modalidade = modalidades.find(m => m.nome.toLowerCase() === r.descricao.toLowerCase());
    const taxaPercentual = modalidade ? modalidade.taxa_percentual : 10; // 10% padrão se não encontrar
    const taxa = (r.valor * taxaPercentual) / 100;
    return sum + taxa;
  }, 0);

  const contasPagarOperacionais = despesasParaUsar; // Todas as despesas são operacionais

  // Log para debug das despesas operacionais
  console.log('Despesas operacionais:', {
    total: contasPagarOperacionais.length,
    detalhes: contasPagarOperacionais.map(c => ({
      id: c.id,
      descricao: c.descricao,
      valor: c.valor,
      categoria_id: c.categoria_id,
      categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria',
      data_vencimento: c.data_vencimento,
      data_pagamento: c.data_pagamento
    }))
  });

  // Log para debug dos cálculos
  console.log('Cálculos do dashboard:', {
    receitasOperacionais: receitasOperacionais.length,
    receitasInvestimento: receitasInvestimento.length,
    receitasNaoOperacionais: receitasNaoOperacionais.length,
    totalReceitas,
    totalTarifasModalidades,
    contasPagarOperacionais: contasPagarOperacionais.length,
    despesasMesAtual: despesasMesAtual.length,
    usandoTodosOsDados: receitasMesAtual.length === 0 && receitas.length > 0
  });

  // Log detalhado das receitas separadas
  if (receitasOperacionais.length > 0) {
    console.log('Receitas operacionais:', receitasOperacionais.map(r => ({
      descricao: r.descricao,
      valor: r.valor
    })));
  }
  if (receitasInvestimento.length > 0) {
    console.log('Receitas investimento (Ifood Voucher):', receitasInvestimento.map(r => ({
      descricao: r.descricao,
      valor: r.valor
    })));
  }

  // Log detalhado das taxas modalidades
  if (receitasOperacionais.length > 0) {
    console.log('Detalhes das taxas modalidades:', receitasOperacionais.map(r => {
      const modalidade = modalidades.find(m => m.nome.toLowerCase() === r.descricao.toLowerCase());
      return {
        descricao: r.descricao,
        valor: r.valor,
        modalidade_encontrada: modalidade?.nome || 'Não encontrada',
        taxa_percentual: modalidade ? modalidade.taxa_percentual : 10,
        taxa_calculada: (r.valor * (modalidade ? modalidade.taxa_percentual : 10)) / 100
      };
    }));
    console.log('Total das taxas modalidades:', totalTarifasModalidades);
  }

  // Categorias fixas: buscar por nomes específicos
  const categoriasFixasIds = categorias
    ? categorias.filter(cat => 
        cat.nome.toLowerCase().includes('água') || 
        cat.nome.toLowerCase().includes('agua') ||
        cat.nome.toLowerCase().includes('gás') ||
        cat.nome.toLowerCase().includes('gas') ||
        cat.nome.toLowerCase().includes('internet') ||
        cat.nome.toLowerCase().includes('fixa') || 
        cat.nome.toLowerCase().includes('fixo') ||
        cat.nome.toLowerCase().includes('energia') ||
        cat.nome.toLowerCase().includes('eletrica') ||
        cat.nome.toLowerCase().includes('elétrica')
      ).map(cat => cat.id)
    : [];
  
  const categoriasInvestimentoIds = categorias
    ? categorias.filter(cat => 
        cat.nome.toLowerCase().includes('investimento') ||
        cat.nome.toLowerCase().includes('facebook')
      ).map(cat => cat.id)
    : [];

  const categoriasCustoVariavelIds = categorias
    ? categorias.filter(cat => 
        cat.nome.toLowerCase().includes('alimentos') ||
        cat.nome.toLowerCase().includes('bebidas') ||
        cat.nome.toLowerCase().includes('variável') || 
        cat.nome.toLowerCase().includes('variavel') ||
        cat.nome.toLowerCase().includes('custo')
      ).map(cat => cat.id)
    : [];

  // Log das categorias para debug
  if (categorias.length > 0) {
    console.log('Categorias disponíveis:', categorias.map(cat => ({
      id: cat.id,
      nome: cat.nome,
      tipo: cat.tipo
    })));
    console.log('Nomes das categorias:', categorias.map(cat => cat.nome));
    console.log('Categorias com IDs fixos:', categorias.filter(cat => 
      cat.nome.toLowerCase().includes('água') || 
      cat.nome.toLowerCase().includes('agua') ||
      cat.nome.toLowerCase().includes('gás') ||
      cat.nome.toLowerCase().includes('gas') ||
      cat.nome.toLowerCase().includes('fixa') || 
      cat.nome.toLowerCase().includes('fixo')
    ).map(cat => ({ id: cat.id, nome: cat.nome })));
    console.log('Categorias fixas IDs:', categoriasFixasIds);
    console.log('Categorias investimento IDs:', categoriasInvestimentoIds);
    console.log('Categorias custo variável IDs:', categoriasCustoVariavelIds);
    
    // Log das categorias encontradas
    const categoriasFixas = categorias.filter(cat => 
      cat.nome.toLowerCase().includes('fixa') || 
      cat.nome.toLowerCase().includes('fixo')
    );
    const categoriasInvestimento = categorias.filter(cat => 
      cat.nome.toLowerCase().includes('investimento')
    );
    const categoriasCustoVariavel = categorias.filter(cat => 
      cat.nome.toLowerCase().includes('variável') || 
      cat.nome.toLowerCase().includes('variavel') ||
      cat.nome.toLowerCase().includes('custo')
    );
    
    console.log('Categorias fixas encontradas:', categoriasFixas.map(cat => cat.nome));
    console.log('Categorias investimento encontradas:', categoriasInvestimento.map(cat => cat.nome));
    console.log('Categorias custo variável encontradas:', categoriasCustoVariavel.map(cat => cat.nome));
    
    // Verificar se há categorias que podem ser consideradas fixas
    const categoriasDespesa = categorias.filter(cat => cat.tipo === 'despesa');
    console.log('Categorias de despesa:', categoriasDespesa.map(cat => cat.nome));
    
    // Log detalhado de todas as contas a pagar
    console.log('Todas as contas a pagar:', contasPagarOperacionais.map(c => ({
      id: c.id,
      descricao: c.descricao,
      valor: c.valor,
      categoria_id: c.categoria_id,
      categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria'
    })));
  }

  // Log para debug das despesas antes da filtragem
      console.log('Despesas antes da filtragem por categoria:', contasPagarOperacionais.map(c => ({
      id: c.id,
      descricao: c.descricao,
      valor: c.valor,
      categoria_id: c.categoria_id,
      categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria',
      categoria_tipo: categorias.find(cat => cat.id === c.categoria_id)?.categoria || 'Sem tipo'
    })));
    
    // Log detalhado para debug da filtragem
    console.log('IDs das categorias fixas:', categoriasFixasIds);
    console.log('IDs das despesas:', contasPagarOperacionais.map(c => c.categoria_id));
    console.log('Verificação de cada despesa:');
    contasPagarOperacionais.forEach((c, index) => {
      const categoria = categorias.find(cat => cat.id === c.categoria_id);
      const isFixa = categoriasFixasIds.includes(c.categoria_id);
      const isCustoVariavel = categoriasCustoVariavelIds.includes(c.categoria_id);
      console.log(`Despesa ${index + 1}:`, {
        id: c.id,
        descricao: c.descricao,
        categoria_id: c.categoria_id,
        categoria_nome: categoria?.nome || 'Sem categoria',
        categoria_tipo: categoria?.categoria || 'Sem tipo',
        isFixa: isFixa,
        isCustoVariavel: isCustoVariavel,
        categoriasFixasIds: categoriasFixasIds,
        categoriasCustoVariavelIds: categoriasCustoVariavelIds,
        categoriaIncluida: categoriasFixasIds.includes(c.categoria_id),
        categoriaCustoVariavelIncluida: categoriasCustoVariavelIds.includes(c.categoria_id)
      });
    });
    
    // Log detalhado das categorias fixas
    const categoriasFixasDetalhadas = categorias.filter(cat => 
      cat.nome.toLowerCase().includes('água') || 
      cat.nome.toLowerCase().includes('agua') ||
      cat.nome.toLowerCase().includes('gás') ||
      cat.nome.toLowerCase().includes('gas') ||
      cat.nome.toLowerCase().includes('fixa') || 
      cat.nome.toLowerCase().includes('fixo')
    );
    console.log('Categorias fixas detalhadas:', categoriasFixasDetalhadas.map(cat => ({ 
      id: cat.id, 
      nome: cat.nome, 
      categoria: cat.categoria 
    })));
    console.log('IDs das categorias fixas encontradas:', categoriasFixasDetalhadas.map(cat => cat.id));

  // Log para debug da filtragem
  const despesasFiltradasFixas = contasPagarOperacionais.filter(c => categoriasFixasIds.includes(c.categoria_id));
  console.log('Despesas filtradas como fixas:', despesasFiltradasFixas.map(c => ({
    id: c.id,
    descricao: c.descricao,
    valor: c.valor,
    categoria_id: c.categoria_id,
    categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria'
  })));

  const despesasFixas = contasPagarOperacionais
    .filter(c => categoriasFixasIds.includes(c.categoria_id))
    .reduce((sum, c) => sum + (c.valor || 0), 0);

  // Investimentos: despesas com categoria investimento + receitas do Ifood Voucher
  const investimentosDespesas = contasPagarOperacionais
    .filter(c => categoriasInvestimentoIds.includes(c.categoria_id))
    .reduce((sum, c) => sum + (c.valor || 0), 0);
  
  const investimentosReceitas = receitasInvestimento
    .reduce((sum, r) => sum + (r.valor || 0), 0);
  
  const investimentos = investimentosDespesas + investimentosReceitas;

  // Custos variáveis: despesas com categoria "Custo Variável"
  const custosVariaveis = contasPagarOperacionais
    .filter(c => categoriasCustoVariavelIds.includes(c.categoria_id))
    .reduce((sum, c) => sum + (c.valor || 0), 0) + totalTarifasModalidades;
    
  // Log para debug dos custos variáveis
      console.log('Debug custos variáveis:', {
      contasPagarOperacionais: contasPagarOperacionais.length,
      categoriasCustoVariavelIds,
      despesasComCustoVariavel: contasPagarOperacionais.filter(c => categoriasCustoVariavelIds.includes(c.categoria_id)),
      totalTarifasModalidades,
      custosVariaveis
    });
    
    // Log detalhado das despesas com custo variável
    console.log('Despesas com custo variável:', contasPagarOperacionais.filter(c => categoriasCustoVariavelIds.includes(c.categoria_id)).map(c => ({
      id: c.id,
      descricao: c.descricao,
      valor: c.valor,
      categoria_id: c.categoria_id,
      categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria'
    })));
    
    // Log detalhado para debug dos custos variáveis
    console.log('IDs das categorias de custo variável:', categoriasCustoVariavelIds);
    console.log('IDs das despesas:', contasPagarOperacionais.map(c => c.categoria_id));
    console.log('Verificação de cada despesa para custo variável:');
    contasPagarOperacionais.forEach((c, index) => {
      const categoria = categorias.find(cat => cat.id === c.categoria_id);
      const isCustoVariavel = categoriasCustoVariavelIds.includes(c.categoria_id);
      console.log(`Despesa ${index + 1} para custo variável:`, {
        id: c.id,
        descricao: c.descricao,
        categoria_id: c.categoria_id,
        categoria_nome: categoria?.nome || 'Sem categoria',
        categoria_tipo: categoria?.categoria || 'Sem tipo',
        isCustoVariavel: isCustoVariavel,
        categoriasCustoVariavelIds: categoriasCustoVariavelIds,
        categoriaIncluida: categoriasCustoVariavelIds.includes(c.categoria_id)
      });
    });

  // Log para debug dos custos variáveis
  console.log('Cálculo dos custos variáveis:', {
    contasPagarOperacionais: contasPagarOperacionais.length,
    categoriasFixasIds,
    categoriasInvestimentoIds,
    categoriasCustoVariavelIds,
    custosVariaveis,
    totalTarifasModalidades,
    despesasFixas,
    detalhes: contasPagarOperacionais
      .filter(c => categoriasCustoVariavelIds.includes(c.categoria_id))
      .map(c => ({
        id: c.id,
        descricao: c.descricao,
        valor: c.valor,
        categoria_id: c.categoria_id,
        categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria'
      }))
  });

  // Log para debug das despesas fixas
  console.log('Cálculo das despesas fixas:', {
    despesasFixas,
    detalhes: contasPagarOperacionais
      .filter(c => categoriasFixasIds.includes(c.categoria_id))
      .map(c => ({
        id: c.id,
        descricao: c.descricao,
        valor: c.valor,
        categoria_id: c.categoria_id,
        categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria'
      }))
  });

  // Log para debug dos investimentos
  console.log('Cálculo dos investimentos:', {
    investimentos,
    investimentosDespesas,
    investimentosReceitas,
    detalhesDespesas: contasPagarOperacionais
      .filter(c => categoriasInvestimentoIds.includes(c.categoria_id))
      .map(c => ({
        id: c.id,
        descricao: c.descricao,
        valor: c.valor,
        categoria_id: c.categoria_id,
        categoria_nome: categorias.find(cat => cat.id === c.categoria_id)?.nome || 'Sem categoria'
      })),
    detalhesReceitas: receitasInvestimento.map(r => ({
      id: r.id,
      descricao: r.descricao,
      valor: r.valor
    }))
  });

  const percentualCustosVariaveis = totalReceitas > 0 ? (custosVariaveis / totalReceitas) * 100 : 0;
  const percentualDespesasFixas = totalReceitas > 0 ? (despesasFixas / totalReceitas) * 100 : 0;
  const percentualInvestimentos = totalReceitas > 0 ? (investimentos / totalReceitas) * 100 : 0;

  const margemContribuicao = totalReceitas - custosVariaveis;
  const percentualMargemContribuicao = totalReceitas > 0 ? (margemContribuicao / totalReceitas) * 100 : 0;

  const lucroOperacional = margemContribuicao - despesasFixas;
  const percentualLucroOperacional = totalReceitas > 0 ? (lucroOperacional / totalReceitas) * 100 : 0;

  const resultadoLiquido = lucroOperacional - investimentos;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number, total: number) => {
    return total > 0 ? `${(Math.abs(value) / total * 100).toFixed(0)}%` : '0%';
  };

  function getDiasUteisRestantes() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    
    // Calcular total de dias restantes no mês (excluindo hoje)
    const diasRestantes = ultimoDia - hoje.getDate();
    
    // Subtrair 1 dia de folga (trabalhamos todos os dias menos 1)
    const diasUteis = Math.max(0, diasRestantes - 1);
    
    return diasUteis;
  }

  const diasUteis = getDiasUteisRestantes();

  const pontoEquilibrio = totalReceitas > 0 && margemContribuicao > 0
    ? despesasFixas / (margemContribuicao / totalReceitas)
    : despesasFixas;
  
  const diferencaMeta = totalReceitas - pontoEquilibrio;
  const fatMinimoDiario = diasUteis > 0 ? pontoEquilibrio / diasUteis : 0;

  const receitaNaoOperacional = receitasNaoOperacionais.reduce((sum, c) => sum + (c.valor || 0), 0);
  const despesasNaoOperacionais = []; // Não há despesas não operacionais na estrutura atual
  const despesaNaoOperacional = despesasNaoOperacionais.reduce((sum, c) => sum + (c.valor || 0), 0);
  const resultadoNaoOperacional = receitaNaoOperacional - despesaNaoOperacional;
  const resultadoGeralLiquido = resultadoLiquido + resultadoNaoOperacional;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Login Necessário</h2>
          <button 
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  const getNumberColor = (value: number) => value < 0 ? 'text-destructive' : 'text-foreground';

  const hoje = new Date().toISOString().split('T')[0];
  const proximos7Dias = new Date();
  proximos7Dias.setDate(proximos7Dias.getDate() + 7);
  const dataLimite = proximos7Dias.toISOString().split('T')[0];

  const contasVencendoHoje = contasPagar.filter(c => c.data_vencimento === hoje).length;
  const aReceberProximos7Dias = receitas
    .filter(r => r.data_vencimento >= hoje && r.data_vencimento <= dataLimite)
    .reduce((sum, r) => sum + (r.valor || 0), 0);
  const aPagarProximos7Dias = contasPagar
    .filter(c => c.data_vencimento >= hoje && c.data_vencimento <= dataLimite)
    .reduce((sum, c) => sum + (c.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral das finanças da ZapChicken</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="text-sm text-muted-foreground bg-transparent border-none focus:outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const data = new Date(2025, i, 1);
                const valor = `2025-${String(i + 1).padStart(2, '0')}`;
                return (
                  <option key={valor} value={valor}>
                    {data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalReceitas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Contribuição</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(margemContribuicao)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(margemContribuicao, totalReceitas)} do faturamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Operacional</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNumberColor(lucroOperacional)}`}>
              {formatCurrency(lucroOperacional)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(lucroOperacional, totalReceitas)} do faturamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getNumberColor(resultadoLiquido)}`}>
              {formatCurrency(resultadoLiquido)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(resultadoLiquido, totalReceitas)} do faturamento
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Demonstrativo de Resultado
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Dados baseados em {primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} (data de recebimento/pagamento)
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-border/50">
                <div className="col-span-6 text-left">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Descrição</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valor (R$)</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">%</span>
                </div>
              </div>

              {/* Receita Operacional Bruta */}
              <div className="grid grid-cols-12 gap-4 items-center py-1">
                <div className="col-span-6 text-left">
                  <span className="font-semibold text-foreground">Receita Operacional Bruta</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="font-bold text-lg text-foreground">{formatCurrency(totalReceitas)}</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm font-medium text-muted-foreground bg-primary/10 px-2 py-1 rounded">100%</span>
                </div>
              </div>

              {/* Custos Variáveis (Accordion) */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="custos-variaveis" className="border-none">
                  <AccordionTrigger className="w-full hover:no-underline py-1 px-0">
                    <div className="grid grid-cols-12 gap-4 items-center w-full">
                      <div className="col-span-6 text-left">
                        <span className="text-destructive font-semibold">Custos Variáveis</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="font-bold text-lg text-destructive">{formatCurrency(custosVariaveis)}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-sm font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">{percentualCustosVariaveis.toFixed(0)}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1">
                    <div className="space-y-1 pl-6">
                      <div className="grid grid-cols-12 gap-4 items-center py-0.5">
                        <div className="col-span-6 text-left">
                          <span className="text-sm text-muted-foreground">Custos Operacionais (sem fixas)</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-sm font-medium text-muted-foreground">{formatCurrency(custosVariaveis - totalTarifasModalidades)}</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-xs text-muted-foreground">{totalReceitas > 0 ? (((custosVariaveis - totalTarifasModalidades) / totalReceitas) * 100).toFixed(0) : '0'}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-4 items-center py-0.5">
                        <div className="col-span-6 text-left">
                          <span className="text-sm text-muted-foreground">Taxas Modalidades</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-sm font-medium text-muted-foreground">{formatCurrency(totalTarifasModalidades)}</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-xs text-muted-foreground">{totalReceitas > 0 ? ((totalTarifasModalidades / totalReceitas) * 100).toFixed(0) : '0'}%</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="border-t border-border/30 my-2"></div>

              {/* Margem de Contribuição */}
              <div className="grid grid-cols-12 gap-4 items-center py-1">
                <div className="col-span-6 text-left">
                  <span className="font-semibold text-foreground">Margem de Contribuição</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="font-bold text-lg text-foreground">{formatCurrency(margemContribuicao)}</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm font-medium text-success bg-success/10 px-2 py-1 rounded">{percentualMargemContribuicao.toFixed(0)}%</span>
                </div>
              </div>

              {/* Despesa Fixa */}
              <div className="grid grid-cols-12 gap-4 items-center py-1">
                <div className="col-span-6 text-left">
                  <span className="text-destructive font-semibold">Despesa Fixa</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="font-bold text-lg text-destructive">{formatCurrency(despesasFixas)}</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">{percentualDespesasFixas.toFixed(0)}%</span>
                </div>
              </div>

              <div className="border-t border-border/30 my-2"></div>

              {/* Lucro Operacional */}
              <div className="grid grid-cols-12 gap-4 items-center py-1">
                <div className="col-span-6 text-left">
                  <span className="font-semibold text-foreground">Lucro Operacional</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className={`font-bold text-lg ${getNumberColor(lucroOperacional)}`}>{formatCurrency(lucroOperacional)}</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className={`text-sm font-medium px-2 py-1 rounded ${lucroOperacional < 0 ? 'text-destructive bg-destructive/10' : 'text-success bg-success/10'}`}>
                    {percentualLucroOperacional.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Investimentos (Accordion) */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="investimentos" className="border-none">
                  <AccordionTrigger className="w-full hover:no-underline py-1 px-0">
                    <div className="grid grid-cols-12 gap-4 items-center w-full">
                      <div className="col-span-6 text-left">
                        <span className="text-destructive font-semibold">Investimentos</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="font-bold text-lg text-destructive">{formatCurrency(investimentos)}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-sm font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                          {percentualInvestimentos.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1">
                    <div className="space-y-1 pl-6">
                      <div className="grid grid-cols-12 gap-4 items-center py-0.5">
                        <div className="col-span-6 text-left">
                          <span className="text-sm text-muted-foreground">Outros Investimentos</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-sm font-medium text-muted-foreground">{formatCurrency(investimentosDespesas)}</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-xs text-muted-foreground">
                            {totalReceitas > 0 ? ((investimentosDespesas / totalReceitas) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-4 items-center py-0.5">
                        <div className="col-span-6 text-left">
                          <span className="text-sm text-muted-foreground">Ifood Voucher</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-sm font-medium text-muted-foreground">{formatCurrency(investimentosReceitas)}</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="text-xs text-muted-foreground">
                            {totalReceitas > 0 ? ((investimentosReceitas / totalReceitas) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="border-t-2 border-border my-2"></div>

              {/* Resultado Líquido */}
              <div className="grid grid-cols-12 gap-4 items-center py-2 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg px-4">
                <div className="col-span-6 text-left">
                  <span className="font-bold text-lg text-foreground">Resultado Líquido</span>
                </div>
                <div className="col-span-3 text-right">
                  <span className={`font-bold text-xl ${getNumberColor(resultadoLiquido)}`}>
                    {formatCurrency(resultadoLiquido)}
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${resultadoLiquido < 0 ? 'text-destructive bg-destructive/20' : 'text-success bg-success/20'}`}>
                    {formatPercent(resultadoLiquido, totalReceitas)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ponto de Equilíbrio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Meta Mensal</span>
                <div className="font-bold text-lg">{formatCurrency(pontoEquilibrio)}</div>
              </div>
              <div className="flex justify-between items-center">
                <span>Diferença para Meta</span>
                <div className="text-right">
                  <div className={`font-bold ${getNumberColor(diferencaMeta)}`}>
                    {formatCurrency(diferencaMeta)}
                  </div>
                  <Badge variant={diferencaMeta < 0 ? "destructive" : "default"} className="text-xs mt-1">
                    {diferencaMeta < 0 ? "Abaixo da meta" : "Acima da meta"}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Dias Úteis Restantes</span>
                <div className="font-bold">{diasUteis} dias</div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-medium">Faturamento Mínimo Diário</span>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(fatMinimoDiario)}</div>
                  <div className="text-xs text-muted-foreground">Para atingir o equilíbrio</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumo de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{contasVencendoHoje}</div>
              <div className="text-sm text-muted-foreground">Contas Vencendo Hoje</div>
            </div>
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(aReceberProximos7Dias)}</div>
              <div className="text-sm text-muted-foreground">A Receber (Próximos 7 dias)</div>
            </div>
            <div className="text-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(aPagarProximos7Dias)}</div>
              <div className="text-sm text-muted-foreground">A Pagar (Próximos 7 dias)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Movimentações Não Operacionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center">
            <span className="flex-1 text-left">Receita Não Operacional</span>
            <span className="font-bold text-right min-w-[140px] text-lg">{formatCurrency(receitaNaoOperacional)}</span>
          </div>
          <div className="flex items-center">
            <span className="flex-1 text-left">Despesa Não Operacional</span>
            <span className="font-bold text-right min-w-[140px] text-lg text-destructive">{formatCurrency(despesaNaoOperacional)}</span>
          </div>
          <hr className="my-2 border-t" />
          <div className="flex items-center">
            <span className="font-medium flex-1 text-left">Resultado Não Operacional</span>
            <span className={`font-bold text-right min-w-[140px] text-lg ${getNumberColor(resultadoNaoOperacional)}`}>{formatCurrency(resultadoNaoOperacional)}</span>
          </div>
          <div className="flex items-center bg-muted/30 p-3 rounded-lg mt-2">
            <span className="font-bold flex-1 text-lg">Resultado Geral Líquido</span>
            <span className={`font-bold text-xl text-right min-w-[140px] ${getNumberColor(resultadoGeralLiquido)}`}>{formatCurrency(resultadoGeralLiquido)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}