export type DocumentCategory =
  | "blank"
  | "study_material"
  | "lecture_notes"
  | "textbook"
  | "question_paper"
  | "resume"
  | "financial_document"
  | "invoice_receipt"
  | "form_certificate"
  | "short_note"
  | "process_algorithm"
  | "hierarchical_theory"
  | "comprehensive_chapter"
  | "general_document";

export interface CustomActionPill {
  id: string;
  label: string;
  prompt: string;
}

export interface ContentSuitability {
  isValid: boolean;
  isShort: boolean;
  isEducational: boolean;
  wordCount: number;
  charCount: number;
  category: DocumentCategory;
  categoryLabel: string;
  statusMessage: string;
  recommendedFeatures: string[];
  optionalFeatures: string[];
  unsuitableFeatures: string[];
  customActionPills: CustomActionPill[];
}

/**
 * Smart Document Classifier & Content Analyzer
 * Analyzes extracted document text and filename to determine document category,
 * educational relevance, and conditionally enables only appropriate features.
 */
export function analyzeContentSuitability(
  text: string | undefined | null,
  fileName?: string
): ContentSuitability {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      isShort: true,
      isEducational: false,
      wordCount: 0,
      charCount: 0,
      category: "blank",
      categoryLabel: "Unreadable / Empty File",
      statusMessage: "I couldn't find enough readable content in this file to create study resources.",
      recommendedFeatures: [],
      optionalFeatures: [],
      unsuitableFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "planner", "export", "videos"],
      customActionPills: [],
    };
  }

  const cleanText = text.trim();
  const charCount = cleanText.length;
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Check for blank or meaningless/corrupted file (e.g. ".... .... ....")
  const alphanumericChars = cleanText.replace(/[^a-zA-Z0-9]/g, "");
  if (charCount < 25 || wordCount < 5 || alphanumericChars.length < 15) {
    return {
      isValid: false,
      isShort: true,
      isEducational: false,
      wordCount,
      charCount,
      category: "blank",
      categoryLabel: "Empty / Blank Document",
      statusMessage: "I couldn't find enough meaningful content in this file to create learning resources.",
      recommendedFeatures: [],
      optionalFeatures: [],
      unsuitableFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "planner", "export", "videos"],
      customActionPills: [],
    };
  }

  const lower = cleanText.toLowerCase();
  const nameLower = (fileName || "").toLowerCase();

  // Pattern detection sets
  const resumeSignals = [
    "curriculum vitae", "resume", "work experience", "employment history",
    "professional summary", "technical skills", "education history", "job title",
    "references available", "responsibilities", "certifications", "linkedin.com", "github.com"
  ];
  const financialSignals = [
    "account balance", "statement of account", "bank statement", "transaction history",
    "debit", "credit", "closing balance", "opening balance", "ifsc", "swift",
    "account number", "cheque", "interest earned", "statement period", "ledger"
  ];
  const invoiceSignals = [
    "invoice", "bill to", "ship to", "tax invoice", "subtotal", "gstin", "vat",
    "due date", "amount due", "payment terms", "receipt", "purchase order"
  ];
  const questionPaperSignals = [
    "question paper", "time allowed", "maximum marks", "max marks", "section a",
    "section b", "answer any five", "q.1", "q.2", "attempt all questions",
    "multiple choice questions", "marking scheme", "model question"
  ];
  const processKeywords = ["step", "phase", "algorithm", "stage", "pipeline", "workflow", "cycle", "procedure", "execute", "flow", "input", "output"];
  const hierarchyKeywords = ["types of", "classification", "components", "categories", "layers", "architecture", "hierarchy", "principles", "taxonomy"];

  const hasResumeSignals = resumeSignals.filter((kw) => lower.includes(kw)).length >= 2 || nameLower.includes("resume") || nameLower.includes("cv");
  const hasFinancialSignals = financialSignals.filter((kw) => lower.includes(kw)).length >= 2 || nameLower.includes("statement") || nameLower.includes("bank");
  const hasInvoiceSignals = invoiceSignals.filter((kw) => lower.includes(kw)).length >= 2 || nameLower.includes("invoice") || nameLower.includes("receipt");
  const hasQuestionPaperSignals = questionPaperSignals.filter((kw) => lower.includes(kw)).length >= 2 || nameLower.includes("question") || nameLower.includes("exam") || nameLower.includes("quiz");

  // 2. Resume / CV Classification
  if (hasResumeSignals && !hasFinancialSignals) {
    return {
      isValid: true,
      isShort: wordCount < 300,
      isEducational: false,
      wordCount,
      charCount,
      category: "resume",
      categoryLabel: "Resume / CV",
      statusMessage: "Resume profile detected. Ready for career analysis, skill extraction, and profile improvements.",
      recommendedFeatures: ["summary", "tutor"],
      optionalFeatures: [],
      unsuitableFeatures: ["flashcards", "quiz", "mindmap", "flowchart", "planner", "export"],
      customActionPills: [
        { id: "extract_skills", label: "Extract Skills & Stack", prompt: "Extract all technical skills, proficiencies, tools, and frameworks listed in this resume into a categorized list." },
        { id: "improve_resume", label: "Suggest Improvements", prompt: "Review this resume and suggest 5 high-impact bullet points and structural improvements to make it stand out." },
        { id: "summarize_experience", label: "Summarize Experience", prompt: "Summarize the professional background, key roles, and career progression in this resume." },
        { id: "interview_questions", label: "Generate Interview Prep", prompt: "Generate 5 likely technical and behavioral interview questions tailored to the experience on this resume." },
      ],
    };
  }

  // 3. Bank Statement / Financial Document Classification
  if (hasFinancialSignals) {
    return {
      isValid: true,
      isShort: false,
      isEducational: false,
      wordCount,
      charCount,
      category: "financial_document",
      categoryLabel: "Bank / Financial Statement",
      statusMessage: "Financial document detected. Ready for transaction extraction, summary, and itemized breakdown.",
      recommendedFeatures: ["summary", "tutor"],
      optionalFeatures: [],
      unsuitableFeatures: ["flashcards", "quiz", "mindmap", "flowchart", "planner", "export"],
      customActionPills: [
        { id: "summarize_statement", label: "Summarize Statement", prompt: "Summarize the key information from this financial statement, including period, opening balance, closing balance, and major transactions." },
        { id: "explain_transactions", label: "Explain Transactions", prompt: "Break down the largest credits and debits recorded in this statement with brief explanations." },
        { id: "extract_totals", label: "Extract Total Credits/Debits", prompt: "Calculate or list the total deposits/credits versus total withdrawals/debits mentioned in this document." },
      ],
    };
  }

  // 4. Invoice / Receipt Classification
  if (hasInvoiceSignals) {
    return {
      isValid: true,
      isShort: true,
      isEducational: false,
      wordCount,
      charCount,
      category: "invoice_receipt",
      categoryLabel: "Invoice / Receipt",
      statusMessage: "Invoice or billing receipt detected. Ready for itemized extraction and line-item review.",
      recommendedFeatures: ["summary", "tutor"],
      optionalFeatures: [],
      unsuitableFeatures: ["flashcards", "quiz", "mindmap", "flowchart", "planner", "export"],
      customActionPills: [
        { id: "summarize_invoice", label: "Summarize Invoice", prompt: "Provide an itemized summary of this invoice, including vendor, buyer, invoice number, line items, taxes, and total due." },
        { id: "verify_totals", label: "Verify Line Items", prompt: "List each line item with quantity, unit rate, and total calculated amount." },
      ],
    };
  }

  // 5. Question Paper / Exam Material Classification
  if (hasQuestionPaperSignals) {
    return {
      isValid: true,
      isShort: false,
      isEducational: true,
      wordCount,
      charCount,
      category: "question_paper",
      categoryLabel: "Question Paper / Exam Set",
      statusMessage: "Exam question paper detected. Ready for active practice, solutions, and step-by-step explanations.",
      recommendedFeatures: ["summary", "quiz", "tutor"],
      optionalFeatures: ["flashcards", "mindmap"],
      unsuitableFeatures: ["planner", "export"],
      customActionPills: [
        { id: "solve_questions", label: "Solve Questions Step-by-Step", prompt: "Provide detailed, step-by-step solutions and model answers for the questions in this exam paper." },
        { id: "practice_quiz", label: "Practice as Quiz", prompt: "Test me on these questions one by one and grade my answers." },
        { id: "key_topics", label: "Identify High-Weightage Topics", prompt: "Analyze this question paper and identify which core topics have the highest mark allocation." },
      ],
    };
  }

  // Educational Content Analysis
  const hasProcessSignals = processKeywords.some((kw) => lower.includes(kw));
  const hasHierarchySignals = hierarchyKeywords.some((kw) => lower.includes(kw));

  // 6. Very Short Note (< 120 words)
  if (wordCount < 120) {
    const recommended = ["summary", "flashcards", "tutor"];
    if (hasProcessSignals) recommended.push("flowchart");
    if (hasHierarchySignals) recommended.push("mindmap");
    recommended.push("quiz");

    return {
      isValid: true,
      isShort: true,
      isEducational: true,
      wordCount,
      charCount,
      category: "short_note",
      categoryLabel: "Concise Study Note",
      statusMessage: "Concise study note understood. Focused revision tools enabled.",
      recommendedFeatures: recommended,
      optionalFeatures: hasProcessSignals ? ["flowchart"] : ["mindmap"],
      unsuitableFeatures: ["export", "videos"],
      customActionPills: [
        { id: "explain_simply", label: "Explain Simpler", prompt: "Explain this topic simply with intuitive beginner examples." },
        { id: "give_example", label: "Give Example", prompt: "Give me a practical real-world example of this concept." },
        { id: "make_flashcards", label: "Make Flashcards", prompt: "Generate 3 spaced-repetition flashcards for this note." },
        { id: "test_me", label: "Test Me", prompt: "Test me with 2 active recall questions on this note." },
      ],
    };
  }

  // 7. Process / Algorithm Content
  if (hasProcessSignals && !hasHierarchySignals) {
    return {
      isValid: true,
      isShort: false,
      isEducational: true,
      wordCount,
      charCount,
      category: "process_algorithm",
      categoryLabel: "Algorithm / Process Guide",
      statusMessage: "Process and algorithmic structure detected. Flowchart, summary, and active recall ready.",
      recommendedFeatures: ["summary", "flowchart", "quiz", "flashcards", "tutor"],
      optionalFeatures: ["mindmap", "planner"],
      unsuitableFeatures: [],
      customActionPills: [
        { id: "explain_steps", label: "Explain Step-by-Step", prompt: "Break down each step of this process/algorithm with clear inputs, operations, and expected outputs." },
        { id: "give_trace", label: "Walk Through Example Trace", prompt: "Walk through a step-by-step example execution of this procedure with sample data." },
        { id: "test_me", label: "Test Me", prompt: "Test me with practice questions on this algorithm/process." },
      ],
    };
  }

  // 8. Hierarchical Theory Content
  if (hasHierarchySignals) {
    return {
      isValid: true,
      isShort: false,
      isEducational: true,
      wordCount,
      charCount,
      category: "hierarchical_theory",
      categoryLabel: "Conceptual Theory & Taxonomy",
      statusMessage: "Structured taxonomy & multi-layer concepts detected. Mind Map, summary, and flashcards ready.",
      recommendedFeatures: ["summary", "mindmap", "flashcards", "quiz", "tutor"],
      optionalFeatures: ["flowchart", "planner", "export"],
      unsuitableFeatures: [],
      customActionPills: [
        { id: "explain_simply", label: "Explain Simpler", prompt: "Explain the classification and key principles simply with beginner analogies." },
        { id: "give_example", label: "Give Examples", prompt: "Give practical real-world examples for each category or layer discussed." },
        { id: "make_flashcards", label: "Make Flashcards", prompt: "Generate spaced-repetition flashcards for the main categories in this document." },
        { id: "test_me", label: "Test Me", prompt: "Test me with 3 active recall questions on these classifications." },
      ],
    };
  }

  // 9. Comprehensive Chapter / Long Notes (>= 500 words)
  if (wordCount >= 500) {
    return {
      isValid: true,
      isShort: false,
      isEducational: true,
      wordCount,
      charCount,
      category: "comprehensive_chapter",
      categoryLabel: "Comprehensive Study Chapter",
      statusMessage: "Comprehensive chapter material processed. Full learning suite available.",
      recommendedFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "planner", "export", "tutor"],
      optionalFeatures: [],
      unsuitableFeatures: [],
      customActionPills: [
        { id: "explain_simply", label: "Explain Simpler", prompt: "Explain the core concepts of this chapter simply with clear analogies." },
        { id: "give_example", label: "Give Practical Example", prompt: "Give a real-world case study or practical application of these concepts." },
        { id: "make_flashcards", label: "Make Flashcards", prompt: "Generate comprehensive flashcards for revision." },
        { id: "test_me", label: "Test Me", prompt: "Test me with 4 exam-style questions on this chapter." },
      ],
    };
  }

  // 10. Standard General Study Note
  return {
    isValid: true,
    isShort: false,
    isEducational: true,
    wordCount,
    charCount,
    category: "study_material",
    categoryLabel: "Study Notes",
    statusMessage: "Study material processed successfully. Key learning resources prepared.",
    recommendedFeatures: ["summary", "flashcards", "quiz", "mindmap", "flowchart", "tutor"],
    optionalFeatures: ["planner", "export"],
    unsuitableFeatures: [],
    customActionPills: [
      { id: "explain_simply", label: "Explain Simpler", prompt: "Explain this topic simply with intuitive beginner examples." },
      { id: "give_example", label: "Give Example", prompt: "Give me a practical real-world example of this concept." },
      { id: "make_flashcards", label: "Make Flashcards", prompt: "Make spaced-repetition flashcards for revision." },
      { id: "test_me", label: "Test Me", prompt: "Test me with practice questions on this topic." },
    ],
  };
}
