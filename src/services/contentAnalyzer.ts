export interface ContentSuitability {
  isValid: boolean;
  isShort: boolean;
  wordCount: number;
  charCount: number;
  category: "blank" | "short_note" | "process_algorithm" | "hierarchical_theory" | "comprehensive_chapter" | "general_study";
  statusMessage: string;
  recommendedFeatures: string[];
  optionalFeatures: string[];
  unsuitableFeatures: string[];
}

/**
 * Analyzes document content to determine educational substance, suitability, and recommended learning actions.
 * Never manufactures or forces irrelevant features.
 */
export function analyzeContentSuitability(text: string | undefined | null): ContentSuitability {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      isShort: true,
      wordCount: 0,
      charCount: 0,
      category: "blank",
      statusMessage: "I couldn't find enough readable study content in this file. The file may be blank, image-only, or too low quality.",
      recommendedFeatures: [],
      optionalFeatures: [],
      unsuitableFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "planner", "export", "videos"],
    };
  }

  const cleanText = text.trim();
  const charCount = cleanText.length;
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Rejection of blank / meaningless files (< 30 chars or < 6 words)
  if (charCount < 30 || wordCount < 6) {
    return {
      isValid: false,
      isShort: true,
      wordCount,
      charCount,
      category: "blank",
      statusMessage: "I couldn't find enough readable study content in this file. Please upload a clear text document or high-legibility notes.",
      recommendedFeatures: [],
      optionalFeatures: [],
      unsuitableFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "planner", "export", "videos"],
    };
  }

  const lower = cleanText.toLowerCase();

  // Pattern detection
  const processKeywords = ["step", "phase", "algorithm", "stage", "pipeline", "workflow", "cycle", "procedure", "execute", "flow", "input", "output"];
  const hierarchyKeywords = ["types of", "classification", "components", "categories", "layers", "architecture", "hierarchy", "principles", "taxonomy"];

  const hasProcessSignals = processKeywords.some((kw) => lower.includes(kw));
  const hasHierarchySignals = hierarchyKeywords.some((kw) => lower.includes(kw));

  // 2. Very Short Note (< 120 words)
  if (wordCount < 120) {
    const recommended = ["summary", "flashcards", "tutor"];
    if (hasProcessSignals) recommended.push("flowchart");
    if (hasHierarchySignals) recommended.push("mindmap");
    recommended.push("quiz");

    return {
      isValid: true,
      isShort: true,
      wordCount,
      charCount,
      category: "short_note",
      statusMessage: "Concise study note understood. Recommended focused retrieval tools.",
      recommendedFeatures: recommended,
      optionalFeatures: hasProcessSignals ? ["flowchart"] : ["mindmap"],
      unsuitableFeatures: ["export", "videos"], // Presentation/video script is unsuitable for a 4-line note
    };
  }

  // 3. Process / Algorithm Content
  if (hasProcessSignals && !hasHierarchySignals) {
    return {
      isValid: true,
      isShort: false,
      wordCount,
      charCount,
      category: "process_algorithm",
      statusMessage: "Process & algorithmic structure detected. Flowchart and active recall ready.",
      recommendedFeatures: ["summary", "flowchart", "quiz", "flashcards", "tutor"],
      optionalFeatures: ["mindmap", "planner"],
      unsuitableFeatures: [],
    };
  }

  // 4. Hierarchical Theory Content
  if (hasHierarchySignals) {
    return {
      isValid: true,
      isShort: false,
      wordCount,
      charCount,
      category: "hierarchical_theory",
      statusMessage: "Structured taxonomy & multi-layer concepts detected. Mind Map & summaries ready.",
      recommendedFeatures: ["summary", "mindmap", "flashcards", "quiz", "tutor"],
      optionalFeatures: ["flowchart", "planner", "export"],
      unsuitableFeatures: [],
    };
  }

  // 5. Comprehensive Chapter / Long Notes (>= 500 words)
  if (wordCount >= 500) {
    return {
      isValid: true,
      isShort: false,
      wordCount,
      charCount,
      category: "comprehensive_chapter",
      statusMessage: "Comprehensive chapter material processed. Full learning suite available.",
      recommendedFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "planner", "export", "videos", "tutor"],
      optionalFeatures: [],
      unsuitableFeatures: [],
    };
  }

  // 6. Standard General Study Note
  return {
    isValid: true,
    isShort: false,
    wordCount,
    charCount,
    category: "general_study",
    statusMessage: "Study material processed successfully. Key learning resources prepared.",
    recommendedFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "tutor"],
    optionalFeatures: ["planner", "export"],
    unsuitableFeatures: [],
  };
}
