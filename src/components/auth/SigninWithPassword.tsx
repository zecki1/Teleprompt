"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SigninWithPasswordProps {
  onSwitchToSignup: () => void;
}
 
const SigninWithPassword: React.FC<SigninWithPasswordProps> = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const onSigninSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SigninWithPassword] Form submitted");
    console.log("[SigninWithPassword] Email:", email);
    // console.log("[SigninWithPassword] Password length:", password.length); // log length instead of plain password for security
    setLoading(true);
    try {
      console.log("[SigninWithPassword] Calling signIn context function...");
      await signIn(email, password);
      console.log("[SigninWithPassword] signIn returned successfully");
      toast.success("Login realizado com sucesso!");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error("[SigninWithPassword] Detailed error:", error);
      console.error("[SigninWithPassword] Error code:", error?.code);
      console.error("[SigninWithPassword] Error message:", error?.message);
      toast.error(`Erro ao entrar: ${error?.message || "Verifique suas credenciais."}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("Por favor, digite seu e-mail para redefinir a senha.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("E-mail de redefinição enviado!");
    } catch {
      toast.error("Erro ao enviar e-mail de redefinição.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSigninSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
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
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Senha</Label>
          <button 
            type="button" 
            onClick={handlePasswordReset} 
            className="text-xs text-primary hover:underline font-medium"
          >
            Esqueceu a senha?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
            className="pr-10 bg-background/50"
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full font-semibold shadow-lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
};

export default SigninWithPassword;
