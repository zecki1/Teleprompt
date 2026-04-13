"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SigninWithPassword from "@/components/auth/SigninWithPassword";
import SignupWithPassword from "@/components/auth/SignupWithPassword";
import { useRouter, useSearchParams } from "next/navigation";
import PageTransitionLoader from "@/components/PageTransitionLoader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-4 right-4 z-20 text-foreground/70 hover:text-foreground"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Mudar tema"
    >
      {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
    </Button>
  );
};

export default function LoginPage() {
  const { user, loading, joinWorkspace } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const inviteWorkspaceId = searchParams.get("workspaceId") || undefined;
  
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (inviteWorkspaceId && !user.workspaces?.includes(inviteWorkspaceId)) {
        joinWorkspace(inviteWorkspaceId).then(() => {
          router.replace(redirectPath);
        });
      } else {
        router.replace(redirectPath);
      }
    }
  }, [user, loading, router, redirectPath, inviteWorkspaceId, joinWorkspace]);

  if (loading) {
    return <PageTransitionLoader />;
  }

  if (user) {
    return <PageTransitionLoader />;
  }

  const formVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden font-sans">
      <ThemeSwitcher />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full mx-auto shadow-2xl rounded-2xl border overflow-hidden"
      >
        <div className="z-10">
          <Card className="w-full h-full bg-background/80 dark:bg-background/70 backdrop-blur-sm border-0 rounded-2xl px-4">
            <CardHeader className="text-center pt-8">
              {inviteWorkspaceId && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 text-left"
                >
                  <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">Convite Recebido</AlertTitle>
                    <AlertDescription className="text-xs">
                      Você foi convidado para participar de um workspace! Faça login ou crie sua conta para aceitar.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              <CardTitle className="text-3xl font-bold">{isSignup ? "Crie sua Conta" : "Bem-vindo(a)!"}</CardTitle>
              <CardDescription>{isSignup ? "Preencha os campos para começar." : "Faça login para acessar seu painel."}</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isSignup ? (
                  <motion.div key="signup" variants={formVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <SignupWithPassword onSwitchToLogin={() => setIsSignup(false)} inviteWorkspaceId={inviteWorkspaceId} />
                  </motion.div>
                ) : (
                  <motion.div key="signin" variants={formVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <SigninWithPassword onSwitchToSignup={() => setIsSignup(true)} inviteWorkspaceId={inviteWorkspaceId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
            <CardFooter className="flex justify-center text-sm pb-8 pt-4">
              {isSignup ? (
                <p>Já tem uma conta? <button onClick={() => setIsSignup(false)} className="font-semibold text-primary hover:underline">Faça o login</button></p>
              ) : (
                <p>Não tem uma conta? <button onClick={() => setIsSignup(true)} className="font-semibold text-primary hover:underline">Cadastre-se</button></p>
              )}
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
