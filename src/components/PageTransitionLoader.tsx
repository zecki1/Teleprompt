"use client";

import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import { usePathname } from "next/navigation";

export default function PageTransitionLoader() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(true);
    const [dots, setDots] = useState(".");

    useEffect(() => {
      const showTimer = setTimeout(() => setVisible(true), 0);
      const hideTimer = setTimeout(() => setVisible(false), 2000);
      const dotsTimer = setInterval(() => {
          setDots(prev => prev.length >= 3 ? "." : prev + ".");
      }, 500);

      return () => {
          clearTimeout(showTimer);
          clearTimeout(hideTimer);
          clearInterval(dotsTimer);
      };
    }, [pathname]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-5">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                    <div className="relative p-4 rounded-full bg-primary/5 border border-primary/20">
                        <Hourglass className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "2s" }} />
                    </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground tracking-widest">
                    Carregando{dots}
                </p>
            </div>
        </div>
    );
}
