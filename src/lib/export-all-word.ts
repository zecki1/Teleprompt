import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  VerticalAlign,
} from "docx";
import { saveAs } from "file-saver";
import { Scene } from "./parser";

interface ScriptWithScenes {
  title: string;
  path?: string[] | null;
  folder?: string;
  subfolder?: string;
  lesson?: string;
  editorName?: string | null;
  reviewerName?: string | null;
  videomakerName?: string | null;
  scenes: Scene[];
}

export const exportAllToWord = async (projectName: string, scripts: ScriptWithScenes[]) => {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      text: `PROJETO: ${projectName}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      text: `${scripts.length} roteiro(s) - Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  for (const script of scripts) {
    children.push(
      new Paragraph({
        text: script.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 },
      })
    );

    const pathStr =
      script.path && script.path.length > 0
        ? script.path.join(" > ")
        : `${script.folder || ""}${script.subfolder ? ` > ${script.subfolder}` : ""}${script.lesson ? ` > ${script.lesson}` : ""}`;

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Caminho: `, bold: true, color: "333333" }),
          new TextRun({ text: pathStr || "Raiz", color: "555555" }),
          new TextRun({ text: `  |  Editor: `, bold: true, color: "333333" }),
          new TextRun({ text: script.editorName || "N/A", color: "555555" }),
          new TextRun({ text: `  |  Revisor: `, bold: true, color: "333333" }),
          new TextRun({ text: script.reviewerName || "N/A", color: "555555" }),
        ],
        spacing: { after: 300 },
      })
    );

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell("CENA", 8),
              createHeaderCell("LOCUÇÃO / TEXTO FALADO", 55),
              createHeaderCell("LETTERING / OBS", 37),
            ],
          }),
          ...script.scenes.map(
            (scene) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        text: scene.sceneNumber,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 120, after: 120 },
                      }),
                      ...(scene.time
                        ? [
                            new Paragraph({
                              children: [new TextRun({ text: scene.time, size: 16, color: "999999" })],
                              alignment: AlignmentType.CENTER,
                            }),
                          ]
                        : []),
                    ],
                  }),
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: scene.spokenText || "(Sem locução)", size: 24 })],
                        spacing: { before: 200, after: 200, line: 360 },
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 37, type: WidthType.PERCENTAGE },
                    shading: { fill: "F9F9F9" },
                    children: [
                      ...(scene.lettering
                        ? [
                            new Paragraph({
                              children: [new TextRun({ text: "LETTERING:", bold: true, size: 16, color: "E67E22" })],
                              spacing: { before: 120 },
                            }),
                            new Paragraph({
                              children: [new TextRun({ text: scene.lettering, size: 18, italics: true })],
                              spacing: { after: 120 },
                            }),
                          ]
                        : []),
                      ...(scene.observation
                        ? [
                            new Paragraph({
                              children: [new TextRun({ text: "OBSERVAÇÃO:", bold: true, size: 16, color: "2980B9" })],
                              spacing: { before: 120 },
                            }),
                            new Paragraph({
                              children: [new TextRun({ text: scene.observation, size: 18 })],
                              spacing: { after: 120 },
                            }),
                          ]
                        : []),
                    ].filter(Boolean) as Paragraph[],
                  }),
                ],
              })
          ),
        ],
      })
    );

    children.push(
      new Paragraph({
        spacing: { before: 400 },
        children: [new TextRun({ text: "", size: 16 })],
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Documento gerado automaticamente pelo Teleprompt - ${new Date().toLocaleDateString("pt-BR")}`,
          size: 16,
          color: "CCCCCC",
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { before: 600 },
    })
  );

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  const safeName = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  saveAs(blob, `backup_${safeName}.docx`);
};

function createHeaderCell(text: string, widthPercent: number) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { fill: "333333" },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
      }),
    ],
  });
}
