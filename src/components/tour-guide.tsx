"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTourByPath } from "@/lib/tour-steps";

const Joyride = dynamic(
  () => import("react-joyride").then((m) => ({ default: m.Joyride })),
  { ssr: false }
);

const HIDDEN_KEY = "teleprompt_tourguide_hidden";

export function TourGuide() {
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const [hidden, setHidden] = useState(true);

  const tourConfig = getTourByPath(pathname);

  useEffect(() => {
    if (!tourConfig) return;
    const h = localStorage.getItem(HIDDEN_KEY) === "1";
    setHidden(h);
    if (h) return;
    const seen = localStorage.getItem(tourConfig.tourKey);
    if (!seen) {
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [tourConfig?.tourKey]);

  const handleJoyrideCallback = useCallback((data: any) => {
    const { type, action } = data;
    if (
      type === "tour:end" ||
      type === "error" ||
      action === "skip" ||
      action === "close" ||
      action === "complete"
    ) {
      setRun(false);
      if (tourConfig) {
        localStorage.setItem(tourConfig.tourKey, "1");
      }
      localStorage.setItem(HIDDEN_KEY, "1");
      setHidden(true);
    }
  }, [tourConfig]);

  const startTour = () => {
    if (tourConfig) {
      localStorage.removeItem(tourConfig.tourKey);
    }
    setRun(true);
  };

  useEffect(() => {
    const handler = () => {
      localStorage.removeItem(HIDDEN_KEY);
      setHidden(false);
      setTimeout(() => startTour(), 100);
    };
    window.addEventListener("tour-guide-show", handler);
    return () => window.removeEventListener("tour-guide-show", handler);
  }, []);

  if (!tourConfig) return null;

  return (
    <>
      {!hidden && (
        <Button
          variant="outline"
          size="icon"
          onClick={startTour}
          className="rounded-full w-8 h-8"
          title="Tour guiado"
        >
          <HelpCircle className="w-4 h-4 text-blue-500" />
        </Button>
      )}
      <Joyride
        steps={tourConfig.steps}
        run={run}
        continuous
        onEvent={handleJoyrideCallback}
        options={{
          primaryColor: "#3b82f6",
          zIndex: 1000,
          showProgress: true,
          buttons: ["back", "close", "primary", "skip"],
        }}
        styles={{
          tooltipContainer: {
            textAlign: "left",
          },
          buttonPrimary: {
            fontSize: 13,
          },
          buttonBack: {
            fontSize: 13,
          },
          buttonSkip: {
            fontSize: 13,
          },
        }}
        locale={{
          back: "Voltar",
          close: "Fechar",
          last: "Finalizar",
          next: "Próximo",
          skip: "Pular",
        }}
      />
    </>
  );
}
