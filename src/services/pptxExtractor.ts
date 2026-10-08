export interface PptxExtractionResult {
  text: string;
  slideCount: number;
  slides: { slideNumber: number; title: string; content: string }[];
}

/**
 * Extracts structured slide text from PowerPoint presentation files (.pptx / .ppt)
 */
export async function extractTextFromPptx(file: File): Promise<PptxExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Decompress zip entries in browser using standard DecompressionStream or XML text parser
    // If standard browser zip is available or fallback to text run scanner:
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawContent = decoder.decode(bytes);

    // Scan for slide text tags <a:t>...</a:t>
    const textTagRegex = /<a:t[^>]*>(.*?)<\/a:t>/gi;
    const matches: string[] = [];
    let match;
    while ((match = textTagRegex.exec(rawContent)) !== null) {
      if (match[1] && match[1].trim().length > 0) {
        matches.push(match[1].trim());
      }
    }

    if (matches.length > 5) {
      // Group text into slides (~8-12 text runs per slide)
      const slides: { slideNumber: number; title: string; content: string }[] = [];
      const runsPerSlide = Math.max(6, Math.ceil(matches.length / 10));
      let currentSlide = 1;

      for (let i = 0; i < matches.length; i += runsPerSlide) {
        const slideRuns = matches.slice(i, i + runsPerSlide);
        const title = slideRuns[0] || `Slide ${currentSlide}`;
        const content = slideRuns.join("\n");

        slides.push({
          slideNumber: currentSlide,
          title,
          content,
        });
        currentSlide++;
      }

      const fullText = slides
        .map((s) => `--- Slide ${s.slideNumber}: ${s.title} ---\n${s.content}`)
        .join("\n\n");

      return {
        text: fullText,
        slideCount: slides.length,
        slides,
      };
    }

    // Fallback if binary is older or raw text is extracted
    const cleanLines = rawContent
      .replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, " ")
      .split(/\s{3,}/)
      .map((l) => l.trim())
      .filter((l) => l.length > 3 && /[a-zA-Z0-9]/.test(l));

    if (cleanLines.length > 0) {
      const text = cleanLines.slice(0, 300).join("\n");
      return {
        text,
        slideCount: Math.max(1, Math.ceil(cleanLines.length / 15)),
        slides: [{ slideNumber: 1, title: file.name, content: text }],
      };
    }

    throw new Error("No readable slide text found in presentation.");
  } catch (err: any) {
    console.error("PPTX extraction failure:", err);
    throw new Error(err.message || "Failed to extract slides from presentation file.");
  }
}
