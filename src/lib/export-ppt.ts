import type JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { Scene } from "./parser";

const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";

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

async function apply3dToContentSlides(zip: JSZip, contentSlides: Set<number>): Promise<void> {
  const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f));
  for (const slideFile of slideFiles) {
    const slideNum = parseInt(slideFile.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
    if (!contentSlides.has(slideNum)) continue;

    const xmlStr = await zip.files[slideFile].async("string");
    const doc = new DOMParser().parseFromString(xmlStr, "text/xml");

    const spPrs = doc.getElementsByTagNameNS("*", "spPr");
    for (let i = 0; i < spPrs.length; i++) {
      const spPr = spPrs[i];
      if (spPr.getElementsByTagNameNS("*", "sp3d").length > 0) continue;
      let sibling = spPr.nextSibling;
      let hasTxBody = false;
      while (sibling) {
        if (sibling.nodeName === "p:txBody" || sibling.nodeName === "txBody") {
          hasTxBody = true;
          break;
        }
        sibling = sibling.nextSibling;
      }
      if (!hasTxBody) continue;

      const xfrms = spPr.getElementsByTagNameNS("*", "xfrm");
      const insertAfter = xfrms.length > 0 ? xfrms[xfrms.length - 1] : null;

      const scene3d = doc.createElementNS(A_NS, "a:scene3d");
      const camera = doc.createElementNS(A_NS, "a:camera");
      camera.setAttribute("prst", "orthographicFront");
      const rot = doc.createElementNS(A_NS, "a:rot");
      rot.setAttribute("lat", "0");
      rot.setAttribute("lon", "10800000");
      rot.setAttribute("rev", "0");
      camera.appendChild(rot);
      scene3d.appendChild(camera);
      const backdrop = doc.createElementNS(A_NS, "a:backdrop");
      const anchor = doc.createElementNS(A_NS, "a:anchor");
      anchor.setAttribute("x", "0"); anchor.setAttribute("y", "0"); anchor.setAttribute("z", "0");
      backdrop.appendChild(anchor);
      const norm = doc.createElementNS(A_NS, "a:norm");
      norm.setAttribute("dx", "0"); norm.setAttribute("dy", "0"); norm.setAttribute("dz", "1");
      backdrop.appendChild(norm);
      const up = doc.createElementNS(A_NS, "a:up");
      up.setAttribute("dx", "0"); up.setAttribute("dy", "1"); up.setAttribute("dz", "0");
      backdrop.appendChild(up);
      scene3d.appendChild(backdrop);

      const sp3d = doc.createElementNS(A_NS, "a:sp3d");
      sp3d.setAttribute("extrusionH", "0");
      sp3d.setAttribute("contourW", "0");
      const bevelT = doc.createElementNS(A_NS, "a:bevelT");
      bevelT.setAttribute("w", "0"); bevelT.setAttribute("h", "0");
      sp3d.appendChild(bevelT);
      const bevelB = doc.createElementNS(A_NS, "a:bevelB");
      bevelB.setAttribute("w", "0"); bevelB.setAttribute("h", "0");
      sp3d.appendChild(bevelB);
      const extClr = doc.createElementNS(A_NS, "a:extrusionClr");
      const sRgbClr = doc.createElementNS(A_NS, "a:srgbClr");
      sRgbClr.setAttribute("val", "000000");
      extClr.appendChild(sRgbClr);
      sp3d.appendChild(extClr);
      const contClr = doc.createElementNS(A_NS, "a:contourClr");
      const crgb = doc.createElementNS(A_NS, "a:srgbClr");
      crgb.setAttribute("val", "000000");
      contClr.appendChild(crgb);
      sp3d.appendChild(contClr);

      if (insertAfter) {
        spPr.insertBefore(scene3d, insertAfter.nextSibling);
      } else {
        spPr.insertBefore(scene3d, spPr.firstChild);
      }
      spPr.appendChild(sp3d);
    }

    const serializer = new XMLSerializer();
    zip.file(slideFile, serializer.serializeToString(doc));
  }
}

export async function exportToPPT(options: ExportOptions, scenes: Scene[]) {
  const pptxgen = (await import("pptxgenjs")).default;
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

  const contentSlides = new Set<number>();
  let slideCount = 1;

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
      slideCount++;
      contentSlides.add(slideCount);
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
  const { default: JSZipRuntime } = await import("jszip");
  const zip = await JSZipRuntime.loadAsync(array);
  await apply3dToContentSlides(zip, contentSlides);
  const finalArray = await zip.generateAsync({ type: "uint8array" });
  const blob = new Blob([finalArray as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });

  const fileName = `${options.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return fileName;
}
