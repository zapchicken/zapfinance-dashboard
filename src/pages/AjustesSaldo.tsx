import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseDateSafe } from "@/utils/date";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Banco {
  id: string;
  nome: string;
  saldo_atual: number;
  saldo_inicial: number;
}

interface AjusteSaldo {
  id: string;
  banco_id: string;
  saldo_anterior: number;
  saldo_novo: number;
  diferenca: number;
  motivo: string;
  observacoes?: string;
  data_ajuste: string;
  banco: {
    nome: string;
  };
}

interface Transacao {
  id: string;
  banco_id: string;
  categoria_id?: string;
  fornecedor_id?: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa' | 'transferencia';
  data_transacao: string;
  status: 'pendente' | 'efetivada' | 'cancelada';
  observacoes?: string;
  created_at: string;
  updated_at: string;
  banco?: {
    nome: string;
  };
  categoria?: {
    nome: string;
  };
  fornecedor?: {
    nome: string;
  };
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface Fornecedor {
  id: string;
  nome: string;
}

export default function AjustesSaldo() {
  console.log('🔄 Componente AjustesSaldo renderizado');
  
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [ajustes, setAjustes] = useState<AjusteSaldo[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBanco, setSelectedBanco] = useState<string>("");
  const [selectedBancoFilter, setSelectedBancoFilter] = useState<string>("todos");
  const [dataInicial, setDataInicial] = useState<string>("");
  const [dataFinal, setDataFinal] = useState<string>("");
  const [saldoAtual, setSaldoAtual] = useState<number>(0);
  const [saldoNovo, setSaldoNovo] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para edição de transação
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
  const [editForm, setEditForm] = useState({
    descricao: "",
    valor: "",
    tipo: "despesa" as 'receita' | 'despesa' | 'transferencia',
    data_transacao: "",
    status: "efetivada" as 'pendente' | 'efetivada' | 'cancelada',
    categoria_id: "",
    fornecedor_id: "",
    observacoes: ""
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔄 useEffect executado, user:', user);
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }
    console.log('✅ Usuário autenticado, chamando fetchData');
    fetchData();
  }, [user]);

  const fetchData = async () => {
    console.log('🔄 Iniciando fetchData...');
    setLoading(true);
    try {
      // Buscar bancos
      console.log('📊 Buscando bancos...');
      const { data: bancosData, error: bancosError } = await supabase
        .from('bancos')
        .select('*')
        .eq('ativo', true)
        .eq('user_id', user.id)
        .order('nome');
      
      if (bancosError) {
        console.error('❌ Erro ao buscar bancos:', bancosError);
        throw bancosError;
      }
      
             console.log('✅ Bancos carregados:', bancosData);
       console.log('🔍 DEBUG - Detalhes dos bancos:', bancosData?.map(b => ({
         id: b.id,
         nome: b.nome,
         user_id: b.user_id,
         saldo_inicial: b.saldo_inicial,
         saldo_atual: b.saldo_atual,
         ativo: b.ativo,
         created_at: b.created_at
       })));
       setBancos(bancosData || []);

      // Buscar ajustes
      console.log('📊 Buscando ajustes...');
      const { data: ajustesData, error: ajustesError } = await (supabase as any)
        .from('ajustes_saldo')
        .select(`
          *,
          banco: bancos(nome)
        `)
        .eq('user_id', user.id)
        .order('data_ajuste', { ascending: false });
      
      if (ajustesError) {
        console.error('❌ Erro ao buscar ajustes:', ajustesError);
        throw ajustesError;
      }
      
      console.log('✅ Ajustes carregados:', ajustesData);
      setAjustes(ajustesData || [] as any);

      // Buscar transações
      console.log('📊 Buscando transações...');
      const { data: transacoesData, error: transacoesError } = await (supabase as any)
        .from('transacoes')
        .select(`
          *,
          banco: bancos(nome),
          categoria: categorias(nome),
          fornecedor: fornecedores(nome)
        `)
        .eq('user_id', user.id)
        .order('data_transacao', { ascending: false });
      
      if (transacoesError) {
        console.error('❌ Erro ao buscar transações:', transacoesError);
        throw transacoesError;
      }
      
      console.log('✅ Transações carregadas:', transacoesData);
      setTransacoes(transacoesData || [] as any);

      // Buscar categorias
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');
      setCategorias(categoriasData || []);

      // Buscar fornecedores
      const { data: fornecedoresData } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');
      setFornecedores(fornecedoresData || []);
      
      console.log('✅ fetchData concluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBancoChange = (bancoId: string) => {
    setSelectedBanco(bancoId);
    const banco = bancos.find(b => b.id === bancoId);
    if (banco) {
      setSaldoAtual(banco.saldo_atual);
      setSaldoNovo(banco.saldo_atual.toString());
    }
  };

  const handleSubmit = async () => {
    if (!selectedBanco || !saldoNovo || !motivo) {
      toast({
        title: "Aviso",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const saldoNovoNum = parseFloat(saldoNovo);
    if (isNaN(saldoNovoNum)) {
      toast({
        title: "Aviso",
        description: "Saldo novo deve ser um número válido",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const diferenca = saldoNovoNum - saldoAtual;
      
      const { error } = await (supabase as any)
        .from('ajustes_saldo')
        .insert({
          user_id: user?.id,
          banco_id: selectedBanco,
          saldo_anterior: saldoAtual,
          saldo_novo: saldoNovoNum,
          diferenca: diferenca,
          motivo: motivo,
          observacoes: observacoes || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ajuste de saldo realizado com sucesso!",
      });

      // Limpar formulário
      setSelectedBanco("");
      setSaldoAtual(0);
      setSaldoNovo("");
      setMotivo("");
      setObservacoes("");
      setDialogOpen(false);

      // Recarregar dados
      await fetchData();
    } catch (error) {
      console.error('Erro ao realizar ajuste:', error);
      toast({
        title: "Erro",
        description: "Erro ao realizar ajuste de saldo",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Funções para edição de transações
  const handleEditTransacao = (transacao: Transacao) => {
    setEditingTransacao(transacao);
    setEditForm({
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      data_transacao: transacao.data_transacao,
      status: transacao.status,
      categoria_id: transacao.categoria_id || "",
      fornecedor_id: transacao.fornecedor_id || "",
      observacoes: transacao.observacoes || ""
    });
    setEditDialogOpen(true);
  };

  const handleUpdateTransacao = async () => {
    if (!editingTransacao) return;

    const valor = parseFloat(editForm.valor);
    if (isNaN(valor)) {
      toast({
        title: "Aviso",
        description: "Valor deve ser um número válido",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('transacoes')
        .update({
          descricao: editForm.descricao,
          valor: valor,
          tipo: editForm.tipo,
          data_transacao: editForm.data_transacao,
          status: editForm.status,
          categoria_id: editForm.categoria_id || null,
          fornecedor_id: editForm.fornecedor_id || null,
          observacoes: editForm.observacoes || null
        })
        .eq('id', editingTransacao.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });

      setEditDialogOpen(false);
      setEditingTransacao(null);
      await fetchData();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar transação",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransacao = async (transacaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('transacoes')
        .delete()
        .eq('id', transacaoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      });

      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar transações por banco e data
  const transacoesFiltradas = transacoes.filter(t => {
    const bancoMatch = selectedBancoFilter === "todos" || t.banco_id === selectedBancoFilter;
    
    if (!bancoMatch) return false;
    
    // Se não há filtros de data, retorna todas
    if (!dataInicial && !dataFinal) return true;
    
    const dataTransacao = parseDateSafe(t.data_transacao);
    
    // Filtro por data inicial
    if (dataInicial) {
      const dataInicialObj = parseDateSafe(dataInicial);
      dataInicialObj.setHours(0, 0, 0, 0);
      if (dataTransacao < dataInicialObj) return false;
    }
    
    // Filtro por data final
    if (dataFinal) {
      const dataFinalObj = parseDateSafe(dataFinal);
      dataFinalObj.setHours(23, 59, 59, 999);
      if (dataTransacao > dataFinalObj) return false;
    }
    
    return true;
  });

  // Calcular saldos por banco considerando o período dos filtros
  const bancosComSaldoCalculado = useMemo(() => {
    return bancos.map(banco => {
      // Filtrar transações deste banco no período
      const transacoesBanco = transacoes.filter(t => {
        if (t.banco_id !== banco.id) return false;
        
        // Se não há filtros de data, considerar todas as transações
        if (!dataInicial && !dataFinal) return true;
        
        const dataTransacao = parseDateSafe(t.data_transacao);
        
        // Filtro por data inicial
        if (dataInicial) {
          const dataInicialObj = parseDateSafe(dataInicial);
          dataInicialObj.setHours(0, 0, 0, 0);
          if (dataTransacao < dataInicialObj) return false;
        }
        
        // Filtro por data final
        if (dataFinal) {
          const dataFinalObj = parseDateSafe(dataFinal);
          dataFinalObj.setHours(23, 59, 59, 999);
          if (dataTransacao > dataFinalObj) return false;
        }
        
        return true;
      });

      // Calcular movimentações do período (incluindo todas as transações, não apenas efetivadas)
      const totalReceitas = transacoesBanco
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);
      
      const totalDespesas = transacoesBanco
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);

      // Filtrar ajustes de saldo deste banco no período
      const ajustesBanco = ajustes.filter(a => {
        if (a.banco_id !== banco.id) return false;
        
        // Se não há filtros de data, considerar todos os ajustes
        if (!dataInicial && !dataFinal) return true;
        
        const dataAjuste = parseDateSafe(a.data_ajuste);
        
        // Filtro por data inicial
        if (dataInicial) {
          const dataInicialObj = parseDateSafe(dataInicial);
          dataInicialObj.setHours(0, 0, 0, 0);
          if (dataAjuste < dataInicialObj) return false;
        }
        
        // Filtro por data final
        if (dataFinal) {
          const dataFinalObj = parseDateSafe(dataFinal);
          dataFinalObj.setHours(23, 59, 59, 999);
          if (dataAjuste > dataFinalObj) return false;
        }
        
        return true;
      });

      const totalAjustes = ajustesBanco.reduce((sum, a) => sum + a.diferenca, 0);

      // Calcular saldo do período
      const saldoPeriodo = banco.saldo_inicial + totalReceitas - totalDespesas + totalAjustes;

      return {
        ...banco,
        saldo_calculado: saldoPeriodo,
        total_receitas_periodo: totalReceitas,
        total_despesas_periodo: totalDespesas,
        total_ajustes_periodo: totalAjustes,
        transacoes_count: transacoesBanco.length,
        ajustes_count: ajustesBanco.length
      };
    });
  }, [bancos, transacoes, ajustes, dataInicial, dataFinal]);

  // Debug para verificar transações
  console.log('🔍 DEBUG - Transações:', {
    total: transacoes.length,
    filtradas: transacoesFiltradas.length,
    filtroAtual: selectedBancoFilter,
    dataInicial,
    dataFinal,
    bancosCalculados: bancosComSaldoCalculado.map(b => ({
      nome: b.nome,
      saldo_inicial: b.saldo_inicial,
      saldo_calculado: b.saldo_calculado,
      total_receitas: b.total_receitas_periodo,
      total_despesas: b.total_despesas_periodo,
      total_ajustes: b.total_ajustes_periodo
    })),
    transacoes: transacoes.map(t => ({
      id: t.id,
      descricao: t.descricao,
      banco_id: t.banco_id,
      banco_nome: t.banco?.nome,
      data_transacao: t.data_transacao
    }))
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'receita': return 'text-green-600';
      case 'despesa': return 'text-red-600';
      case 'transferencia': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'efetivada': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ajustes de Saldo</h1>
          <p className="text-muted-foreground">Gerencie os saldos das contas bancárias e transações</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Ajuste
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Ajuste de Saldo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="banco">Banco *</Label>
                <Select value={selectedBanco} onValueChange={handleBancoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map(banco => (
                      <SelectItem key={banco.id} value={banco.id}>
                        {banco.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Ajuste de conciliação bancária"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saldo-atual">Saldo Atual</Label>
                  <Input
                    id="saldo-atual"
                    value={formatCurrency(saldoAtual)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="saldo-novo">Novo Saldo *</Label>
                  <Input
                    id="saldo-novo"
                    type="number"
                    step="0.01"
                    value={saldoNovo}
                    onChange={(e) => setSaldoNovo(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value="efetivada" disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efetivada">Efetivada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>

              <Button type="button" onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? "Salvando..." : "Confirmar Ajuste"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

             {/* Resumo dos Bancos */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {bancosComSaldoCalculado.map(banco => (
           <Card key={banco.id}>
             <CardHeader className="pb-2">
               <CardTitle className="flex items-center gap-2 text-lg">
                 <Building2 className="h-5 w-5" />
                 {banco.nome}
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 <div className="flex justify-between">
                   <span className="text-sm text-muted-foreground">
                     {dataInicial || dataFinal ? "Saldo do Período:" : "Saldo Atual:"}
                   </span>
                   <span className="font-bold">{formatCurrency(banco.saldo_calculado)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-sm text-muted-foreground">Saldo Inicial:</span>
                   <span className="text-sm">{formatCurrency(banco.saldo_inicial)}</span>
                 </div>
                 {(dataInicial || dataFinal) && (
                   <>
                     <div className="flex justify-between">
                       <span className="text-sm text-muted-foreground">Receitas:</span>
                       <span className="text-sm text-green-600">+{formatCurrency(banco.total_receitas_periodo)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-muted-foreground">Despesas:</span>
                       <span className="text-sm text-red-600">-{formatCurrency(banco.total_despesas_periodo)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-muted-foreground">Ajustes:</span>
                       <span className={`text-sm ${banco.total_ajustes_periodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {banco.total_ajustes_periodo >= 0 ? '+' : ''}{formatCurrency(banco.total_ajustes_periodo)}
                       </span>
                     </div>
                   </>
                 )}
               </div>
             </CardContent>
           </Card>
         ))}
       </div>

      {/* Transações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transações
            </CardTitle>
                         <div className="flex items-center gap-2">
               <Select value={selectedBancoFilter} onValueChange={setSelectedBancoFilter}>
                 <SelectTrigger className="w-48">
                   <SelectValue placeholder="Filtrar por banco" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="todos">Todos os bancos</SelectItem>
                   {bancos.map(banco => (
                     <SelectItem key={banco.id} value={banco.id}>
                       {banco.nome}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Input
                 type="date"
                 value={dataInicial}
                 onChange={(e) => setDataInicial(e.target.value)}
                 placeholder="Data inicial"
                 className="w-40"
               />
               <Input
                 type="date"
                 value={dataFinal}
                 onChange={(e) => setDataFinal(e.target.value)}
                 placeholder="Data final"
                 className="w-40"
               />
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => {
                   setDataInicial("");
                   setDataFinal("");
                   setSelectedBancoFilter("todos");
                 }}
               >
                 Limpar Filtros
               </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                         {transacoesFiltradas.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 <div>Nenhuma transação encontrada</div>
                 <div className="text-sm mt-2">
                   Total de transações: {transacoes.length} | 
                   Filtro banco: {selectedBancoFilter === "todos" ? "Todos os bancos" : "Banco específico"} |
                   {dataInicial && ` Data inicial: ${dataInicial}`} |
                   {dataFinal && ` Data final: ${dataFinal}`}
                 </div>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoesFiltradas.map(transacao => (
                      <TableRow key={transacao.id}>
                        <TableCell>{formatDate(transacao.data_transacao)}</TableCell>
                        <TableCell>{transacao.banco?.nome}</TableCell>
                        <TableCell className="max-w-xs truncate">{transacao.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTipoColor(transacao.tipo)}>
                            {transacao.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className={getTipoColor(transacao.tipo)}>
                          {transacao.tipo === 'despesa' ? '-' : '+'}{formatCurrency(transacao.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transacao.status)}>
                            {transacao.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTransacao(transacao)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTransacao(transacao.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Ajustes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ajustes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ajuste realizado ainda
              </div>
            ) : (
              ajustes.map(ajuste => (
                <div key={ajuste.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{ajuste.banco.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {ajuste.motivo} • {formatDate(ajuste.data_ajuste)}
                      </div>
                      {ajuste.observacoes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {ajuste.observacoes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {ajuste.diferenca > 0 ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          +{formatCurrency(ajuste.diferenca)}
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {formatCurrency(ajuste.diferenca)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(ajuste.saldo_anterior)} → {formatCurrency(ajuste.saldo_novo)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edição de Transação */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Input
                  id="edit-descricao"
                  value={editForm.descricao}
                  onChange={(e) => setEditForm({...editForm, descricao: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-valor">Valor</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  step="0.01"
                  value={editForm.valor}
                  onChange={(e) => setEditForm({...editForm, valor: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-tipo">Tipo</Label>
                <Select value={editForm.tipo} onValueChange={(value: 'receita' | 'despesa' | 'transferencia') => 
                  setEditForm({...editForm, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-data">Data</Label>
                <Input
                  id="edit-data"
                  type="date"
                  value={editForm.data_transacao}
                  onChange={(e) => setEditForm({...editForm, data_transacao: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editForm.status} onValueChange={(value: 'pendente' | 'efetivada' | 'cancelada') => 
                  setEditForm({...editForm, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="efetivada">Efetivada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-categoria">Categoria</Label>
                <Select value={editForm.categoria_id} onValueChange={(value) => 
                  setEditForm({...editForm, categoria_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-fornecedor">Fornecedor</Label>
                <Select value={editForm.fornecedor_id} onValueChange={(value) => 
                  setEditForm({...editForm, fornecedor_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={editForm.observacoes}
                onChange={(e) => setEditForm({...editForm, observacoes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTransacao} disabled={submitting}>
                {submitting ? "Salvando..." : "Atualizar Transação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 