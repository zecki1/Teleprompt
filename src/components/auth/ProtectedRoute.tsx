"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
