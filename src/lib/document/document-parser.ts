/**
 * Document Parser — Client-Side Text Extraction
 * Supports: PDF (.pdf), DOCX (.docx), Plain Text (.txt)
 * Zero-Data Retention: All processing happens in the browser, no server uploads.
 */

/**
 * Extract plain text from a file (PDF, DOCX, or TXT).
 * @param file - The File object to parse
 * @returns Extracted text content
 */
export async function parseDocument(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "txt":
    case "md":
      return parseTxt(file);
    case "pdf":
      return parsePdf(file);
    case "docx":
      return parseDocx(file);
    default:
      throw new Error(
        `Định dạng file không được hỗ trợ: .${ext}. Chỉ chấp nhận .pdf, .docx, .txt`
      );
  }
}

/** Read plain text files directly */
async function parseTxt(file: File): Promise<string> {
  return file.text();
}

/** Extract text from PDF using pdfjs-dist */
async function parsePdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source to CDN to avoid bundling issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText.trim());
  }

  return pages.filter(Boolean).join("\n\n");
}

/** Extract text from DOCX using mammoth */
async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
