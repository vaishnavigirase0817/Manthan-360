import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser limits increased to handle large notes/images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for GoogleGenAI to prevent crash if GEMINI_API_KEY is not defined yet
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "GEMINI_API_KEY is missing or empty. Please set GEMINI_API_KEY in your .env file or environment variables."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient API retry wrapper for rate limits (Quota 429) & network timeouts
async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isRetryable =
      errorMsg.includes("429") ||
      errorMsg.includes("RESOURCE_EXHAUSTED") ||
      errorMsg.includes("quota") ||
      errorMsg.includes("fetch failed") ||
      errorMsg.includes("Timeout") ||
      errorMsg.includes("undici") ||
      (error?.status && error.status === "RESOURCE_EXHAUSTED") ||
      (error?.code && error.code === 429);

    if (isRetryable && retries > 0) {
      console.warn(
        `[Gemini API] Retryable error occurred. Waiting ${delay}ms before retry... (${retries} attempts left). Error: ${errorMsg}`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 2 + Math.floor(Math.random() * 200));
    }
    throw error;
  }
}

// Model Fallback Handler with Automatic Model Rotation to mitigate strict platform rate limits
async function generateContentWithFallback(
  payload: {
    contents: any;
    config?: any;
  },
  preferredModel = "gemini-3.5-flash-lite"
) {
  // Use verified supported Google GenAI models
  const models = [
    preferredModel,
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
  ];
  const uniqueModels = Array.from(new Set(models));

  let lastError: any = null;
  for (const model of uniqueModels) {
    try {
      const ai = getGeminiClient();
      console.log(`[Gemini API] Dispatching generation request using model: ${model}`);
      const response = await callGeminiWithRetry(
        () =>
          ai.models.generateContent({
            ...payload,
            model: model,
          }),
        1,
        1000
      );
      return response;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || String(error);
      const isQuotaOrRateLimit =
        errorMsg.includes("429") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("not found") ||
        errorMsg.includes("404") ||
        (error?.status && error.status === "RESOURCE_EXHAUSTED") ||
        (error?.code && error.code === 429);

      if (isQuotaOrRateLimit) {
        console.warn(
          `[Gemini API] Model ${model} encountered rate limit / error. Switching to next model...`
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// Helper to safely parse JSON from Gemini response
function parseGeminiJson(rawText: string | undefined): any {
  if (!rawText) return null;
  let clean = rawText.trim();
  // Strip Markdown code fences if present
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(clean.trim());
}

// Validate input text
function validateDocumentText(text: any): string {
  if (!text || typeof text !== "string" || text.trim().length < 15) {
    throw new Error(
      "Document content is empty or insufficient. Please ensure readable text was extracted from your notes."
    );
  }
  return text.trim();
}

// Format friendly error responses
function handleApiError(res: express.Response, error: any, defaultMsg: string) {
  const errorMsg = error?.message || String(error);
  console.error(`[API Error] ${defaultMsg}:`, errorMsg);

  if (errorMsg.includes("GEMINI_API_KEY is missing")) {
    return res.status(401).json({
      error:
        "Gemini API key is not configured. Please set a valid GEMINI_API_KEY in your environment or .env file.",
    });
  }

  if (
    errorMsg.includes("429") ||
    errorMsg.includes("RESOURCE_EXHAUSTED") ||
    errorMsg.includes("quota")
  ) {
    return res.status(429).json({
      error:
        "Gemini AI rate limit reached. Please wait a few moments and retry your analysis.",
    });
  }

  if (errorMsg.includes("401") || errorMsg.includes("UNAUTHENTICATED") || errorMsg.includes("invalid authentication")) {
    return res.status(401).json({
      error:
        "Invalid Gemini API key. Please configure a valid API key in your .env file.",
    });
  }

  if (errorMsg.includes("Document content is empty or insufficient")) {
    return res.status(400).json({
      error: "Document content is empty or insufficient. Please ensure readable text was extracted from your notes.",
    });
  }

  return res.status(500).json({
    error: errorMsg.length < 200 ? errorMsg : defaultMsg,
  });
}

// ==================== Gemini API Proxy Routes ====================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Summary Generator Route
app.post("/api/gemini/summary", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const language = req.body.language || "English";

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a document-grounded educational assistant for Manthan360.
You must analyze and summarize ONLY using the provided document content.
Do not use unrelated information.
Do not invent facts or extrapolate beyond the document.
Preserve the document's actual topic, definitions, key points, and core terminology.
All generated text, bullet points, headers, explanations, and revisions MUST be written fluently and completely in ${language}.

DOCUMENT CONTENT:
<<<
${text}
>>>

TASK:
Compile a short summary (1-2 key overview sentences), a detailed multi-paragraph summary, a list of 5-8 bulleted critical key points, and comprehensive markdown-formatted revision notes based STRICTLY on the document content.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortSummary: {
              type: Type.STRING,
              description: `A succinct 1-2 sentence overview summary grounded directly in the document, in ${language}.`,
            },
            detailedSummary: {
              type: Type.STRING,
              description: `A comprehensive paragraphs-based detailed summary grounded directly in the document, in ${language}.`,
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `A list of 5-8 bulleted critical key concepts directly from the document, in ${language}.`,
            },
            revisionNotes: {
              type: Type.STRING,
              description: `Clean markdown notes with definitions, formulas, headers, and explanations from the document, in ${language}.`,
            },
          },
          required: ["shortSummary", "detailedSummary", "keyPoints", "revisionNotes"],
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate document summary");
  }
});

// Interactive Multi-Choice Quiz Route
app.post("/api/gemini/quiz", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const language = req.body.language || "English";

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a document-grounded exam generator for Manthan360.
Generate multiple-choice questions strictly testing facts, concepts, definitions, and mechanisms present in the provided document.
Do not generate questions on outside topics.
The questions, options, and correctAnswer fields MUST be written fluently and completely in ${language}.
The correctAnswer MUST match exactly one of the 4 option strings.

DOCUMENT CONTENT:
<<<
${text}
>>>

TASK:
Generate exactly 8-10 high-quality multiple choice questions (MCQ) testing comprehension of this exact document.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: `The quiz question in ${language}.` },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `Exactly 4 distinct options in ${language}.`,
              },
              correctAnswer: {
                type: Type.STRING,
                description: `The correct option string in ${language}, matching one option exactly.`,
              },
            },
            required: ["question", "options", "correctAnswer"],
          },
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate quiz questions");
  }
});

// Flashcards Generator Route
app.post("/api/gemini/flashcards", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const language = req.body.language || "English";

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a document-grounded flashcard generator for Manthan360.
Create active recall flashcards based strictly on the definitions, concepts, formulas, and facts present in the provided document.
Do not invent unrelated topics.
The question and answer fields MUST be written fluently and completely in ${language}.

DOCUMENT CONTENT:
<<<
${text}
>>>

TASK:
Generate exactly 8-10 high-quality flashcards to memorize essential elements within this document.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: `The revision question or concept prompt in ${language}.`,
              },
              answer: {
                type: Type.STRING,
                description: `The concise definition or explanation from the document in ${language}.`,
              },
            },
            required: ["question", "answer"],
          },
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate flashcards");
  }
});

// Mind Map Generator Route
app.post("/api/gemini/mindmap", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const language = req.body.language || "English";

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a document-grounded concept mapper for Manthan360.
Generate a structured hierarchical recursive mind map tree reflecting the actual structure, categories, and subdivisions of the provided document.
Do not introduce outside topics.
Every label and sub-item MUST be written in ${language}.

DOCUMENT CONTENT:
<<<
${text}
>>>

TASK:
Create a hierarchical mind map of the document concepts.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            label: {
              type: Type.STRING,
              description: `The main parent topic of the document in ${language}.`,
            },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: {
                    type: Type.STRING,
                    description: `A primary branch/category from the document in ${language}.`,
                  },
                  children: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: {
                          type: Type.STRING,
                          description: `Sub-point or key detail under this branch in ${language}.`,
                        },
                      },
                      required: ["label"],
                    },
                  },
                },
                required: ["label"],
              },
            },
          },
          required: ["label", "children"],
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate mind map");
  }
});

// Flowchart Generator Route
app.post("/api/gemini/flowchart", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const language = req.body.language || "English";

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a document-grounded flowchart designer for Manthan360.
Extract the sequential steps, chronological processes, workflows, or logical lifecycle described in the provided document.
Do not invent unrelated steps.
The 'label' and 'description' fields MUST be written fluently in ${language}.
Keep node 'id' and 'next' as simple index strings (e.g. 'stage_1', 'stage_2').

DOCUMENT CONTENT:
<<<
${text}
>>>

TASK:
Generate a sequential process flowchart reflecting the workflow/lifecycle in this document.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Index key e.g. 'stage_1', 'stage_2'." },
              label: { type: Type.STRING, description: `The step or stage title in ${language}.` },
              description: { type: Type.STRING, description: `Step explanation in ${language}.` },
              next: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of subsequent step IDs.",
              },
            },
            required: ["id", "label", "description", "next"],
          },
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate flowchart");
  }
});

// AI Tutor / Conversational Study Companion Route
app.post("/api/gemini/tutor", async (req, res) => {
  try {
    const { messages, context, language = "English" } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "A valid list of message logs is required" });
    }

    const contents: any[] = [];
    messages.forEach((m: any) => {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    });

    const hasDocumentContext = context && typeof context === "string" && context.trim().length >= 15;

    const systemInstruction = hasDocumentContext
      ? `You are "Manthan360", an empathetic, brilliant AI study companion and academic mentor.
The student has provided their active study material context below.
When the student asks questions directly concerning this material, ground your explanation accurately in the provided document content.
If the student asks for beginner analogies, practical examples, step-by-step breakdowns, exam tips, or related explanations, explain them clearly and pedagogically.
Use structured, clean markdown formatting with bullet points and bold highlights.
Language: ${language}.

STUDY DOCUMENT CONTEXT:
<<<
${context.trim()}
>>>`
      : `You are "Manthan360", an empathetic, brilliant AI study companion and academic mentor.
Help the student learn, master difficult subjects, explain topics simply, provide intuitive real-world examples, and structure their study strategies.
Be structured, encouraging, and clear with clean markdown formatting.
Language: ${language}.`;

    const response = await generateContentWithFallback({
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
      },
    });

    res.json({ text: response.text || "" });
  } catch (error: any) {
    handleApiError(res, error, "Failed to get chat response");
  }
});

// Study Planner Generator Route
app.post("/api/gemini/studyplan", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const language = req.body.language || "English";

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a study planner for Manthan360.
Create a personalized daily and weekly study roadmap specifically for mastering the subject matter in the provided document.
All tasks, objectives, and tips MUST relate directly to the document topics.
All text fields MUST be in ${language}.

DOCUMENT CONTENT:
<<<
${text}
>>>

TASK:
Generate a structured Daily Study Plan, Weekly Study Plan, and practical study tips for this document.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "E.g. '08:00 AM - 09:30 AM'" },
                  task: { type: Type.STRING, description: `Study task in ${language}.` },
                  focus: { type: Type.STRING, description: `Methodology in ${language}.` },
                },
                required: ["time", "task", "focus"],
              },
            },
            weeklyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: `Day label in ${language}.` },
                  topic: { type: Type.STRING, description: `Sub-topic from document in ${language}.` },
                  objectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: `Milestones in ${language}.`,
                  },
                },
                required: ["day", "topic", "objectives"],
              },
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `Memory tips for this material in ${language}.`,
            },
          },
          required: ["dailyPlan", "weeklyPlan", "tips"],
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate study plan");
  }
});

// Diagnostics Route
app.post("/api/gemini/diagnostics", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const { attempts, language = "English" } = req.body;

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are an academic diagnostics analyzer for Manthan360.
Analyze the concepts in the provided document and quiz attempts to identify weak areas and learning progression milestones.
All concepts and milestones MUST directly relate to the uploaded document.
All text fields MUST be in ${language}.

DOCUMENT CONTENT:
<<<
${text}
>>>

Quiz Attempts History: ${JSON.stringify(attempts || [])}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            understandingScore: { type: Type.INTEGER },
            revisionScore: { type: Type.INTEGER },
            quizScore: { type: Type.INTEGER },
            masteryScore: { type: Type.INTEGER },
            weakConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING, description: `Concept name from document in ${language}.` },
                  reason: { type: Type.STRING, description: `Diagnosis in ${language}.` },
                  revisionTopic: { type: Type.STRING, description: `Topic in ${language}.` },
                  suggestedAction: { type: Type.STRING, description: `Action in ${language}.` },
                },
                required: ["concept", "reason", "revisionTopic", "suggestedAction"],
              },
            },
            basics: { type: Type.ARRAY, items: { type: Type.STRING } },
            intermediate: { type: Type.ARRAY, items: { type: Type.STRING } },
            advanced: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "understandingScore",
            "revisionScore",
            "quizScore",
            "masteryScore",
            "weakConcepts",
            "basics",
            "intermediate",
            "advanced",
          ],
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate diagnostics");
  }
});

// Slide-Based Animated Video Presentation compiler
app.post("/api/gemini/slides", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const language = req.body.language || "English";

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a slide presentation designer for Manthan360.
Compile a 5-slide deck grounded strictly in the provided document.
All slide text and narration MUST be written in ${language}.
Illustration prompts must be in English for image generation.

DOCUMENT CONTENT:
<<<
${text}
>>>`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: `Slide header in ${language}.` },
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `Exactly 3 bullets in ${language}.`,
              },
              accentText: { type: Type.STRING, description: `Key takeaway in ${language}.` },
              illustrationPrompt: { type: Type.STRING, description: "Visual prompt in English." },
              narration: { type: Type.STRING, description: `Spoken script in ${language}.` },
            },
            required: ["title", "bullets", "accentText", "illustrationPrompt", "narration"],
          },
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate slide deck");
  }
});

// Presentation Deck Route
app.post("/api/gemini/presentation", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const { title = "Document Study", summary, diagnostics, language = "English" } = req.body;

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a curriculum presentation designer for Manthan360.
Create a 6-slide presentation deck strictly based on the provided document content on "${title}".
All titles, elements, keyTakeawayBox, and diagram content MUST be in ${language}.
The 'imagePrompt' field MUST be in English.

DOCUMENT CONTENT:
<<<
${text}
>>>`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slideType: {
                type: Type.STRING,
                description: "Must be 'title', 'problem', 'concepts', 'summary', 'roadmap', or 'conclusion'",
              },
              title: { type: Type.STRING, description: `Slide title in ${language}.` },
              subtitle: { type: Type.STRING, description: `Subtitle in ${language}.` },
              elements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `Body bullet points in ${language}.`,
              },
              keyTakeawayBox: { type: Type.STRING, description: `Takeaway in ${language}.` },
              visualSummarySection: { type: Type.STRING, description: `Visual summary in ${language}.` },
              imagePrompt: { type: Type.STRING, description: "Prompt in English." },
              themeColors: {
                type: Type.OBJECT,
                properties: {
                  primary: { type: Type.STRING },
                  secondary: { type: Type.STRING },
                  accent: { type: Type.STRING },
                  bg: { type: Type.STRING },
                },
                required: ["primary", "secondary", "accent", "bg"],
              },
              diagram: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  data: { type: Type.STRING },
                },
                required: ["type", "title", "data"],
              },
            },
            required: [
              "slideType",
              "title",
              "elements",
              "keyTakeawayBox",
              "visualSummarySection",
              "imagePrompt",
              "themeColors",
              "diagram",
            ],
          },
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate presentation deck");
  }
});

// Video Script Route
app.post("/api/gemini/videoscript", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const { title = "Study Topic", language = "English" } = req.body;

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are an educational video producer for Manthan360.
Craft a 3-5 scene educational video script on "${title}" based strictly on the provided document content.
All narration and visual descriptions MUST be in ${language}.

DOCUMENT CONTENT:
<<<
${text}
>>>`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneNumber: { type: Type.INTEGER },
              title: { type: Type.STRING, description: `Scene title in ${language}.` },
              narration: { type: Type.STRING, description: `Narration in ${language}.` },
              visuals: { type: Type.STRING, description: `Visual description in ${language}.` },
            },
            required: ["sceneNumber", "title", "narration", "visuals"],
          },
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate video script");
  }
});

// Virtual AI Teacher Mode Route
app.post("/api/gemini/teacher", async (req, res) => {
  try {
    const text = validateDocumentText(req.body.text);
    const { title = "Study Lesson", language = "English" } = req.body;

    const response = await generateContentWithFallback({
      contents: `SYSTEM INSTRUCTION:
You are a university professor for Manthan360.
Synthesize an interactive "Virtual AI Teacher Mode" lecture package strictly on "${title}" using the provided document content.
All lecture scripts, scene narrations, and chapter content MUST be in ${language}.
The 'imagePrompt' field MUST be in English.

DOCUMENT CONTENT:
<<<
${text}
>>>`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeTopic: { type: Type.STRING, description: `Theme in ${language}.` },
            imagePrompt: { type: Type.STRING, description: "Image prompt in English." },
            lectureScript: { type: Type.STRING, description: `Lecture in ${language}.` },
            narrationElevenLabs: { type: Type.STRING, description: `TTS script in ${language}.` },
            avatarInstructions: { type: Type.STRING, description: `Avatar cues in ${language}.` },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  sceneType: { type: Type.STRING },
                  title: { type: Type.STRING },
                  narrationScript: { type: Type.STRING },
                  slideSyncPhrase: { type: Type.STRING },
                  visualSceneDirections: { type: Type.STRING },
                },
                required: [
                  "sceneNumber",
                  "sceneType",
                  "title",
                  "narrationScript",
                  "slideSyncPhrase",
                  "visualSceneDirections",
                ],
              },
            },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterTitle: { type: Type.STRING },
                  content: { type: Type.STRING },
                  example: { type: Type.STRING },
                  diagramType: { type: Type.STRING },
                  diagramDescription: { type: Type.STRING },
                },
                required: ["chapterTitle", "content", "example", "diagramType", "diagramDescription"],
              },
            },
          },
          required: [
            "themeTopic",
            "imagePrompt",
            "lectureScript",
            "narrationElevenLabs",
            "avatarInstructions",
            "scenes",
            "chapters",
          ],
        },
      },
    });

    const parsed = parseGeminiJson(response.text);
    res.json(parsed);
  } catch (error: any) {
    handleApiError(res, error, "Failed to generate AI Teacher package");
  }
});

// ==================== Vite / Static Routing ====================

async function bootstrap() {
  if (process.env.NODE_ENV === "production") {
    // Production Mode: Serve static bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Development Mode: Use Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Manthan360 fullstack server running on http://localhost:${PORT}`);
  });
}

bootstrap();
