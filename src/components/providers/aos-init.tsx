"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export const AOSInit = () => {
    useEffect(() => {
        AOS.init({
            duration: 800, // Duração da animação em ms
            once: true, // Animar apenas uma vez ao descer
            easing: 'ease-out-cubic',
            offset: 50, // Começar a animar um pouco antes
        });
    }, []);

    return null;
};