import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

// Setup pdfjs worker safely for Vite environment
try {
  if (typeof window !== "undefined") {
    // Use worker from pdfjs-dist build or bundled CDN fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "4.10.38"}/pdf.worker.min.mjs`;
  }
} catch (err) {
  console.warn("PDF worker initialization warning:", err);
}

export interface ExtractionResult {
  text: string;
  pageCount: number;
  isScanned: boolean;
  pageTexts: string[];
}

export interface ExtractionProgress {
  stage: "loading" | "extracting" | "ocr" | "completed";
  currentPage: number;
  totalPages: number;
  ocrProgress?: number;
  message: string;
}

/**
 * Robust, multi-page PDF text extraction with automatic Scanned/Image PDF OCR fallback.
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractionResult> {
  onProgress?.({
    stage: "loading",
    currentPage: 0,
    totalPages: 0,
    message: `Reading "${file.name}" binary structure...`,
  });

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  const pageTexts: string[] = [];
  let totalRawChars = 0;

  // Step 1: Extract digital text from all pages
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    onProgress?.({
      stage: "extracting",
      currentPage: pageNum,
      totalPages: pageCount,
      message: `Extracting text content from Page ${pageNum} of ${pageCount}...`,
    });

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items with appropriate spacing
    const pageStrings: string[] = [];
    let lastY: number | null = null;

    for (const item of textContent.items as any[]) {
      if (!item.str) continue;
      
      // If line position changes significantly, add a newline
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
        pageStrings.push("\n" + item.str);
      } else {
        pageStrings.push((pageStrings.length > 0 ? " " : "") + item.str);
      }
      lastY = item.transform[5];
    }

    const cleanPageText = pageStrings.join("").trim();
    pageTexts.push(cleanPageText);
    totalRawChars += cleanPageText.replace(/\s+/g, "").length;
  }

  // Step 2: Detect Scanned / Image-Only PDFs (e.g. less than 35 readable characters across all pages)
  const isScanned = totalRawChars < 35 && pageCount > 0;

  if (isScanned) {
    onProgress?.({
      stage: "ocr",
      currentPage: 0,
      totalPages: pageCount,
      message: "No digital text layer detected. Running optical OCR on scanned PDF pages...",
    });

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      onProgress?.({
        stage: "ocr",
        currentPage: pageNum,
        totalPages: pageCount,
        message: `OCR scanning scanned Page ${pageNum} of ${pageCount}...`,
      });

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        await (page as any).render({ canvasContext: ctx, viewport, canvas }).promise;
        const ocrResult = await Tesseract.recognize(canvas, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              onProgress?.({
                stage: "ocr",
                currentPage: pageNum,
                totalPages: pageCount,
                ocrProgress: Math.round(m.progress * 100),
                message: `OCR Page ${pageNum}/${pageCount}: ${Math.round(m.progress * 100)}% recognized`,
              });
            }
          },
        });

        const ocrText = (ocrResult.data.text || "").trim();
        pageTexts[pageNum - 1] = ocrText;
      }
    }
  }

  // Step 3: Clean, normalize, and format text with preserved page boundaries
  const compiledSections: string[] = [];
  pageTexts.forEach((pText, idx) => {
    const trimmed = pText.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (trimmed.length > 0) {
      compiledSections.push(`--- Page ${idx + 1} ---\n${trimmed}`);
    }
  });

  const fullNormalizedText = compiledSections.join("\n\n").trim();

  // Step 4: Strict validation - never accept empty or corrupted text
  const cleanCharCount = fullNormalizedText.replace(/--- Page \d+ ---|\s+/g, "").length;
  if (cleanCharCount < 20) {
    throw new Error(
      "Unable to extract readable text from this PDF. Please upload a text-based PDF or a clearer scanned document."
    );
  }

  onProgress?.({
    stage: "completed",
    currentPage: pageCount,
    totalPages: pageCount,
    message: `Successfully extracted ${cleanCharCount} characters across ${pageCount} pages.`,
  });

  return {
    text: fullNormalizedText,
    pageCount,
    isScanned,
    pageTexts,
  };
}
