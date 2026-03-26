"use client";

import { Text } from "@/components/providers/preferences-provider";

export function SiteFooter() {
    return (
        <footer className="border-t py-6 bg-muted/20 mt-auto">
            <div className="container mx-auto text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} SuperTemplate Inc.
                <span className="ml-1">
                    <Text pt="Todos os direitos reservados." en="All rights reserved." es="Todos los derechos reservados." />
                </span>
            </div>
        </footer>
    );
}