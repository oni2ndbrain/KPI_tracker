import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import { fileExtension } from "./file-extension.js";

const WORD_TEXT_TAG = /<w:t[^>]*>([^<]*)<\/w:t>/g;
const DRAWING_TEXT_TAG = /<a:t[^>]*>([^<]*)<\/a:t>/g;
const SPREADSHEET_TEXT_TAG = /<t[^>]*>([^<]*)<\/t>/g;

async function extractTagText(xml: string, tagPattern: RegExp): Promise<string[]> {
  return [...xml.matchAll(tagPattern)].map((match) => match[1] ?? "");
}

async function readZipEntry(zip: JSZip, path: string): Promise<string | null> {
  const entry = zip.file(path);
  return entry ? entry.async("string") : null;
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await readZipEntry(zip, "word/document.xml");
  if (!xml) throw new Error("not a valid .docx file: missing word/document.xml");
  return (await extractTagText(xml, WORD_TEXT_TAG)).join(" ");
}

async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => {
      const numOf = (p: string) => Number(p.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return numOf(a) - numOf(b);
    });
  if (slidePaths.length === 0) throw new Error("not a valid .pptx file: no slides found");

  const perSlideText: string[] = [];
  for (const path of slidePaths) {
    const xml = await readZipEntry(zip, path);
    if (!xml) continue;
    perSlideText.push((await extractTagText(xml, DRAWING_TEXT_TAG)).join(" "));
  }
  return perSlideText.join("\n");
}

async function extractTextFromXlsx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const sheetPaths = Object.keys(zip.files).filter((path) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(path),
  );
  if (sheetPaths.length === 0) throw new Error("not a valid .xlsx file: no worksheets found");

  const sharedStringsXml = await readZipEntry(zip, "xl/sharedStrings.xml");
  const sharedStrings = sharedStringsXml ? await extractTagText(sharedStringsXml, SPREADSHEET_TEXT_TAG) : [];

  const cellText: string[] = [...sharedStrings];
  for (const path of sheetPaths) {
    const xml = await readZipEntry(zip, path);
    if (!xml) continue;
    // Inline strings (<is><t>...</t></is>) live directly in the sheet, unlike shared strings.
    cellText.push(...(await extractTagText(xml, SPREADSHEET_TEXT_TAG)));
  }
  return cellText.join(" ");
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

/** Dispatches to the right format-specific extractor by file extension. Throws for any format
 * outside pdf/.docx/.xlsx/.pptx — legacy binary Office formats (.doc/.ppt/.xls) aren't supported. */
export async function extractDocumentText(fileName: string, buffer: Buffer): Promise<string> {
  switch (fileExtension(fileName)) {
    case ".pdf":
      return extractTextFromPdf(buffer);
    case ".docx":
      return extractTextFromDocx(buffer);
    case ".pptx":
      return extractTextFromPptx(buffer);
    case ".xlsx":
      return extractTextFromXlsx(buffer);
    default:
      throw new Error(
        `unsupported document format: "${fileName}" (only .pdf, .docx, .pptx, .xlsx are supported)`,
      );
  }
}
