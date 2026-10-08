export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  pageNumber?: number;
  slideNumber?: number;
  sectionTitle?: string;
  text: string;
  wordCount: number;
}

export interface RetrievalResult {
  relevantChunks: DocumentChunk[];
  sources: string[];
  hasRelevantContent: boolean;
  isSpecificTopicQuery: boolean;
  extractedTopic?: string;
}

/**
 * Splits document text into manageable, structured chunks with page/slide metadata.
 * Never sends an entire 300-page document in a single prompt.
 */
export function chunkDocument(
  text: string,
  documentId: string,
  metadata?: { fileName?: string; pageCount?: number }
): DocumentChunk[] {
  if (!text || typeof text !== "string") return [];

  const chunks: DocumentChunk[] = [];
  const cleanText = text.trim();

  // Check if text has explicit Page or Slide markers (e.g. "--- Page 1 ---" or "Slide 1:")
  const pageRegex = /(?:---+\s*(?:Page|Slide)\s*(\d+)\s*---+|\[(?:Page|Slide)\s*(\d+)\]|^(?:Page|Slide)\s*(\d+)[:\s\n])/gim;
  
  const hasPageMarkers = pageRegex.test(cleanText);

  if (hasPageMarkers) {
    // Reset regex index
    pageRegex.lastIndex = 0;
    const parts = cleanText.split(/(?:---+\s*(?:Page|Slide)\s*\d+\s*---+|\[(?:Page|Slide)\s*\d+\]|^(?:Page|Slide)\s*\d+[:\s\n])/gim);
    const matches = cleanText.match(/(?:---+\s*(?:Page|Slide)\s*(\d+)\s*---+|\[(?:Page|Slide)\s*(\d+)\]|^(?:Page|Slide)\s*(\d+)[:\s\n])/gim) || [];

    let currentChunkIdx = 0;
    for (let i = 0; i < parts.length; i++) {
      const partContent = parts[i]?.trim();
      if (!partContent || partContent.length < 15) continue;

      let pageNum = i;
      if (matches[i - 1]) {
        const numMatch = matches[i - 1].match(/\d+/);
        if (numMatch) pageNum = parseInt(numMatch[0], 10);
      }

      // If page is very large (> 4000 chars), subdivide into sub-chunks
      if (partContent.length > 3500) {
        const paragraphs = partContent.split(/\n\n+/);
        let currentSubText = "";
        for (const p of paragraphs) {
          if ((currentSubText + p).length > 2500 && currentSubText.length > 0) {
            chunks.push({
              chunkId: `${documentId}_chunk_${currentChunkIdx++}`,
              documentId,
              pageNumber: pageNum,
              text: currentSubText.trim(),
              wordCount: currentSubText.trim().split(/\s+/).length,
            });
            currentSubText = p + "\n\n";
          } else {
            currentSubText += p + "\n\n";
          }
        }
        if (currentSubText.trim().length > 0) {
          chunks.push({
            chunkId: `${documentId}_chunk_${currentChunkIdx++}`,
            documentId,
            pageNumber: pageNum,
            text: currentSubText.trim(),
            wordCount: currentSubText.trim().split(/\s+/).length,
          });
        }
      } else {
        chunks.push({
          chunkId: `${documentId}_chunk_${currentChunkIdx++}`,
          documentId,
          pageNumber: pageNum,
          text: partContent,
          wordCount: partContent.split(/\s+/).length,
        });
      }
    }
  } else {
    // Standard paragraph & section chunking
    const paragraphs = cleanText.split(/\n\n+/);
    let currentChunkText = "";
    let chunkCounter = 0;
    let estimatedPage = 1;
    let accumulatedChars = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i].trim();
      if (!p) continue;

      accumulatedChars += p.length;
      estimatedPage = Math.max(1, Math.ceil(accumulatedChars / 2200)); // ~350 words / page

      if ((currentChunkText + p).length > 2200 && currentChunkText.length > 0) {
        chunks.push({
          chunkId: `${documentId}_chunk_${chunkCounter++}`,
          documentId,
          pageNumber: estimatedPage,
          text: currentChunkText.trim(),
          wordCount: currentChunkText.trim().split(/\s+/).length,
        });
        currentChunkText = p + "\n\n";
      } else {
        currentChunkText += p + "\n\n";
      }
    }

    if (currentChunkText.trim().length > 0) {
      chunks.push({
        chunkId: `${documentId}_chunk_${chunkCounter++}`,
        documentId,
        pageNumber: estimatedPage,
        text: currentChunkText.trim(),
        wordCount: currentChunkText.trim().split(/\s+/).length,
      });
    }
  }

  return chunks;
}

/**
 * Smart Relevance Search Engine:
 * Retrieves only the top relevant chunks for any question or topic search.
 */
export function retrieveRelevantChunks(
  chunks: DocumentChunk[],
  userQuery: string,
  topK = 4
): RetrievalResult {
  if (!chunks || chunks.length === 0 || !userQuery || !userQuery.trim()) {
    return {
      relevantChunks: [],
      sources: [],
      hasRelevantContent: false,
      isSpecificTopicQuery: false,
    };
  }

  const queryRaw = userQuery.trim();
  
  // Detect specific topic / search prefixes (e.g. "Topic: AVL Tree", "Find: deadlock", "Slide 7")
  let cleanQuery = queryRaw;
  let isSpecificTopic = false;
  let extractedTopic = "";

  const prefixMatch = queryRaw.match(/^(?:Topic|Find|Search|Explain|About|Unit|Chapter|Slide|Page)\s*:\s*(.+)/i);
  if (prefixMatch) {
    cleanQuery = prefixMatch[1].trim();
    isSpecificTopic = true;
    extractedTopic = cleanQuery;
  }

  // Check for specific slide or page number query e.g. "explain slide 7", "page 42"
  const pageTargetMatch = queryRaw.match(/(?:page|slide)\s*(\d+)/i);
  const targetPageNum = pageTargetMatch ? parseInt(pageTargetMatch[1], 10) : null;

  // Extract query keywords (excluding common stop words)
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by", "about",
    "is", "are", "was", "were", "what", "how", "why", "when", "where", "who", "which",
    "can", "you", "me", "my", "from", "notes", "give", "tell", "explain", "this", "that"
  ]);

  const queryTokens = cleanQuery
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Score each chunk
  const scoredChunks = chunks.map((chunk) => {
    let score = 0;
    const chunkLower = chunk.text.toLowerCase();

    // 1. Direct Page / Slide Match Boost
    if (targetPageNum !== null && chunk.pageNumber === targetPageNum) {
      score += 100;
    }

    // 2. Exact phrase match boost
    if (cleanQuery.length > 4 && chunkLower.includes(cleanQuery.toLowerCase())) {
      score += 40;
    }

    // 3. Keyword occurrence & density scoring
    for (const token of queryTokens) {
      const occurrences = (chunkLower.match(new RegExp(`\\b${token}`, "g")) || []).length;
      if (occurrences > 0) {
        score += Math.min(occurrences * 5, 25);
      }
    }

    return { chunk, score };
  });

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  // Filter chunks with positive relevance
  const topScored = scoredChunks.filter((item) => item.score > 0).slice(0, topK);

  // If no specific keyword matched, but the document is small (<= 3 chunks), provide all chunks
  let selectedChunks: DocumentChunk[] = [];
  if (topScored.length > 0) {
    selectedChunks = topScored.map((s) => s.chunk);
  } else if (chunks.length <= 3) {
    selectedChunks = chunks;
  }

  // Format distinct source citations
  const sourcesSet = new Set<string>();
  selectedChunks.forEach((c) => {
    if (c.pageNumber) {
      sourcesSet.add(`Page ${c.pageNumber}`);
    }
  });

  const sources = Array.from(sourcesSet);

  return {
    relevantChunks: selectedChunks,
    sources,
    hasRelevantContent: selectedChunks.length > 0,
    isSpecificTopicQuery: isSpecificTopic,
    extractedTopic: extractedTopic || undefined,
  };
}
