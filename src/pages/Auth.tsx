import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock } from "lucide-react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  // Verificar se há parâmetros na URL para reset de senha
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'reset') {
      setMode('reset');
    }
  }, []);

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
    } else if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Cadastro realizado! Verifique seu email para confirmar.");
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      if (error) setError(error.message);
      else setSuccess("Email de redefinição enviado! Verifique sua caixa de entrada.");
    } else if (mode === "reset") {
      if (newPassword !== confirmPassword) {
        setError("As senhas não coincidem");
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) setError(error.message);
      else {
        setSuccess("Senha atualizada com sucesso!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {mode === "login" ? "Entrar" : 
             mode === "signup" ? "Criar Conta" : 
             mode === "forgot" ? "Esqueci minha senha" : 
             "Redefinir Senha"}
          </CardTitle>
          {mode === "forgot" && (
            <p className="text-sm text-muted-foreground text-center">
              Digite seu email para receber um link de redefinição de senha
            </p>
          )}
          {mode === "reset" && (
            <p className="text-sm text-muted-foreground text-center">
              Digite sua nova senha
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Seu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {mode === "login" && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            )}
            {mode === "signup" && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            )}
            {mode === "reset" && (
              <>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </>
            )}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : 
               mode === "login" ? "Entrar" : 
               mode === "signup" ? "Cadastrar" : 
               mode === "forgot" ? "Enviar email de redefinição" :
               "Redefinir senha"}
            </Button>
          </form>
          
          <div className="text-center mt-4 space-y-2">
            {mode === "login" ? (
              <>
                <div>
                  <button 
                    className="text-primary underline text-sm" 
                    onClick={() => setMode("forgot")}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div>
                  Não tem conta?{' '}
                  <button className="text-primary underline" onClick={() => setMode("signup")}>
                    Cadastre-se
                  </button>
                </div>
              </>
            ) : mode === "signup" ? (
              <div>
                Já tem conta?{' '}
                <button className="text-primary underline" onClick={() => setMode("login")}>
                  Entrar
                </button>
              </div>
            ) : (
              <div>
                <button 
                  className="text-primary underline flex items-center gap-1 mx-auto" 
                  onClick={() => setMode("login")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}