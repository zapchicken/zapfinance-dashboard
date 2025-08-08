import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export default function Receitas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    taxa_percentual: "",
    data_efetivacao: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchModalidades();
  }, [user]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  const fetchModalidades = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('modalidades_receita')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setModalidades(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para cadastrar modalidades.");
      return;
    }
    const taxa = parseFloat(formData.taxa_percentual) || 0;
    if (editId) {
      // Edição
      const { error } = await supabase.from('modalidades_receita').update({
        nome: formData.nome,
        taxa_percentual: taxa,
        data_efetivacao: formData.data_efetivacao || null
      }).eq('id', editId).eq('user_id', user.id);
      if (!error) {
        setIsDialogOpen(false);
        setFormData({ nome: '', taxa_percentual: '', data_efetivacao: '' });
        setEditId(null);
        fetchModalidades();
      } else {
        alert("Erro ao editar modalidade: " + error.message);
      }
    } else {
      // Cadastro
      const { error } = await supabase.from('modalidades_receita').insert({
        user_id: user.id,
        nome: formData.nome,
        taxa_percentual: taxa,
        data_efetivacao: formData.data_efetivacao || null
      });
      if (!error) {
        setFormData({ nome: '', taxa_percentual: '', data_efetivacao: '' });
        setIsDialogOpen(false);
        fetchModalidades();
      } else {
        alert("Erro ao cadastrar modalidade: " + error.message);
      }
    }
  };

  const handleEdit = (modalidade: any) => {
    setFormData({
      nome: modalidade.nome,
      taxa_percentual: String(modalidade.taxa_percentual),
      data_efetivacao: modalidade.data_efetivacao ? modalidade.data_efetivacao.split('T')[0] : ""
    });
    setEditId(modalidade.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta modalidade?')) return;
    const { error } = await supabase.from('modalidades_receita').delete().eq('id', id).eq('user_id', user.id);
    if (!error) {
      fetchModalidades();
    } else {
      alert("Erro ao excluir modalidade: " + error.message);
    }
  };

  const filteredModalidades = modalidades.filter(modalidade =>
    String(modalidade.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para formatar data YYYY-MM-DD para dd/mm/yyyy
  function formatDateLocal(dateStr: string | null | undefined) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  // Cards de resumo
  const taxaZero = modalidades.filter(m => m.taxa_percentual === 0).length;
  const taxaBaixa = modalidades.filter(m => m.taxa_percentual > 0 && m.taxa_percentual <= 5).length;
  const taxaMedia = modalidades.filter(m => m.taxa_percentual > 5 && m.taxa_percentual <= 15).length;
  const taxaAlta = modalidades.filter(m => m.taxa_percentual > 15).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modalidades de Receita</h1>
          <p className="text-muted-foreground">Gerencie as modalidades de recebimento e suas taxas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData({ nome: '', taxa_percentual: '', data_efetivacao: '' });
            setEditId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editId ? "Editar Modalidade" : <><Plus className="h-4 w-4 mr-2" /> Nova Modalidade</>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Modalidade" : "Cadastrar Nova Modalidade de Receita"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="modalidade">Modalidade</Label>
                <Input
                  id="modalidade"
                  placeholder="Ex: VR Benefícios"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxa">Taxa (%)</Label>
                <Input
                  id="taxa"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 12.50"
                  value={formData.taxa_percentual}
                  onChange={(e) => setFormData({ ...formData, taxa_percentual: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataEfetivacao">Data de Efetivação</Label>
                <Input
                  id="dataEfetivacao"
                  type="date"
                  value={formData.data_efetivacao}
                  onChange={(e) => setFormData({ ...formData, data_efetivacao: e.target.value })}
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

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa 0%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {taxaZero}
            </div>
            <p className="text-xs text-muted-foreground">Dinheiro e PIX</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa Baixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {taxaBaixa}
            </div>
            <p className="text-xs text-muted-foreground">0,1% a 5%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {taxaMedia}
            </div>
            <p className="text-xs text-muted-foreground">5,1% a 15%</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa Alta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {taxaAlta}
            </div>
            <p className="text-xs text-muted-foreground">Acima de 15%</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Modalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por modalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Modalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Modalidades de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Modalidade</th>
                  <th className="text-right p-4 font-medium">Taxa (%)</th>
                  <th className="text-center p-4 font-medium">Data Efetivação</th>
                  <th className="text-center p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredModalidades.map((modalidade) => (
                  <tr key={modalidade.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{modalidade.nome}</td>
                    <td className="p-4 text-right">{Number(modalidade.taxa_percentual).toFixed(2)}</td>
                    <td className="p-4 text-center">{formatDateLocal(modalidade.data_efetivacao)}</td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(modalidade)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(modalidade.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredModalidades.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma modalidade cadastrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}