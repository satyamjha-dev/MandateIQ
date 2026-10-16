import { extractText } from "unpdf";

export type PdfExtractionResult = {
  totalPages: number;
  pages: string[];
  fullText: string;
  isScannedOrEmpty: boolean;
  error?: string;
};

/**
 * Extracts raw textual content from an uploaded PDF document.
 * Detects empty or scanned image-only PDFs and provides informative diagnostic messages.
 */
export async function extractPdfText(
  pdfBuffer: ArrayBuffer | Uint8Array | Buffer
): Promise<PdfExtractionResult> {
  try {
    // unpdf / pdfjs-dist strictly requires a pure Uint8Array
    let uint8Array: Uint8Array;
    if (Buffer.isBuffer(pdfBuffer)) {
      uint8Array = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
    } else if (pdfBuffer instanceof Uint8Array) {
      uint8Array = pdfBuffer;
    } else {
      uint8Array = new Uint8Array(pdfBuffer);
    }

    const data = await extractText(uint8Array);
    const pages = data.text ?? [];
    const fullText = pages.join("\n\n").trim();

    // Check if extractable text is essentially empty (scanned PDF or blank document)
    if (!fullText || fullText.replace(/\s+/g, "").length < 10) {
      return {
        totalPages: data.totalPages ?? 0,
        pages,
        fullText: "",
        isScannedOrEmpty: true,
        error:
          "The uploaded PDF does not contain extractable text. Scanned/image-based statements require OCR support, which is not available in Phase 1.",
      };
    }

    return {
      totalPages: data.totalPages ?? 1,
      pages,
      fullText,
      isScannedOrEmpty: false,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      totalPages: 0,
      pages: [],
      fullText: "",
      isScannedOrEmpty: true,
      error: `Failed to extract text from PDF: ${message}`,
    };
  }
}

