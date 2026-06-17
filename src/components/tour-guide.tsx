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

export function TourGuide() {
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const [hasSeen, setHasSeen] = useState(true);

  const tourConfig = getTourByPath(pathname);

  useEffect(() => {
    if (!tourConfig) return;
    const seen = localStorage.getItem(tourConfig.tourKey);
    if (!seen) {
      setHasSeen(false);
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
    setHasSeen(true);
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
      setHasSeen(true);
      if (tourConfig) {
        localStorage.setItem(tourConfig.tourKey, "1");
      }
    }
  }, [tourConfig]);

  const startTour = () => {
    if (tourConfig) {
      localStorage.removeItem(tourConfig.tourKey);
    }
    setRun(true);
  };

  if (!tourConfig) return null;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={startTour}
        className="rounded-full w-8 h-8"
        title="Tour guiado"
      >
        <HelpCircle className="w-4 h-4 text-blue-500" />
      </Button>
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
