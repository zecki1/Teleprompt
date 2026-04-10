"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SignupWithPasswordProps {
  onSwitchToLogin: () => void;
}

const SignupWithPassword: React.FC<SignupWithPasswordProps> = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!name.trim()) throw new Error("O nome é obrigatório.");
      if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");

      await signUp(email, password, name);
      toast.success("Conta criada! Redirecionando...");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar conta.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input 
          id="name" 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Seu nome" 
          required 
          disabled={loading} 
          className="bg-background/50"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-signup">E-mail</Label>
        <Input 
          id="email-signup" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="seu@email.com" 
          required 
          disabled={loading} 
          className="bg-background/50"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-signup">Senha</Label>
        <div className="relative">
          <Input
            id="password-signup"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            className="pr-10 bg-background/50"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full font-semibold shadow-lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Cadastrar"
        )}
      </Button>
    </form>
  );
};

export default SignupWithPassword;
