import pptxgen from "pptxgenjs";
import JSZip from "jszip";
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

const SCENE_3D_XML =
  '<a:scene3d>' +
  '<a:camera prst="orthographicFront">' +
  '<a:rot lat="0" lon="10800000" rev="0"/>' +
  "</a:camera>" +
  "<a:backdrop>" +
  '<a:anchor x="0" y="0" z="0"/>' +
  '<a:norm dx="0" dy="0" dz="1"/>' +
  '<a:up dx="0" dy="1" dz="0"/>' +
  "</a:backdrop>" +
  "</a:scene3d>" +
  '<a:sp3d extrusionH="0" contourW="0">' +
  '<a:bevelT w="0" h="0"/>' +
  '<a:bevelB w="0" h="0"/>' +
  '<a:extrusionClr><a:srgbClr val="000000"/></a:extrusionClr>' +
  '<a:contourClr><a:srgbClr val="000000"/></a:contourClr>' +
  "</a:sp3d>";

async function add3dRotationX(zip: JSZip): Promise<JSZip> {
  const slideFiles = Object.keys(zip.files).filter(
    (f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)
  );

  for (const slideFile of slideFiles) {
    const content = await zip.files[slideFile].async("string");

    const modified = content.replace(
      /(<p:sp(?!Tree)[\s\S]*?<p:spPr>)([\s\S]*?)(<\/p:spPr>[\s\S]*?<p:txBody>)/g,
      (match: string, open: string, inner: string, close: string) => {
        if (/sp3d/.test(inner)) return match;
        return `${open}${inner}${SCENE_3D_XML}${close}`;
      }
    );

    zip.file(slideFile, modified);
  }

  return zip;
}

export async function exportToPPT(options: ExportOptions, scenes: Scene[]) {
  const pptx = new pptxgen();

  pptx.title = options.title;
  pptx.subject = `Roteiro: ${options.title}`;
  pptx.author = "Antigravity Teleprompt";

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
  });

  scenes.forEach((scene) => {
    const fullText = (scene.spokenText || "")
      .replace(/\[abe\]/gi, "")
      .replace(/\[enc\]/gi, "")
      .trim();

    if (!fullText) return;

    const wordsPerSlide = 30;
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
        });
      }
    });
  });

  const array = await pptx.write({ outputType: "uint8array" });
  const zip = await JSZip.loadAsync(array);

  await add3dRotationX(zip);

  const finalArray = await zip.generateAsync({ type: "uint8array" });
  const finalBlob = new Blob([finalArray as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });

  const fileName = `${options.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
  const url = URL.createObjectURL(finalBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return fileName;
}
