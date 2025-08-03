import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Eye, Edit, Trash2, AlertTriangle, Clock, CheckCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function ContasPagar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    categoria_id: "",
    fornecedor_id: "",
    banco_id: "",
    valor: "",
    data_vencimento: "",
    data_pagamento: "",
    observacoes: "",
    parcelas: 1,
    data_nota_fiscal: "",
    referencia_nota_fiscal: ""
  });
  const [visualizarConta, setVisualizarConta] = useState<any | null>(null);
  const [editandoConta, setEditandoConta] = useState<any | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroVencimentoInicio, setFiltroVencimentoInicio] = useState('');
  const [filtroVencimentoFim, setFiltroVencimentoFim] = useState('');
  const [filtroHoje, setFiltroHoje] = useState(false);
  const [bancos, setBancos] = useState<any[]>([]);
  // Removido tipoDespesa pois não existe na tabela

  // Lista de despesas removida - agora usa as categorias cadastradas no sistema

  useEffect(() => {
    if (user) fetchData();
    if (user) fetchBancos();
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user) return;

      // Carregar categorias e fornecedores primeiro
      const [categoriasResult, fornecedoresResult] = await Promise.all([
        supabase.from('categorias').select('*').eq('tipo', 'despesa'),
        supabase.from('fornecedores').select('*')
      ]);
      console.log('Categorias do Supabase:', categoriasResult.data);
      console.log('Fornecedores do Supabase:', fornecedoresResult.data);
      setCategorias(categoriasResult.data || []);
      setFornecedores(fornecedoresResult.data || []);

      // Carregar contas a pagar (tratar erro separadamente)
      const contasResult = await supabase.from('contas_pagar').select('*');
      console.log('Dados retornados do Supabase:', contasResult.data, contasResult.error);
      if (!contasResult.error) setContasPagar(contasResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const fetchBancos = async () => {
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    if (!error) setBancos(data || []);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função de auto-seleção removida - agora usa as categorias cadastradas

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit chamado', { editandoConta, formData });
    if (!formData.categoria_id) {
      toast({ title: "Erro", description: "Selecione uma categoria", variant: "destructive" });
      return;
    }

    if (!formData.banco_id) {
      toast({ title: "Erro", description: "Selecione um banco", variant: "destructive" });
      return;
    }



    // Validar e processar o valor
    const valorNumerico = parseFloat(formData.valor.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast({ title: "Erro", description: "Valor inválido", variant: "destructive" });
      return;
    }

    // Verificar se o valor não excede o limite máximo do Supabase (999.999.999.999,99)
    const valorMaximo = 999999999999.99;
    if (valorNumerico > valorMaximo) {
      toast({ title: "Erro", description: `Valor máximo permitido é R$ ${formatCurrency(valorMaximo)}`, variant: "destructive" });
      return;
    }

    console.log('Valor processado:', { valorOriginal: formData.valor, valorNumerico, valorMaximo });

    const contaParaEditar = editandoConta;
    if (contaParaEditar) {
      console.log('Entrou no bloco de edição');
      console.log('Atualizando conta:', contaParaEditar.id, formData);
              const { error, data } = await supabase.from('contas_pagar').update({
          descricao: formData.descricao,
          categoria_id: formData.categoria_id || null,
          fornecedor_id: formData.fornecedor_id || null,
          banco_id: formData.banco_id || null,
          valor: valorNumerico,
          data_vencimento: formData.data_vencimento,
          data_pagamento: formData.data_pagamento || null,
          observacoes: formData.observacoes,
          status: formData.data_pagamento ? 'pago' : 'pendente',
          data_nota_fiscal: formData.data_nota_fiscal || null,
          referencia_nota_fiscal: formData.referencia_nota_fiscal || null
        }).eq('id', contaParaEditar.id);
      console.log('Resultado update:', { error, data });
      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível atualizar a conta', variant: 'destructive' });
        return;
      }
      setEditandoConta(null);
      setIsDialogOpen(false);
      setFormData({ descricao: "", categoria_id: "", fornecedor_id: "", banco_id: "", valor: "", data_vencimento: "", data_pagamento: "", observacoes: "", parcelas: 1, data_nota_fiscal: "", referencia_nota_fiscal: "", tipo_despesa: "operacional" });
      fetchData();
      toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso!' });
      console.log('Conta atualizada com sucesso!');
      return;
    }
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      const parcelas = formData.parcelas || 1;
      const valorTotal = valorNumerico;
      const valorParcela = Math.round((valorTotal / parcelas) * 100) / 100;
      
      // Validar valor da parcela
      if (valorParcela > valorMaximo) {
        toast({ title: "Erro", description: `Valor da parcela excede o limite máximo`, variant: "destructive" });
        return;
      }

      console.log('Valores processados:', { valorTotal, valorParcela, parcelas });

      const dataVencimento = new Date(formData.data_vencimento);
      const contasParaInserir = [];
      for (let i = 0; i < parcelas; i++) {
        const vencimento = new Date(dataVencimento);
        vencimento.setMonth(vencimento.getMonth() + i);
        // Buscar nome da categoria selecionada
        const categoriaSelecionada = categorias.find(c => c.id === formData.categoria_id);
        const contaParaInserir: any = {
          user_id: user?.id,
          descricao: categoriaSelecionada ? categoriaSelecionada.nome : 'Sem categoria',
          valor: valorParcela,
          data_vencimento: vencimento.toISOString().split('T')[0],
          status: formData.data_pagamento ? 'pago' : 'pendente'
        };

        // Adicionar observações apenas se não forem vazias
        const observacoesText = parcelas > 1 
          ? `${formData.observacoes || ''} Parcela ${i + 1}/${parcelas}`.trim()
          : formData.observacoes;
        
        if (observacoesText && observacoesText.trim()) {
          contaParaInserir.observacoes = observacoesText;
        }

        // Adicionar campos obrigatórios
        contaParaInserir.categoria_id = formData.categoria_id;
        contaParaInserir.banco_id = formData.banco_id;
        
        // Adicionar campos opcionais apenas se não forem vazios
        if (formData.fornecedor_id) {
          contaParaInserir.fornecedor_id = formData.fornecedor_id;
        }
        if (formData.data_pagamento) {
          contaParaInserir.data_pagamento = formData.data_pagamento;
        }
        if (formData.data_nota_fiscal) {
          contaParaInserir.data_nota_fiscal = formData.data_nota_fiscal;
        }
        if (formData.referencia_nota_fiscal) {
          contaParaInserir.referencia_nota_fiscal = formData.referencia_nota_fiscal;
        }

        console.log(`Conta ${i + 1} para inserir:`, contaParaInserir);
        contasParaInserir.push(contaParaInserir);
      }
      // Inserir todas as parcelas
      console.log('Dados para inserir:', JSON.stringify(contasParaInserir, null, 2));
      const { data, error } = await supabase.from('contas_pagar').insert(contasParaInserir).select();
      if (error) {
        console.error('Erro Supabase insert:', error);
        console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }
      // Removido campos de parcelamento que não existem na tabela
      toast({
        title: "Sucesso",
        description: `Conta${parcelas > 1 ? 's' : ''} a pagar criada${parcelas > 1 ? 's' : ''} com sucesso`
      });
      setIsDialogOpen(false);
      setFormData({
        categoria_id: "",
        fornecedor_id: "",
        valor: "",
        data_vencimento: "",
        data_pagamento: "",
        observacoes: "",
        parcelas: 1,
        data_nota_fiscal: "",
        referencia_nota_fiscal: ""
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta a pagar",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
      
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta a pagar excluída com sucesso"
      });
      
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta a pagar",
        variant: "destructive"
      });
    }
  };

  const marcarComoPago = async (conta: any) => {
    const hoje = new Date();
    // Usar data local sem fuso horário
    const dataPagamento = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const { error } = await supabase.from('contas_pagar').update({
      status: 'pago',
      data_pagamento: dataPagamento
    }).eq('id', conta.id);
    if (!error) {
      fetchData();
      toast({ title: 'Sucesso', description: 'Conta marcada como paga!' });
    } else {
      toast({ title: 'Erro', description: 'Não foi possível marcar como paga', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case "vence_hoje":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vence Hoje
          </Badge>
        );
      case "vencido":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      case "a_vencer":
        return (
          <Badge variant="outline" className="border-primary text-primary">
            <Clock className="h-3 w-3 mr-1" />
            A Vencer
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatus = (conta: any) => {
    if (conta.status === 'pago') return 'pago';
    
    // Criar datas sem fuso horário para comparação correta
    const hoje = new Date();
    const hojeSemFuso = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const vencimento = new Date(conta.data_vencimento);
    const vencimentoSemFuso = new Date(vencimento.getFullYear(), vencimento.getMonth(), vencimento.getDate());
    
    if (vencimentoSemFuso < hojeSemFuso) return 'vencido';
    if (vencimentoSemFuso.getTime() === hojeSemFuso.getTime()) return 'vence_hoje';
    return 'a_vencer';
  };

  const totalVencidas = contasPagar
    .filter(conta => getStatus(conta) === "vencido")
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalVenceHoje = contasPagar
    .filter(conta => getStatus(conta) === "vence_hoje")
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalAVencer = contasPagar
    .filter(conta => getStatus(conta) === "a_vencer")
    .reduce((sum, conta) => sum + conta.valor, 0);

  const totalPago = contasPagar
    .filter(conta => conta.status === "pago")
    .reduce((sum, conta) => sum + conta.valor, 0);

  // Função para calcular parcelas
  function calcularParcelas(valorTotal: number, parcelas: number, dataVencimento: string) {
    const results = [];
    if (!valorTotal || !parcelas || !dataVencimento) return results;
    const valorParcela = Math.round((valorTotal / parcelas) * 100) / 100;
    const dataBase = new Date(dataVencimento);
    for (let i = 0; i < parcelas; i++) {
      const venc = new Date(dataBase);
      venc.setMonth(venc.getMonth() + i);
      results.push({
        numero: i + 1,
        total: parcelas,
        valor: valorParcela,
        vencimento: venc.toISOString().split('T')[0]
      });
    }
    return results;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  console.log('Categorias no render:', categorias);
  const contasOrdenadas = [...contasPagar].sort((a, b) => {
    // Ordenar por data de vencimento (mais antiga primeiro - ordem crescente)
    const dateA = new Date(a.data_vencimento);
    const dateB = new Date(b.data_vencimento);
    return dateA.getTime() - dateB.getTime();
  });

  const contasFiltradas = contasOrdenadas.filter(conta => {
    let ok = true;
    if (filtroStatus) {
      if (filtroStatus === 'vence_hoje') {
        const hoje = new Date();
        const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        ok = ok && conta.data_vencimento === dataHoje;
      } else if (filtroStatus === 'vencido' || filtroStatus === 'a_vencer') {
        const hoje = new Date();
        const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
        if (filtroStatus === 'vencido') ok = ok && conta.data_vencimento < dataHoje && conta.status !== 'pago';
        if (filtroStatus === 'a_vencer') ok = ok && conta.data_vencimento > dataHoje && conta.status !== 'pago';
      } else {
        ok = ok && conta.status === filtroStatus;
      }
    }
    if (filtroVencimentoInicio) ok = ok && conta.data_vencimento >= filtroVencimentoInicio;
    if (filtroVencimentoFim) ok = ok && conta.data_vencimento <= filtroVencimentoFim;
    return ok && (
      String(conta.descricao || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      categorias.find(c => c.id === conta.categoria_id)?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fornecedores.find(f => f.id === conta.fornecedor_id)?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gestão de despesas e vencimentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta a Pagar
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[70%] max-w-[70%]">
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
              <DialogDescription>
                Preencha os dados da conta a pagar
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
              {/* Campo descrição removido - será preenchido automaticamente baseado na categoria */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={formData.categoria_id} 
                  onValueChange={(value) => {
                    const categoriaSelecionada = categorias.find(cat => cat.id === value);
                    setFormData({
                      ...formData, 
                      categoria_id: value,
                      descricao: categoriaSelecionada ? categoriaSelecionada.nome : ""
                    });
                  }} 
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.length === 0 && (
                      <div className="p-2 text-muted-foreground">Nenhuma categoria encontrada</div>
                    )}
                    {categorias.map(categoria => (
                      <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select value={formData.fornecedor_id} onValueChange={(value) => setFormData({...formData, fornecedor_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</SelectItem>
                    ))}
                  </SelectContent>
                                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="banco">Banco</Label>
                <Select value={formData.banco_id} onValueChange={(value) => setFormData({...formData, banco_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map(banco => (
                      <SelectItem key={banco.id} value={banco.id}>{banco.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcelas">Parcelamento</Label>
                <Select
                  value={String(formData.parcelas)}
                  onValueChange={(value) => setFormData({ ...formData, parcelas: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Número de parcelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}x</SelectItem>
                    ))}
                  </SelectContent>
                                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_nota_fiscal">Data Nota Fiscal</Label>
                <Input
                  id="data_nota_fiscal"
                  type="date"
                  value={formData.data_nota_fiscal}
                  onChange={(e) => setFormData({...formData, data_nota_fiscal: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencia_nota_fiscal">Referência da Nota Fiscal</Label>
                <Input
                  id="referencia_nota_fiscal"
                  value={formData.referencia_nota_fiscal}
                  onChange={(e) => setFormData({...formData, referencia_nota_fiscal: e.target.value})}
                  placeholder="Referência da nota fiscal"
                />
              </div>
              <div className="space-y-2 col-span-5">
                <Label htmlFor="data_pagamento">Data de Pagamento</Label>
                <Input
                  id="data_pagamento"
                  type="date"
                  value={formData.data_pagamento}
                  onChange={(e) => setFormData({...formData, data_pagamento: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-5">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais"
                />
              </div>
              {/* Campo banco_id adicionado para fluxo de caixa */}
              {/* Removido tipo de despesa pois não existe na tabela */}
              {/* Preview das parcelas */}
              <div className="col-span-5">
                {formData.valor && formData.parcelas && formData.data_vencimento && (
                  <div className="bg-muted rounded p-3 mb-2">
                    <div className="font-semibold mb-1">Parcelas:</div>
                    <ul className="text-sm space-y-1">
                      {calcularParcelas(Number(formData.valor), formData.parcelas, formData.data_vencimento).map((p) => (
                        <li key={p.numero}>
                          Parcela {p.numero} de {p.total} - R$ {p.valor.toFixed(2)} - Vencimento: {p.vencimento.split('-').reverse().join('/')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 col-span-5">
                <Button type="submit" className="flex-1" onClick={() => console.log('Botão Salvar clicado')}>Salvar</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalVencidas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasPagar.filter(c => getStatus(c) === "vencido").length} contas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vence Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(totalVenceHoje)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasPagar.filter(c => getStatus(c) === "vence_hoje").length} contas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalAVencer)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasPagar.filter(c => getStatus(c) === "a_vencer").length} contas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalPago)}
            </div>
            <p className="text-xs text-muted-foreground">
              {contasPagar.filter(c => c.status === "pago").length} contas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(totalVencidas > 0 || totalVenceHoje > 0) && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Atenção aos Vencimentos</span>
            </div>
            <div className="space-y-1 text-sm">
              {totalVenceHoje > 0 && (
                <p>• {formatCurrency(totalVenceHoje)} em contas vencendo hoje</p>
              )}
              {totalVencidas > 0 && (
                <p className="text-destructive">• {formatCurrency(totalVencidas)} em contas vencidas</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, fornecedor ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex flex-col">
              <Label className="mb-1">Status</Label>
              <select
                className="border rounded px-2 py-1"
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
                <option value="a_vencer">A Vencer</option>
                <option value="vence_hoje">Vence Hoje</option>
              </select>
            </div>
            <div className="flex flex-col">
              <Label className="mb-1">Vencimento</Label>
              <div className="flex gap-2 items-center">
                <Button type="button" variant={filtroHoje ? 'default' : 'outline'} size="sm" onClick={() => {
                  if (!filtroHoje) {
                    const hoje = new Date();
                    const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
                    setFiltroVencimentoInicio(dataHoje);
                    setFiltroVencimentoFim(dataHoje);
                  } else {
                    setFiltroVencimentoInicio('');
                    setFiltroVencimentoFim('');
                  }
                  setFiltroHoje(!filtroHoje);
                }}>
                  Hoje
                </Button>
                <Input
                  type="date"
                  value={filtroVencimentoInicio}
                  onChange={e => { setFiltroVencimentoInicio(e.target.value); setFiltroHoje(false); }}
                  placeholder="Início"
                />
                <span>-</span>
                <Input
                  type="date"
                  value={filtroVencimentoFim}
                  onChange={e => { setFiltroVencimentoFim(e.target.value); setFiltroHoje(false); }}
                  placeholder="Fim"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de contas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Descrição</th>
                  <th className="text-left p-4 font-medium">Categoria</th>
                  <th className="text-left p-4 font-medium">Fornecedor</th>
                  <th className="text-left p-4 font-medium">Vencimento</th>
                  {/* Removido campo banco pois não existe na tabela */}
                  <th className="text-right p-4 font-medium">Valor</th>
                  <th className="text-center p-4 font-medium">Status</th>
                  <th className="text-center p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contasFiltradas.map((conta) => (
                  <tr key={conta.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">
                      {conta.descricao}
                    </td>
                    <td className="p-4">{categorias.find(c => c.id === conta.categoria_id)?.nome || 'Sem categoria'}</td>
                    <td className="p-4">{fornecedores.find(f => f.id === conta.fornecedor_id)?.nome || 'Sem fornecedor'}</td>
                    <td className="p-4">{conta.data_vencimento ? conta.data_vencimento.split('-').reverse().join('/') : '-'}</td>
                    {/* Removido campo banco pois não existe na tabela */}
                    <td className="p-4 text-right font-mono">
                      {formatCurrency(conta.valor)}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(getStatus(conta))}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setVisualizarConta(conta)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditandoConta(conta);
                          setFormData({
                            descricao: categorias.find(c => c.id === conta.categoria_id)?.nome || conta.descricao,
                            categoria_id: conta.categoria_id,
                            fornecedor_id: conta.fornecedor_id,
                            valor: String(conta.valor),
                            data_vencimento: conta.data_vencimento,
                            data_pagamento: conta.data_pagamento || "",
                            observacoes: conta.observacoes || "",
                            parcelas: 1,
                            data_nota_fiscal: conta.data_nota_fiscal || "",
                            referencia_nota_fiscal: conta.referencia_nota_fiscal || ""
                            // Removido tipo_despesa pois não existe na tabela
                          });
                                  // Removido tipoDespesa pois não existe na tabela
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => handleDelete(conta.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => marcarComoPago(conta)} title="Marcar como Pago">
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de visualização */}
      <Dialog open={!!visualizarConta} onOpenChange={open => !open && setVisualizarConta(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
            <DialogDescription>
              Visualize os detalhes da conta selecionada
            </DialogDescription>
          </DialogHeader>
          {visualizarConta && (
            <div className="space-y-2">
              <div><b>Descrição:</b> {visualizarConta.descricao}</div>
              <div><b>Categoria:</b> {categorias.find(c => c.id === visualizarConta.categoria_id)?.nome || 'Sem categoria'}</div>
              <div><b>Fornecedor:</b> {fornecedores.find(f => f.id === visualizarConta.fornecedor_id)?.nome || 'Sem fornecedor'}</div>
              <div><b>Valor:</b> R$ {Number(visualizarConta.valor).toFixed(2)}</div>
              <div><b>Vencimento:</b> {new Date(visualizarConta.data_vencimento).toLocaleDateString('pt-BR')}</div>
                              <div><b>Status:</b> {visualizarConta.status}</div>
                <div><b>Observações:</b> {visualizarConta.observacoes}</div>
                <div><b>Data Nota Fiscal:</b> {visualizarConta.data_nota_fiscal ? new Date(visualizarConta.data_nota_fiscal).toLocaleDateString('pt-BR') : '-'}</div>
                <div><b>Referência Nota Fiscal:</b> {visualizarConta.referencia_nota_fiscal || '-'}</div>
              </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}