"use client";

import Script from 'next/script';

// Tipagem local
declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
        vw?: string;
        'vw-access-button'?: string;
        'vw-plugin-wrapper'?: string;
    }
}

declare global {
    interface Window {
        VLibras: {
            Widget: new (src: string) => void;
        };
    }
}

export function VlibrasWidget() {
    return (
        <>
            <div vw="true" className="enabled left">
                <div vw-access-button="true" className="active" />
                <div vw-plugin-wrapper="true">
                    <div className="vw-plugin-top-wrapper" />
                </div>
            </div>

            <Script
                src="https://vlibras.gov.br/app/vlibras-plugin.js"
                strategy="lazyOnload"
                onLoad={() => {
                    if (window.VLibras) {
                        new window.VLibras.Widget('https://vlibras.gov.br/app');
                    }
                }}
            />
        </>
    );
}