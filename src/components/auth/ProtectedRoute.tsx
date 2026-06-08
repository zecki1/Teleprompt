"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/services/schemas";
import { LoadingScreen } from "@/components/PageTransitionLoader";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: Role[];
  fallbackPath?: string;
}

const publicPaths = ["/login", "/", "/contato", "/s/"];

export function ProtectedRoute({ 
  children, 
  requiredRoles = ["editor", "validador"],
  fallbackPath = "/login" 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    
    if (!user && !isPublicPath) {
      router.push(fallbackPath);
      return;
    }

    if (user && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router, fallbackPath, requiredRoles]);

  if (loading) return <LoadingScreen />;

  if (!user) {
    return null;
  }

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
