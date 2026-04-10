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
  VerticalAlign
} from "docx";
import { saveAs } from "file-saver";
import { Scene } from "./parser";

interface ExportScriptData {
  title: string;
  projectName?: string;
  author?: string;
}

export const exportToWord = async (script: ExportScriptData, scenes: Scene[]) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: script.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Projeto: ${script.projectName || "Geral"}`,
                bold: true,
                color: "666666",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // Cabeçalho da Tabela
              new TableRow({
                children: [
                   createHeaderCell("CENA", 10),
                   createHeaderCell("LOCUÇÃO / TEXTO FALADO", 60),
                   createHeaderCell("LETTERING / OBS", 30),
                ],
              }),
              // Linhas das Cenas
              ...scenes.map((scene) => 
                new TableRow({
                  children: [
                    // Coluna Cena
                    new TableCell({
                      width: { size: 10, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          text: scene.sceneNumber,
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 120, after: 120 },
                        }),
                        ...(scene.time ? [
                          new Paragraph({
                            children: [new TextRun({ text: scene.time, size: 16, color: "999999" })],
                            alignment: AlignmentType.CENTER,
                          })
                        ] : []),
                      ],
                    }),
                    // Coluna Texto Falado
                    new TableCell({
                      width: { size: 60, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: scene.spokenText || "(Sem locução)",
                              size: 24,
                            }),
                          ],
                          spacing: { before: 200, after: 200, line: 360 },
                        }),
                      ],
                    }),
                    // Coluna Extras
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      shading: { fill: "F9F9F9" },
                      children: [
                        ...(scene.lettering ? [
                          new Paragraph({
                            children: [new TextRun({ text: "LETTERING:", bold: true, size: 16, color: "E67E22" })],
                            spacing: { before: 120 },
                          }),
                          new Paragraph({
                            children: [new TextRun({ text: scene.lettering, size: 18, italic: true })],
                            spacing: { after: 120 },
                          }),
                        ] : []),
                        ...(scene.observation ? [
                          new Paragraph({
                            children: [new TextRun({ text: "OBSERVAÇÃO:", bold: true, size: 16, color: "2980B9" })],
                            spacing: { before: 120 },
                          }),
                          new Paragraph({
                            children: [new TextRun({ text: scene.observation, size: 18 })],
                            spacing: { after: 120 },
                          }),
                        ] : []),
                        // Imagem Placeholder se houver URL
                        ...(scene.imageUrl ? [
                            new Paragraph({
                              children: [new TextRun({ text: "IMAGEM:", bold: true, size: 16, color: "8E44AD" })],
                              spacing: { before: 120 },
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: scene.imageUrl, size: 14, color: "555555" })],
                            })
                        ] : [])
                      ].filter(Boolean) as Paragraph[],
                    }),
                  ],
                })
              ),
            ],
          }),
          
          new Paragraph({
            text: `Documento gerado automaticamente pelo Teleprompt - ${new Date().toLocaleDateString("pt-BR")}`,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 800 },
            children: [
                new TextRun({ text: "", size: 16, color: "CCCCCC" })
            ]
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeTitle = script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  saveAs(blob, `roteiro_${safeTitle}.docx`);
};

function createHeaderCell(text: string, widthPercent: number) {
  return new TableCell({
    width: {
      size: widthPercent,
      type: WidthType.PERCENTAGE,
    },
    shading: {
      fill: "333333",
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            color: "FFFFFF",
            size: 18,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
      }),
    ],
  });
}
