import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIAS = [
  "Despesa Fixa",
  "Custo Variável",
  "Despesa Não Operacional",
  "Investimento"
];

export default function Despesas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    categoria: CATEGORIAS[0]
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchCategorias();
  }, [user]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  const fetchCategorias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('tipo', 'despesa')
      .order('nome');
    if (!error) setCategorias(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para cadastrar categorias.");
      return;
    }
    if (editId) {
      // Edição
      const { error } = await supabase.from('categorias').update({
        user_id: user.id,
        nome: formData.nome.charAt(0).toUpperCase() + formData.nome.slice(1).toLowerCase(),
        tipo: 'despesa',
        categoria: formData.categoria
      }).eq('id', editId);
      if (!error) {
        setIsDialogOpen(false);
        setFormData({ nome: '', categoria: CATEGORIAS[0] });
        setEditId(null);
        fetchCategorias();
      } else {
        alert("Erro ao editar categoria: " + error.message);
      }
    } else {
      // Cadastro
      const { error } = await supabase.from('categorias').insert({
        user_id: user.id,
        nome: formData.nome.charAt(0).toUpperCase() + formData.nome.slice(1).toLowerCase(),
        tipo: 'despesa',
        categoria: formData.categoria
      });
      if (!error) {
        setFormData({ nome: '', categoria: CATEGORIAS[0] });
        setIsDialogOpen(false);
        fetchCategorias();
      } else {
        alert("Erro ao cadastrar categoria: " + error.message);
      }
    }
  };

  const handleEdit = (cat: any) => {
    setFormData({
      nome: cat.nome,
      categoria: cat.categoria
    });
    setEditId(cat.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    const { error } = await supabase.from('categorias').delete().eq('id', id).eq('user_id', user.id);
    if (!error) {
      fetchCategorias();
    } else {
      alert("Erro ao excluir categoria: " + error.message);
    }
  };

  const filteredCategorias = categorias.filter(cat =>
    String(cat.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(cat.categoria || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cards de resumo
  const totalFixa = categorias.filter(c => c.categoria === 'Despesa Fixa').length;
  const totalVariavel = categorias.filter(c => c.categoria === 'Custo Variável').length;
  const totalNaoOp = categorias.filter(c => c.categoria === 'Despesa Não Operacional').length;
  const totalInvestimento = categorias.filter(c => c.categoria === 'Investimento').length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cadastro de Despesas</h1>
          <p className="text-muted-foreground">Gerencie as categorias de despesa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setFormData({ nome: '', categoria: CATEGORIAS[0] });
            setEditId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editId ? "Editar Despesa" : <><Plus className="h-4 w-4 mr-2" /> Nova Despesa</>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="despesa">Nome da Despesa</Label>
                <Input
                  id="despesa"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Conta de Luz"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <select
                  id="categoria"
                  className="w-full border rounded px-3 py-2"
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesa Fixa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalFixa}
            </div>
            <p className="text-xs text-muted-foreground">despesas cadastradas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custo Variável</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalVariavel}
            </div>
            <p className="text-xs text-muted-foreground">despesas cadastradas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesa Não Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {totalNaoOp}
            </div>
            <p className="text-xs text-muted-foreground">despesas cadastradas</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totalInvestimento}
            </div>
            <p className="text-xs text-muted-foreground">despesas cadastradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da despesa ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Nome da Despesa</th>
                  <th className="text-left p-4 font-medium">Categoria</th>
                  <th className="text-center p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategorias.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{cat.nome}</td>
                    <td className="p-4">
                      <span className={
                        cat.categoria === 'Despesa Fixa' ? 'bg-primary/10 text-primary px-2 py-1 rounded' :
                        cat.categoria === 'Custo Variável' ? 'bg-destructive/10 text-destructive px-2 py-1 rounded' :
                        'bg-accent/10 text-accent px-2 py-1 rounded'
                      }>
                        {cat.categoria}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCategorias.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma despesa cadastrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}