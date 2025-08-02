import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else {
        setSuccess("Login realizado com sucesso!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Cadastro realizado! Verifique seu email para confirmar.");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {mode === "login" ? "Entrar" : "Criar Conta"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
            </Button>
          </form>
          <div className="text-center mt-4">
            {mode === "login" ? (
              <span>
                Não tem conta?{' '}
                <button className="text-primary underline" onClick={() => setMode("signup")}>Cadastre-se</button>
              </span>
            ) : (
              <span>
                Já tem conta?{' '}
                <button className="text-primary underline" onClick={() => setMode("login")}>Entrar</button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}