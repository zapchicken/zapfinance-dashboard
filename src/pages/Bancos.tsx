import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Trash2, ArrowRightLeft, Calendar, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toISODateLocal } from "@/utils/date";
import { useToast } from "@/hooks/use-toast";

export default function Bancos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bancos, setBancos] = useState<any[]>([]);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "conta_corrente",
    saldo_inicial: "",
    data_inicial: ""
  });
  const [transferData, setTransferData] = useState({
    banco_origem_id: "",
    banco_destino_id: "",
    valor: "",
    descricao: "",
    data_transferencia: toISODateLocal(new Date())
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBancos();
      fetchTransferencias();
    }
  }, [user]);

  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  const fetchBancos = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('bancos')
      .select('*')
      .eq('user_id', user.id)
      .order('nome');
      
    if (!error) setBancos(data || []);
    setLoading(false);
  };

  const fetchTransferencias = async () => {
    const { data, error } = await supabase
      .from('transferencias')
      .select(`
        *,
        banco_origem:bancos!banco_origem_id(nome),
        banco_destino:bancos!banco_destino_id(nome)
      `)
      .order('created_at', { ascending: false });
      
    if (!error) setTransferencias(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para cadastrar bancos.", variant: "destructive" });
      return;
    }
    
    // Validar tipo
    const tiposPermitidos = ['conta_corrente', 'poupanca', 'cartao_credito', 'investimento'];
    if (!tiposPermitidos.includes(formData.tipo)) {
      toast({ title: "Erro", description: "Tipo de conta inválido.", variant: "destructive" });
      return;
    }
    
    const saldoInicial = parseFloat(formData.saldo_inicial) || 0;
    
    if (editId) {
      // Edição
      const updateData: any = {
        user_id: user.id,
        nome: formData.nome,
        tipo: formData.tipo,
        saldo_inicial: saldoInicial,
        ativo: true
      };
      
      // Adicionar data_inicial apenas se não estiver vazia
      if (formData.data_inicial) {
        // Converter para data ISO e pegar apenas a parte da data (YYYY-MM-DD)
        const dataInicial = formData.data_inicial;
        updateData.data_inicial = dataInicial;
      }
      
      const { error, data } = await supabase.from('bancos').update(updateData).eq('id', editId);
      
      if (!error) {
        setIsDialogOpen(false);
        setFormData({ nome: '', tipo: 'conta_corrente', saldo_inicial: '', data_inicial: '' });
        setEditId(null);
        fetchBancos();
        toast({ title: "Sucesso", description: "Banco atualizado com sucesso!" });
      } else {
        toast({ title: "Erro", description: "Erro ao editar banco: " + error.message, variant: "destructive" });
      }
    } else {
      // Cadastro
      const insertData: any = {
        user_id: user.id,
        nome: formData.nome,
        tipo: formData.tipo,
        saldo_inicial: saldoInicial,
        saldo_atual: saldoInicial,
        ativo: true
      };
      
      // Adicionar data_inicial apenas se não estiver vazia
      if (formData.data_inicial) {
        // Converter para data ISO e pegar apenas a parte da data (YYYY-MM-DD)
        const dataInicial = formData.data_inicial;
        insertData.data_inicial = dataInicial;
      }
      
      const { error, data } = await supabase.from('bancos').insert(insertData);
      
      if (!error) {
        setIsDialogOpen(false);
        setFormData({ nome: '', tipo: 'conta_corrente', saldo_inicial: '', data_inicial: '' });
        fetchBancos();
        toast({ title: "Sucesso", description: "Banco cadastrado com sucesso!" });
      } else {
        toast({ title: "Erro", description: "Erro ao cadastrar banco: " + error.message, variant: "destructive" });
      }
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferData.banco_origem_id || !transferData.banco_destino_id || !transferData.valor) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    if (transferData.banco_origem_id === transferData.banco_destino_id) {
      toast({ title: "Erro", description: "Não é possível transferir para o mesmo banco.", variant: "destructive" });
      return;
    }

    const valor = parseFloat(transferData.valor);
    if (isNaN(valor) || valor <= 0) {
      toast({ title: "Erro", description: "Valor inválido.", variant: "destructive" });
      return;
    }

    // Buscar saldo do banco origem
    const bancoOrigem = bancos.find(b => b.id === transferData.banco_origem_id);
    if (!bancoOrigem) {
      toast({ title: "Erro", description: "Banco origem não encontrado.", variant: "destructive" });
      return;
    }

    if (bancoOrigem.saldo_atual < valor) {
      toast({ title: "Erro", description: "Saldo insuficiente no banco origem.", variant: "destructive" });
      return;
    }

    try {
      // Atualizar saldo do banco origem (diminuir)
      const { error: errorOrigem } = await supabase
        .from('bancos')
        .update({ saldo_atual: bancoOrigem.saldo_atual - valor })
        .eq('id', transferData.banco_origem_id);

      if (errorOrigem) throw errorOrigem;

      // Atualizar saldo do banco destino (aumentar)
      const bancoDestino = bancos.find(b => b.id === transferData.banco_destino_id);
      const { error: errorDestino } = await supabase
        .from('bancos')
        .update({ saldo_atual: bancoDestino.saldo_atual + valor })
        .eq('id', transferData.banco_destino_id);

      if (errorDestino) throw errorDestino;

      // Registrar transferência
      const { error: errorTransfer } = await supabase
        .from('transferencias')
        .insert({
          banco_origem_id: transferData.banco_origem_id,
          banco_destino_id: transferData.banco_destino_id,
          valor: valor,
          descricao: transferData.descricao,
          data_transferencia: transferData.data_transferencia
        });

      if (errorTransfer) throw errorTransfer;

      setIsTransferDialogOpen(false);
      setTransferData({
        banco_origem_id: "",
        banco_destino_id: "",
        valor: "",
        descricao: "",
        data_transferencia: toISODateLocal(new Date())
      });
      fetchBancos();
      fetchTransferencias();
      toast({ title: "Sucesso", description: "Transferência realizada com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro", description: "Erro ao realizar transferência: " + error.message, variant: "destructive" });
    }
  };

  const handleEdit = (banco: any) => {
    setEditId(banco.id);
    setFormData({
      nome: banco.nome,
      tipo: banco.tipo,
      saldo_inicial: banco.saldo_inicial?.toString() || "",
      data_inicial: banco.data_inicial || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banco?")) return;
    
    const { error } = await supabase.from('bancos').delete().eq('id', id).eq('user_id', user.id);
    
    if (!error) {
      fetchBancos();
      toast({ title: "Sucesso", description: "Banco excluído com sucesso!" });
    } else {
      toast({ title: "Erro", description: "Erro ao excluir banco: " + error.message, variant: "destructive" });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  function formatDateLocal(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    try {
      // Garantir que a data seja tratada corretamente
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateStr; // Retorna a string original se houver erro
    }
  }

  const filteredBancos = bancos.filter(banco =>
    banco.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSaldos = bancos.reduce((sum, banco) => sum + (banco.saldo_atual || 0), 0);
  const contasCorrentes = bancos.filter(banco => banco.tipo === 'conta_corrente');
  const maiorSaldo = bancos.reduce((max, banco) => 
    (banco.saldo_atual || 0) > (max?.saldo_atual || 0) ? banco : max, null
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bancos</h1>
          <p className="text-muted-foreground">Gerencie suas contas bancárias e transferências</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transferir
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Transferência entre Bancos</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTransfer} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="bancoOrigem">Banco Origem</Label>
                  <Select 
                    value={transferData.banco_origem_id} 
                    onValueChange={(value) => setTransferData({ ...transferData, banco_origem_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancos.map((banco) => (
                        <SelectItem key={banco.id} value={banco.id}>
                          {banco.nome} - Saldo: {formatCurrency(banco.saldo_atual || 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bancoDestino">Banco Destino</Label>
                  <Select 
                    value={transferData.banco_destino_id} 
                    onValueChange={(value) => setTransferData({ ...transferData, banco_destino_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancos.map((banco) => (
                        <SelectItem key={banco.id} value={banco.id}>
                          {banco.nome} - Saldo: {formatCurrency(banco.saldo_atual || 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valorTransferencia">Valor</Label>
                  <Input
                    id="valorTransferencia"
                    type="number"
                    step="0.01"
                    value={transferData.valor}
                    onChange={(e) => setTransferData({ ...transferData, valor: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricaoTransferencia">Descrição (Opcional)</Label>
                  <Input
                    id="descricaoTransferencia"
                    value={transferData.descricao}
                    onChange={(e) => setTransferData({ ...transferData, descricao: e.target.value })}
                    placeholder="Ex: Transferência para pagar contas"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataTransferencia">Data da Transferência</Label>
                  <Input
                    id="dataTransferencia"
                    type="date"
                    value={transferData.data_transferencia}
                    onChange={(e) => setTransferData({ ...transferData, data_transferencia: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                    Confirmar Transferência
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsTransferDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setFormData({ nome: '', tipo: 'conta_corrente', saldo_inicial: '', data_inicial: '' });
              setEditId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editId ? "Editar Banco" : <><Plus className="h-4 w-4 mr-2" /> Novo Banco</>}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Banco" : "Cadastrar Novo Banco"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeBanco">Nome do Banco</Label>
                  <Input
                    id="nomeBanco"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Nubank"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Conta</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saldoInicial">Saldo Inicial</Label>
                  <Input
                    id="saldoInicial"
                    type="number"
                    step="0.01"
                    value={formData.saldo_inicial}
                    onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_inicial">Data Inicial (Opcional)</Label>
                  <Input
                    id="data_inicial"
                    type="date"
                    value={formData.data_inicial}
                    onChange={e => setFormData({ ...formData, data_inicial: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    {editId ? "Salvar Alterações" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => { setIsDialogOpen(false); setEditId(null); }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Bancos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {bancos.length}
            </div>
            <p className="text-xs text-muted-foreground">contas cadastradas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalSaldos)}
            </div>
            <p className="text-xs text-muted-foreground">em todas as contas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contas Correntes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {contasCorrentes.length}
            </div>
            <p className="text-xs text-muted-foreground">contas ativas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maior Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {maiorSaldo ? formatCurrency(maiorSaldo.saldo_atual) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {maiorSaldo ? maiorSaldo.nome : 'Nenhum banco'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Bancos e Transferências */}
      <Tabs defaultValue="bancos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bancos">Bancos</TabsTrigger>
          <TabsTrigger value="transferencias">Transferências</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bancos" className="space-y-4">
          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Pesquisar Bancos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar bancos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de bancos */}
          <div className="grid gap-4">
            {filteredBancos.map((banco) => (
              <Card key={banco.id} className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{banco.nome}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {banco.tipo.replace('_', ' ')}
                    </p>
                    {banco.data_inicial && (
                      <p className="text-xs text-muted-foreground">
                        Desde: {formatDateLocal(banco.data_inicial)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">{formatCurrency(banco.saldo_atual || 0)}</p>
                    <p className="text-xs text-muted-foreground">Saldo atual</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(banco)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(banco.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transferencias" className="space-y-4">
          {/* Resumo de transferências */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Transferências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {transferencias.length}
                </div>
                <p className="text-xs text-muted-foreground">transferências realizadas</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(transferencias.reduce((sum, t) => sum + (t.valor || 0), 0))}
                </div>
                <p className="text-xs text-muted-foreground">em transferências</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Última Transferência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {transferencias.length > 0 ? formatDateLocal(transferencias[0].data_transferencia) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">data da última</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de transferências */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transferências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transferencias.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma transferência realizada ainda</p>
                    <p className="text-sm">Clique em "Transferir" para fazer sua primeira transferência</p>
                  </div>
                ) : (
                  transferencias.map((transferencia) => (
                    <div key={transferencia.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {transferencia.banco_origem?.nome} → {transferencia.banco_destino?.nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transferencia.descricao || 'Transferência'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateLocal(transferencia.data_transferencia)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-blue-600">
                          {formatCurrency(transferencia.valor)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}