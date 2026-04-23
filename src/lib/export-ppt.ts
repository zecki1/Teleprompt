import pptxgen from "pptxgenjs";
import { Scene } from "./parser";

interface ExportOptions {
  title: string;
  projectName: string;
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
  });

  titleSlide.addText(options.projectName, {
    x: 0,
    y: "55%",
    w: "100%",
    h: 0.5,
    align: "center",
    fontSize: 24,
    color: "FFFFFF",
    bold: true,
    fontFace: "Arial",
  });

  // Scenes Slides
  scenes.forEach((scene) => {
    // Determine how many slides this scene needs based on text length
    const fullText = scene.spokenText || "";
    const wordsPerSlide = 40; // Approximate words that fit with large font
    const words = fullText.split(/\s+/);
    const textChunks: string[] = [];
    
    if (words.length === 0 || !fullText.trim()) {
      textChunks.push(""); // At least one slide for metadata/tags
    } else {
      for (let i = 0; i < words.length; i += wordsPerSlide) {
        textChunks.push(words.slice(i, i + wordsPerSlide).join(" "));
      }
    }

    textChunks.forEach((chunk, chunkIdx) => {
      const slide = pptx.addSlide();
      slide.background = { color: "000000" };

      // Scene Header (Only on the first slide of the scene)
      const headerSuffix = textChunks.length > 1 ? ` (${chunkIdx + 1}/${textChunks.length})` : "";
      slide.addText(`CENA ${scene.sceneNumber}${headerSuffix}`, {
        x: 0.5,
        y: 0.2,
        w: "40%",
        h: 0.4,
        fontSize: 14,
        color: "000000",
        fill: { color: "FFFF00" },
        align: "center",
        bold: true,
        fontFace: "Arial",
      });

      if (scene.time && chunkIdx === 0) {
        slide.addText(`Tempo: ${scene.time}`, {
          x: 7.0,
          y: 0.2,
          w: 2.5,
          h: 0.4,
          fontSize: 12,
          color: "AAAAAA",
          align: "right",
          bold: true,
        });
      }

      let tagsY = 0.8;
      
      // Only show tags on the first slide of the scene
      if (chunkIdx === 0) {
        if (scene.opening) {
          slide.addText(`ABERTURA: ${scene.opening}`, {
            x: 0.5,
            y: tagsY,
            w: "90%",
            h: 0.4,
            fontSize: 12,
            color: "00FF00",
            bold: true,
            fontFace: "Arial",
          });
          tagsY += 0.5;
        }

        if (scene.lettering) {
          slide.addText(`LETTERING: ${scene.lettering}`, {
            x: 0.5,
            y: tagsY,
            w: "90%",
            h: 0.4,
            fontSize: 12,
            color: "FFA500",
            bold: true,
            fontFace: "Arial",
          });
          tagsY += 0.5;
        }

        if (scene.closing) {
          slide.addText(`ENCERRAMENTO: ${scene.closing}`, {
            x: 0.5,
            y: tagsY,
            w: "90%",
            h: 0.4,
            fontSize: 12,
            color: "FF0000",
            bold: true,
            fontFace: "Arial",
          });
          tagsY += 0.5;
        }
      }

      const locutionY = chunkIdx === 0 ? tagsY + 0.2 : 0.8;

      // Locution with large yellow text
      if (chunk) {
        slide.addText(chunk, {
          x: 0.5,
          y: locutionY,
          w: "90%",
          h: 4.5,
          fontSize: 36, // Large font for teleprompter style
          color: "FFFF00",
          align: "left",
          valign: "top",
          fontFace: "Arial",
          bold: true,
        });
      }
    });
  });

  // Save the presentation
  await pptx.writeFile({ fileName: `${options.title.replace(/[^a-z0-9]/gi, "_")}.pptx` });
}
