import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

let vfsInitialized = false;

function getPdfMakeInstance() {
  const mod = pdfMake as unknown as {
    default?: typeof pdfMake;
    addVirtualFileSystem?: (fontMap: Record<string, string>) => void;
    vfs?: Record<string, string>;
    createPdf: (docDefinition: never) => {
      download: (filename: string) => Promise<void> | void;
    };
  };
  return (mod.default ?? mod) as {
    addVirtualFileSystem?: (fontMap: Record<string, string>) => void;
    vfs?: Record<string, string>;
    createPdf: (docDefinition: never) => {
      download: (filename: string) => Promise<void> | void;
    };
  };
}

function ensurePdfFonts() {
  if (vfsInitialized) return;

  const fontsModule = pdfFonts as unknown as {
    default?: Record<string, string>;
    vfs?: Record<string, string>;
  };
  const vfs =
    fontsModule.default ??
    fontsModule.vfs ??
    (pdfFonts as unknown as Record<string, string>);

  const pdfMakeInstance = getPdfMakeInstance();

  if (typeof pdfMakeInstance.addVirtualFileSystem === 'function') {
    pdfMakeInstance.addVirtualFileSystem(vfs);
  } else {
    pdfMakeInstance.vfs = vfs;
  }

  vfsInitialized = true;
}

export interface PdfExportOptions {
  analysisText: string;
  sourceLabel?: string;
  criteriaNames?: string[];
}

export async function downloadAnalysisPdf({
  analysisText,
  sourceLabel,
  criteriaNames = [],
}: PdfExportOptions): Promise<void> {
  ensurePdfFonts();

  const createdAt = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const metaLines: string[] = [`Дата отчёта: ${createdAt}`];
  if (sourceLabel) {
    metaLines.push(`Источник: ${sourceLabel}`);
  }
  if (criteriaNames.length > 0) {
    metaLines.push(`Критерии: ${criteriaNames.join(', ')}`);
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [44, 44, 44, 48],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11,
      lineHeight: 1.45,
      color: '#0F172A',
    },
    content: [
      {
        text: 'AI-анализ звонка',
        fontSize: 18,
        bold: true,
        color: '#0F172A',
        margin: [0, 0, 0, 6],
      },
      {
        text: metaLines.join('\n'),
        fontSize: 9.5,
        color: '#475569',
        margin: [0, 0, 0, 14],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 507,
            y2: 0,
            lineWidth: 0.75,
            lineColor: '#E2E8F0',
          },
        ],
        margin: [0, 0, 0, 16],
      },
      {
        text: 'Результат анализа',
        fontSize: 12.5,
        bold: true,
        color: '#0F172A',
        margin: [0, 0, 0, 8],
      },
      {
        text: analysisText,
        fontSize: 11,
        lineHeight: 1.5,
        color: '#1E293B',
      },
    ],
  };

  const fileDate = new Date().toISOString().slice(0, 10);
  const pdfDoc = getPdfMakeInstance().createPdf(docDefinition as never);
  await pdfDoc.download(`ai-call-analysis-${fileDate}.pdf`);
}
