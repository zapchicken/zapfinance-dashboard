import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Select as ShadSelect, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useReceitas } from "@/hooks/useReceitas";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

export default function ContasReceber() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: contasData, isLoading: loading, refetch: fetchContas } = useReceitas();
  const contas = useMemo(() => contasData || [], [contasData]);
  
  // Debug para verificar dados do hook
  console.log('🔍 Debug hook useReceitas:', {
    contasData: contasData?.length || 0,
    contas: contas.length,
    loading,
    contasDataIsArray: Array.isArray(contasData),
    contasIsArray: Array.isArray(contas)
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filtroDataReceita, setFiltroDataReceita] = useState("");
  const [filtroDataRecebimento, setFiltroDataRecebimento] = useState("");
  const [filtroModalidade, setFiltroModalidade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroBanco, setFiltroBanco] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    cliente_nome: "",
    categoria_id: "",
    valor: "",
    data_vencimento: "",
    data_recebimento: "",
    observacoes: "",
    status: "pendente",
    banco_id: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [modalidadesReceita, setModalidadesReceita] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);
  const [tipoReceita, setTipoReceita] = useState<'operacional' | 'nao_operacional'>('operacional');

  const MODALIDADES = [
    { nome: 'Crédito', regra: 'D+1_uteis' },
    { nome: 'Débito', regra: 'D+1_uteis' },
    { nome: 'Dinheiro', regra: 'D+0' },
    { nome: 'Ifood', regra: 'quarta_pos_semana' },
    { nome: 'Ifood Voucher', regra: 'quarta_pos_semana' },
    { nome: 'Pix', regra: 'D+0' },
    { nome: 'Cortesia', regra: 'D+0' },
  ];
  const [obs, setObs] = useState("");
  const [dataReceita, setDataReceita] = useState("");

  // Mapeamento padrão de bancos por modalidade
  const BANCO_PADRAO_MODALIDADE: Record<string, string> = {
    'Crédito': 'INTER',
    'Débito': 'INTER',
    'Pix': 'INTER',
    'Cortesia': 'INTER',
    'Ifood': 'IFOOD',
    'Ifood Voucher': 'IFOOD',
    'Dinheiro': 'CAIXA',
  };

  // Estado para modalidades e valores
  const [modalidadesValores, setModalidadesValores] = useState(
    MODALIDADES.map(m => ({
      nome: m.nome,
      valor: "",
      taxa: "",
      banco_id: BANCO_PADRAO_MODALIDADE[m.nome] || ""
    }))
  );

  useEffect(() => {
    if (user) {
      fetchContas();
      fetchCategorias();
      if (user) fetchModalidadesReceita();
      fetchBancos();
    }
  }, [user]);

  // Atualizar modalidadesValores quando abrir o formulário e bancos estiverem carregados
  useEffect(() => {
    if (isDialogOpen && !editId && bancos.length > 0 && modalidadesReceita.length > 0) {
      setModalidadesValores(MODALIDADES.map(m => {
        const found = modalidadesReceita.find((mod: any) => mod.nome.toLowerCase() === m.nome.toLowerCase());
        const bancoPadrao = bancos.find(b => b.nome.toUpperCase() === BANCO_PADRAO_MODALIDADE[m.nome])?.id || "";
        return {
          nome: m.nome,
          valor: "",
          taxa: found ? String(found.taxa_percentual) : "",
          banco_id: bancoPadrao
        };
      }));
    }
  }, [isDialogOpen, bancos, editId, modalidadesReceita]);

  

  const fetchCategorias = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('tipo', 'receita')
      .eq('user_id', user.id)
      .order('nome');
    if (!error) setCategorias(data || []);
  };

  const fetchModalidadesReceita = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('modalidades_receita')
      .select('*')
      .eq('user_id', user.id);
    if (!error && data) {
      setModalidadesReceita(data);
      // Preencher taxas automaticamente
      setModalidadesValores(prev => prev.map(m => {
        const found = data.find((mod: any) => mod.nome.toLowerCase() === m.nome.toLowerCase());
        return {
          ...m,
          taxa: found ? String(found.taxa_percentual) : m.taxa
        };
      }));
    }
  };

  const fetchBancos = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .eq('user_id', user.id)
      .order('nome');
    if (!error) setBancos(data || []);
  };

  // Atualizar handleModalidadeChange para aceitar banco_id
  const handleModalidadeChange = (idx: number, field: string, value: string) => {
    setModalidadesValores(prev => prev.map((m, i) => {
      if (i === idx) {
        if (field === 'valor') {
          // Para o campo valor, permitir operações matemáticas
          return { ...m, [field]: value };
        } else {
          return { ...m, [field]: value };
        }
      }
      return m;
    }));
  };

  function calcularDataVencimento(dataBase: string, regra: string) {
    // regra: D+0, D+1, D+30
    const match = regra.match(/^D\+(\d+)$/);
    if (!dataBase || !match) return dataBase;
    const dias = parseInt(match[1], 10);
    const data = new Date(dataBase);
    data.setDate(data.getDate() + dias);
    return data.toISOString().split('T')[0];
  }

  function calcularDataRecebimento(dataBase: string, regra: string) {
    if (!dataBase) return '';
    const [ano, mes, dia] = dataBase.split('-').map(Number);
    if (regra === 'D+0') {
      // Sempre retorna exatamente a data da receita
      const yyyy = ano;
      const mm = String(mes).padStart(2, '0');
      const dd = String(dia).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (regra === 'D+1_uteis') {
      // Sempre adiciona 1 dia, depois pula para o próximo dia útil se necessário
      let data = new Date(ano, mes - 1, dia);
      data.setDate(data.getDate() + 1);
      while (data.getDay() === 0 || data.getDay() === 6) {
        data.setDate(data.getDate() + 1);
      }
      const yyyy = data.getFullYear();
      const mm = String(data.getMonth() + 1).padStart(2, '0');
      const dd = String(data.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    if (regra === 'quarta_pos_semana') {
      let data = new Date(ano, mes - 1, dia);
      const diaSemana = data.getDay();
      data.setDate(data.getDate() + (7 - diaSemana)); // próximo domingo
      data.setDate(data.getDate() + (3)); // próxima quarta-feira
      const yyyy = data.getFullYear();
      const mm = String(data.getMonth() + 1).padStart(2, '0');
      const dd = String(data.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return dataBase;
  }

  // Função para avaliar expressões simples no campo Valor
  function safeEval(expr: string) {
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

  function formatValueForDisplay(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para cadastrar contas a receber.");
      return;
    }

    // Validação e cálculo antes de salvar
    const processedModalidades = modalidadesValores.map(m => ({
      ...m,
      valorCalculado: safeEval(m.valor)
    }));

    // Validação: se valor > 0, banco deve ser selecionado
    for (const m of processedModalidades) {
      if (m.valorCalculado > 0 && !m.banco_id) {
        alert(`Selecione o banco para a modalidade "${m.nome}"`);
        return;
      }
    }

    if (editId) {
      const contaSelecionada = contas.find(c => c.id === editId);
      if (contaSelecionada) {
        const { error: deleteError } = await supabase
          .from('contas_receber')
          .delete()
          .eq('data_vencimento', contaSelecionada.data_vencimento)
          .eq('data_recebimento', contaSelecionada.data_recebimento);
        
        if (deleteError) {
          alert("Erro ao excluir registros antigos: " + deleteError.message);
          return;
        }
      }
    }

    // Inserir novos registros
    for (const [idx, m] of processedModalidades.entries()) {
      if (m.valorCalculado <= 0) continue;

      const valor = m.valorCalculado;
      const taxa = parseFloat(m.taxa) || 0;
      const valorTaxa = valor * (taxa / 100);
      const valorLiquido = valor - valorTaxa;
      const dataVenc = calcularDataVencimento(dataReceita, MODALIDADES[idx].regra);
      const dataReceb = calcularDataRecebimento(dataReceita, MODALIDADES[idx].regra);
      
      const { error } = await supabase.from('contas_receber').insert({
        descricao: m.nome,
        valor: valor,
        taxa_percentual: taxa,
        valor_taxa: valorTaxa,
        valor_liquido: valorLiquido,
        data_vencimento: dataVenc,
        data_recebimento: dataReceb,
        status: 'pendente',
        cliente_nome: '',
        categoria_id: null,
        observacoes: obs,
        user_id: user.id,
        banco_id: m.banco_id || null,
        tipo_receita: tipoReceita
      });

      if (error) {
        alert("Erro ao salvar conta: " + error.message);
        return;
      }
    }
    
    setIsDialogOpen(false);
    setDataReceita("");
    setModalidadesValores(MODALIDADES.map(m => ({ 
      nome: m.nome, 
      valor: "", 
      taxa: "", 
      banco_id: bancos.find(b => b.nome.toUpperCase() === BANCO_PADRAO_MODALIDADE[m.nome])?.id || "" 
    })));
    setEditId(null);
    fetchContas();
  };

  const handleEdit = (contaSelecionada: any) => {
    // Filtrar todas as contas do mesmo grupo/data/receita
    const grupoModalidades = contas.filter(
      c => c.data_vencimento === contaSelecionada.data_vencimento && c.data_recebimento === contaSelecionada.data_recebimento
    );

    // Mapear para o formato de modalidadesValores
    setModalidadesValores(MODALIDADES.map(m => {
      const encontrada = grupoModalidades.find(c => c.descricao === m.nome);
      return {
        nome: m.nome,
        valor: encontrada ? String(encontrada.valor) : "",
        taxa: encontrada ? String(encontrada.taxa_percentual ?? encontrada.taxa ?? "") : "",
        banco_id: encontrada ? String(encontrada.banco_id) : ""
      };
    }));

    setDataReceita(contaSelecionada.data_vencimento); // ou outro campo de data
    setObs(contaSelecionada.observacoes || "");
    setEditId(contaSelecionada.id);
    setIsDialogOpen(true);
    if (contaSelecionada.tipo_receita === 'operacional') setTipoReceita('operacional');
    else if (contaSelecionada.tipo_receita === 'nao_operacional') setTipoReceita('nao_operacional');
  };

  const handleView = (contaSelecionada: any) => {
    // Filtrar todas as contas do mesmo grupo/data/receita
    const grupoModalidades = contas.filter(
      c => c.data_vencimento === contaSelecionada.data_vencimento && c.data_recebimento === contaSelecionada.data_recebimento
    );

    // Mapear para o formato de modalidadesValores
    setModalidadesValores(MODALIDADES.map(m => {
      const encontrada = grupoModalidades.find(c => c.descricao === m.nome);
      return {
        nome: m.nome,
        valor: encontrada ? String(encontrada.valor) : "",
        taxa: encontrada ? String(encontrada.taxa_percentual ?? encontrada.taxa ?? "") : "",
        banco_id: encontrada ? String(encontrada.banco_id) : ""
      };
    }));

    setDataReceita(contaSelecionada.data_vencimento);
    setObs(contaSelecionada.observacoes || "");
    setViewId(contaSelecionada.id);
    setIsDialogOpen(true);
    if (contaSelecionada.tipo_receita === 'operacional') setTipoReceita('operacional');
    else if (contaSelecionada.tipo_receita === 'nao_operacional') setTipoReceita('nao_operacional');
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;
    const { error } = await supabase.from('contas_receber').delete().eq('id', id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
    } else {
      alert("Erro ao excluir conta: " + error.message);
    }
  };

  const { primeiroDia, ultimoDia } = useMemo(() => {
    if (mesSelecionado === 'todos') {
      return { 
        primeiroDia: new Date(2020, 0, 1), // Data muito antiga
        ultimoDia: new Date(2030, 11, 31)   // Data muito futura
      };
    }
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    return { 
        primeiroDia: new Date(ano, mes - 1, 1), 
        ultimoDia: new Date(ano, mes, 0) 
    };
  }, [mesSelecionado]);

  const contasFiltradas = useMemo(() => {
    if (!contas) {
      console.log('❌ Contas é null/undefined');
      return [];
    }
    
    console.log('🔍 Debug filtro:', {
      totalContas: contas.length,
      mesSelecionado,
      primeiroDia: primeiroDia.toISOString(),
      ultimoDia: ultimoDia.toISOString(),
      searchTerm,
      filtroModalidade,
      filtroStatus,
      filtroBanco,
      primeiroDiaFormatado: primeiroDia.toLocaleDateString('pt-BR'),
      ultimoDiaFormatado: ultimoDia.toLocaleDateString('pt-BR'),
      contasIsArray: Array.isArray(contas),
      contasType: typeof contas
    });
    
    // Debug: mostrar todas as contas carregadas
    console.log('📋 Todas as contas carregadas:', contas.map(c => ({
      id: c.id,
      descricao: c.descricao,
      valor: c.valor,
      data_vencimento: c.data_vencimento,
      data_recebimento: c.data_recebimento,
      status: c.status,
      banco_id: c.banco_id
    })));
    
    const filtradas = contas
      .filter(conta => {
        // Filtro de busca por texto
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            String(conta.descricao || "").toLowerCase().includes(searchLower) ||
            String(conta.cliente_nome || "").toLowerCase().includes(searchLower) ||
            String(conta.categorias?.nome || "").toLowerCase().includes(searchLower);

        // Filtro por modalidade (descrição)
        const matchesModalidade = !filtroModalidade || 
            String(conta.descricao || "").toLowerCase().includes(filtroModalidade.toLowerCase());

        // Filtro por status
        const matchesStatus = !filtroStatus || 
            String(conta.status || "").toLowerCase() === filtroStatus.toLowerCase();

        // Filtro por banco
        const matchesBanco = !filtroBanco || 
            conta.banco_id === filtroBanco;

        // Filtro por data (mês selecionado)
        const dataReferencia = conta.data_recebimento || conta.data_vencimento;
        if (!dataReferencia) {
          console.log('❌ Conta sem data_recebimento nem data_vencimento:', conta.descricao);
          return false;
        }
        
        const data = new Date(dataReferencia + 'T00:00:00');
        const matchesDate = data >= primeiroDia && data <= ultimoDia;
        
        if (!matchesDate) {
          console.log('❌ Conta fora do período:', {
            descricao: conta.descricao,
            data_vencimento: conta.data_vencimento,
            data_recebimento: conta.data_recebimento,
            data_usada: dataReferencia,
            dataFormatada: data.toLocaleDateString('pt-BR'),
            primeiroDia: primeiroDia.toLocaleDateString('pt-BR'),
            ultimoDia: ultimoDia.toLocaleDateString('pt-BR'),
            dentroDoPeriodo: matchesDate
          });
        }

        return matchesSearch && matchesModalidade && matchesStatus && matchesBanco && matchesDate;
      })
      .sort((a, b) => {
        const dataA = a.data_recebimento || a.data_vencimento;
        const dataB = b.data_recebimento || b.data_vencimento;
        if (!dataA) return 1;
        if (!dataB) return -1;
        return dataB.localeCompare(dataA);
      });
    
    console.log('✅ Contas filtradas:', filtradas.length);
    console.log('📋 Contas que passaram no filtro:', filtradas.map(c => ({
      id: c.id,
      descricao: c.descricao,
      valor: c.valor,
      data_vencimento: c.data_vencimento,
      data_recebimento: c.data_recebimento,
      status: c.status,
      banco_id: c.banco_id
    })));
    return filtradas;
  }, [contas, searchTerm, filtroModalidade, filtroStatus, filtroBanco, mesSelecionado, primeiroDia, ultimoDia]);

  // Cards de resumo
  const totalPendente = contasFiltradas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalRecebido = contasFiltradas.filter(c => c.status === 'recebido').reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalGeral = contasFiltradas.reduce((sum, c) => sum + (c.valor || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading || !user) {
    return <div className="flex justify-center items-center h-64">Carregando usuário...</div>;
  }

  // Totais da tabela de contas a receber (usando contasFiltradas)
  const totalValor = contasFiltradas.reduce((sum, c) => sum + (c.valor || 0), 0);
  const totalTaxa = contasFiltradas.reduce((sum, c) => sum + (c.valor_taxa || 0), 0);
  const totalLiquido = contasFiltradas.reduce((sum, c) => sum + (c.valor_liquido || 0), 0);

  // Totais do formulário de Nova Receita por Modalidade
  const totalValorModalidades = modalidadesValores.reduce((sum, m) => {
    const valor = safeEval(m.valor);
    return sum + valor;
  }, 0);
  const totalTaxaModalidades = modalidadesValores.reduce((sum, m) => {
    const valor = safeEval(m.valor);
    const taxa = parseFloat(m.taxa.replace(/,/g, '.')) || 0;
    return sum + (valor * (taxa / 100));
  }, 0);
  const totalLiquidoModalidades = modalidadesValores.reduce((sum, m) => {
    const valor = safeEval(m.valor);
    const taxa = parseFloat(m.taxa.replace(/,/g, '.')) || 0;
    return sum + (valor - (valor * (taxa / 100)));
  }, 0);

  const handleValorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < modalidadesValores.length) {
        const nextInput = document.getElementById(`valor-${nextIndex}`);
        nextInput?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        const prevInput = document.getElementById(`valor-${prevIndex}`);
        prevInput?.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Navegar para o próximo campo ao pressionar Enter
      const nextIndex = currentIndex + 1;
      if (nextIndex < modalidadesValores.length) {
        const nextInput = document.getElementById(`valor-${nextIndex}`);
        nextInput?.focus();
      } else {
        // Se for o último campo, focar no botão Salvar
        const saveButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        saveButton?.focus();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-muted-foreground">Gestão de receitas e recebimentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData({ descricao: '', cliente_nome: '', categoria_id: '', valor: '', data_vencimento: '', data_recebimento: '', observacoes: '', status: 'pendente', banco_id: "" });
            setEditId(null);
          }
        }}>
          {viewId === null && (
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editId ? "Editar Conta" : <><Plus className="h-4 w-4 mr-2" /> Nova Conta a Receber</>}
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="w-full max-w-3xl bg-white rounded-xl overflow-x-auto p-4 mx-auto" style={{ minWidth: 0 }}>
            <DialogHeader>
              <DialogTitle>
                {viewId ? "Visualizar Conta a Receber" : editId ? "Editar Conta a Receber" : "Nova Receita por Modalidade"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {viewId === null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  💡 <strong>Dica:</strong> Use as setas ↑↓ para navegar entre os campos de valor. 
                  O formulário só será salvo quando você clicar no botão "Salvar Receita".
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="data_receita">Data da Receita</Label>
                <Input
                  id="data_receita"
                  type="date"
                  value={dataReceita}
                  onChange={e => setDataReceita(e.target.value)}
                  required
                  disabled={viewId !== null}
                />
              </div>
              <div className="space-y-4">
                <Label>Tipo de Receita:</Label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="tipo_receita" value="operacional" checked={tipoReceita === 'operacional'} onChange={() => setTipoReceita('operacional')} disabled={viewId !== null} /> Receita Operacional
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="tipo_receita" value="nao_operacional" checked={tipoReceita === 'nao_operacional'} onChange={() => setTipoReceita('nao_operacional')} disabled={viewId !== null} /> Receita Não Operacional
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-1 text-left min-w-[90px]">Modalidade</th>
                        <th className="p-1 text-right min-w-[80px]">Valor</th>
                        <th className="p-1 text-right min-w-[70px]">Taxa (%)</th>
                        <th className="p-1 text-right min-w-[90px]">Valor da Taxa</th>
                        <th className="p-1 text-right min-w-[90px]">Valor Líquido</th>
                        <th className="p-1 text-center min-w-[100px]">Data de Recebimento</th>
                        <th className="p-1 text-center min-w-[100px]">Banco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalidadesValores.map((m, idx) => {
                        const valor = safeEval(m.valor);
                        const taxa = parseFloat(m.taxa) || 0;
                        const valorTaxa = valor * (taxa / 100);
                        const valorLiquido = valor - valorTaxa;
                        const dataRecebimento = calcularDataRecebimento(dataReceita, MODALIDADES[idx].regra);
                        return (
                          <tr key={m.nome} className="border-b">
                            <td className="p-1 font-medium text-left">{m.nome}</td>
                            <td className="p-1 text-right min-w-[80px]">
                              <Input
                                id={`valor-${idx}`}
                                type="text"
                                value={m.valor}
                                onChange={e => handleModalidadeChange(idx, 'valor', e.target.value)}
                                onKeyDown={e => handleValorKeyDown(e, idx)}
                                placeholder="0,00"
                                title="Digite valores ou operações matemáticas (ex: 100,50+50,25-25, 100*1,1, 200/2). Use ↑↓ para navegar entre campos."
                                className="w-20 text-right h-8 px-2 py-1"
                                disabled={viewId !== null}
                                autoComplete="off"
                              />
                            </td>
                            <td className="p-1 text-right min-w-[70px]">
                              <Input
                                type="number"
                                step="0.01"
                                value={m.taxa}
                                onChange={e => handleModalidadeChange(idx, 'taxa', e.target.value)}
                                className="w-14 text-right h-8 px-2 py-1 bg-gray-100 cursor-not-allowed"
                                disabled={viewId !== null}
                                readOnly // Impede a edição do campo de taxa
                              />
                            </td>
                            <td className="p-1 text-right min-w-[90px]">
                              <Input
                                type="text"
                                value={valorTaxa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                readOnly
                                className="w-20 bg-gray-100 cursor-not-allowed text-right h-8 px-2 py-1"
                              />
                            </td>
                            <td className="p-1 text-right min-w-[90px]">
                              <Input
                                type="text"
                                value={valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                readOnly
                                className="w-20 bg-gray-100 cursor-not-allowed text-right h-8 px-2 py-1"
                              />
                            </td>
                            <td className="p-1 text-center min-w-[100px]">
                              <Input
                                type="text"
                                value={dataRecebimento ? (() => { const [y, m, d] = dataRecebimento.split('-'); return `${d}/${m}/${y}` })() : ''}
                                readOnly
                                className="w-24 bg-gray-100 cursor-not-allowed text-center h-8 px-2 py-1"
                              />
                            </td>
                            <td className="p-1 text-center min-w-[100px]">
                              <select
                                id={`banco-${idx}`}
                                className="w-24 border rounded px-2 py-1 h-8"
                                value={m.banco_id || ""}
                                onChange={e => handleModalidadeChange(idx, 'banco_id', e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    const nextIndex = idx + 1;
                                    if (nextIndex < modalidadesValores.length) {
                                      const nextInput = document.getElementById(`valor-${nextIndex}`);
                                      nextInput?.focus();
                                    }
                                  }
                                }}
                                disabled={viewId !== null}
                              >
                                <option value="">Banco</option>
                                {bancos.map(banco => (
                                  <option key={banco.id} value={banco.id}>{banco.nome}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-muted font-bold">
                        <td className="p-1 text-left">Totais:</td>
                        <td className="p-1 text-right">{totalValorModalidades.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="p-1 text-right"></td>
                        <td className="p-1 text-right">{totalTaxaModalidades.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="p-1 text-right">{totalLiquidoModalidades.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td className="p-1 text-center"></td>
                        <td className="p-1 text-center"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="obs">Observação</Label>
                <textarea
                  id="obs"
                  className="w-full border rounded px-3 py-2 min-h-[60px]"
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                  placeholder="Observações gerais do lançamento"
                  disabled={viewId !== null}
                />
              </div>
              <div className="flex gap-2 pt-4">
                {viewId === null && (
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    title="Clique aqui para salvar os dados (não salva automaticamente)"
                  >
                    💾 Salvar Receita
                  </Button>
                )}
                <Button type="button" variant="outline" className="flex-1" onClick={() => { 
                  setIsDialogOpen(false); 
                  setEditId(null);
                  setViewId(null);
                }}>
                  {viewId !== null ? "Fechar" : "Cancelar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totalPendente)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasFiltradas.filter(c => c.status === 'pendente').length} contas
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalRecebido)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasFiltradas.filter(c => c.status === 'recebido').length} contas
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalGeral)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasFiltradas.length} contas no total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
            {/* Busca por texto */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por descrição ou cliente"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filtro por Modalidade */}
            <div>
              <Label htmlFor="filtro-modalidade" className="text-sm text-muted-foreground">Modalidade</Label>
              <select
                id="filtro-modalidade"
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background"
              >
                <option value="">Todas as modalidades</option>
                <option value="Crédito">Crédito</option>
                <option value="Débito">Débito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Ifood">Ifood</option>
                <option value="Ifood Voucher">Ifood Voucher</option>
                <option value="Pix">Pix</option>
                <option value="Cortesia">Cortesia</option>
              </select>
            </div>

            {/* Filtro por Status */}
            <div>
              <Label htmlFor="filtro-status" className="text-sm text-muted-foreground">Status</Label>
              <select
                id="filtro-status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background"
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="recebido">Recebido</option>
              </select>
            </div>

            {/* Filtro por Banco */}
            <div>
              <Label htmlFor="filtro-banco" className="text-sm text-muted-foreground">Banco</Label>
              <select
                id="filtro-banco"
                value={filtroBanco}
                onChange={(e) => setFiltroBanco(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background"
              >
                <option value="">Todos os bancos</option>
                {bancos.map(banco => (
                  <option key={banco.id} value={banco.id}>{banco.nome}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Mês */}
            <div>
              <Label htmlFor="filtro-mes" className="text-sm text-muted-foreground">Mês</Label>
              <select
                id="filtro-mes"
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2 bg-background"
              >
                <option value="todos">Todas as receitas</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const data = new Date(new Date().getFullYear(), i, 1);
                  const valor = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
                  return (
                    <option key={valor} value={valor}>
                      {data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Botão Limpar Filtros */}
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFiltroModalidade("");
                  setFiltroStatus("");
                  setFiltroBanco("");
                  setMesSelecionado(() => {
                    const hoje = new Date();
                    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
                  });
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabela de contas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Modalidade</th>
                  <th className="text-right p-4 font-medium">Valor</th>
                  <th className="text-right p-4 font-medium">Taxa (%)</th>
                  <th className="text-right p-4 font-medium">Valor da Taxa</th>
                  <th className="text-right p-4 font-medium">Valor Líquido</th>
                  <th className="text-center p-4 font-medium">Data da Receita</th>
                  <th className="text-center p-4 font-medium">Data de Recebimento</th>
                  <th className="text-center p-4 font-medium">Banco</th>
                  <th className="text-center p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contasFiltradas.map((conta) => (
                  <tr key={conta.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{conta.descricao}</td>
                    <td className="p-4 text-right font-mono">{formatCurrency(conta.valor)}</td>
                    <td className="p-4 text-right">{(conta.taxa_percentual ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-right">{formatCurrency(conta.valor_taxa ?? 0)}</td>
                    <td className="p-4 text-right">{formatCurrency(conta.valor_liquido ?? 0)}</td>
                    <td className="p-4 text-center">{conta.data_vencimento ? (() => { const [y, m, d] = conta.data_vencimento.split('-'); return `${d}/${m}/${y}` })() : '-'}</td>
                    <td className="p-4 text-center">{conta.data_recebimento ? (() => { const [y, m, d] = conta.data_recebimento.split('-'); return `${d}/${m}/${y}` })() : '-'}</td>
                    <td className="p-4 text-center">{bancos.find(b => b.id === conta.banco_id)?.nome || '-'}</td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleView(conta)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(conta)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(conta.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted font-bold">
                  <td className="p-2 text-right" colSpan={1}>Totais:</td>
                  <td className="p-2 text-right">{formatCurrency(totalValor)}</td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right">{formatCurrency(totalTaxa)}</td>
                  <td className="p-2 text-right">{formatCurrency(totalLiquido)}</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                </tr>
              </tbody>
            </table>
            {contasFiltradas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conta cadastrada
                <br />
                <small className="text-xs">
                  Total de contas carregadas: {contas?.length || 0} | 
                  Mês selecionado: {mesSelecionado} | 
                  Filtro de busca: "{searchTerm}"
                </small>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}