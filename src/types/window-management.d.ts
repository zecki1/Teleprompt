// Tipos para a Window Management API (getScreenDetails / ScreenDetailed),
// ainda não presentes no lib.dom.d.ts do TypeScript.
interface ScreenDetailed extends Screen {
  availLeft: number;
  availTop: number;
  isPrimary: boolean;
  isInternal: boolean;
  devicePixelRatio: number;
  label: string;
  onchange: (() => void) | null;
}

interface ScreenDetails {
  currentScreen: ScreenDetailed;
  screens: ScreenDetailed[];
  oncurrentscreenchange: (() => void) | null;
  onscreenschange: (() => void) | null;
}

interface Window {
  getScreenDetails(): Promise<ScreenDetails>;
}

interface FullscreenOptions {
  screen?: Screen;
}
