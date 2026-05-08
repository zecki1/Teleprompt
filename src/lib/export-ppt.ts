import pptxgen from "pptxgenjs";
import { Scene } from "./parser";

interface ExportOptions {
  title: string;
  projectName: string;
  folder?: string;
  subfolder?: string;
  lesson?: string;
  editorName?: string | null;
  reviewerName?: string | null;
  videomakerName?: string | null;
  path?: string[] | null;
  isMirrored?: boolean;
}

export async function exportToPPT(options: ExportOptions, scenes: Scene[]) {
  const pptx = new pptxgen();

  // Set presentation info
  pptx.title = options.title;
  pptx.subject = `Roteiro: ${options.title}`;
  pptx.author = "Antigravity Teleprompt";

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: "000000" };
  
  titleSlide.addText(options.title, {
    x: 0,
    y: "35%",
    w: "100%",
    h: 1.5,
    align: "center",
    fontSize: 44,
    color: "FFFF00",
    bold: true,
    fontFace: "Arial",
    flipH: true, // Mirror title
  });

  const projectPath = `Projeto: ${options.projectName || "Geral"}${
    options.path && options.path.length > 0 
      ? ` > ${options.path.join(" > ")}` 
      : `${options.folder ? ` > ${options.folder}` : ""}${options.subfolder ? ` > ${options.subfolder}` : ""}${options.lesson ? ` > ${options.lesson}` : ""}`
  }`;
  
  titleSlide.addText(projectPath, {
    x: 0,
    y: "55%",
    w: "100%",
    h: 0.5,
    align: "center",
    fontSize: 24,
    color: "FFFFFF",
    bold: true,
    fontFace: "Arial",
    flipH: true, // Mirror path
  });

  const responsiblesText = `Resp: ${options.editorName || "N/A"} | Rev: ${options.reviewerName || "N/A"} | Gravado: ${options.videomakerName || "N/A"}`;
  
  titleSlide.addText(responsiblesText, {
    x: 0,
    y: "65%",
    w: "100%",
    h: 0.5,
    align: "center",
    fontSize: 16,
    color: "AAAAAA",
    fontFace: "Arial",
    flipH: true, // Mirror responsibles
  });

  // Scenes Slides
  scenes.forEach((scene) => {
    // Strip tags from spokenText for backup
    const fullText = (scene.spokenText || "")
      .replace(/\[abe\]/gi, "")
      .replace(/\[enc\]/gi, "")
      .trim();

    if (!fullText) return;

    const wordsPerSlide = 30; // Even fewer words for better visibility at 36pt
    const words = fullText.split(/\s+/);
    const textChunks: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerSlide) {
      textChunks.push(words.slice(i, i + wordsPerSlide).join(" "));
    }

    textChunks.forEach((chunk) => {
      const slide = pptx.addSlide();
      slide.background = { color: "000000" };

      if (chunk) {
        slide.addText(chunk, {
          x: 0.5,
          y: 0.5,
          w: "90%",
          h: "90%",
          fontSize: 36,
          color: "FFFF00",
          align: "center", 
          valign: "middle",
          fontFace: "Arial", 
          bold: true,
          flipH: true, 
        });
      }
    });
  });

  // Save the presentation
  await pptx.writeFile({ fileName: `${options.title.replace(/[^a-z0-9]/gi, "_")}.pptx` });
}
