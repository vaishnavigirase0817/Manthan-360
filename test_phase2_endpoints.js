import { analyzeContentSuitability } from "./src/services/contentAnalyzer.ts";

async function runTests() {
  console.log("=== RUNNING ADVANCED AI CHATBOT + CONTENT INTELLIGENCE TESTS ===");

  // TEST 1: Normal Chat Question (PATH A - No Document Context)
  console.log("\n[TEST 1] Testing Normal Chat Question: 'What is active recall?'");
  try {
    const res1 = await fetch("http://localhost:3000/api/gemini/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is active recall?" }],
        context: "",
        language: "English"
      })
    });
    const data1 = await res1.json();
    console.log("Status:", res1.status);
    console.log("AI Answer:", data1.text ? data1.text.substring(0, 150) + "..." : data1);
    if (!data1.text || data1.text.includes("I can only answer questions related to your uploaded notes")) {
      console.error("FAIL: Normal question was rejected!");
    } else {
      console.log("PASS: Normal question answered instantly without document lock!");
    }
  } catch (err) {
    console.error("Test 1 error:", err);
  }

  // TEST 1B: Document-Grounded Chat Question (PATH B - With Document Context)
  console.log("\n[TEST 1B] Testing Document Grounded Question: 'What is TCP 3-way handshake?'");
  try {
    const sampleDoc = "Transmission Control Protocol (TCP) uses a three-way handshake (SYN, SYN-ACK, ACK) to establish reliable connections between client and server before data transfer begins.";
    const res1b = await fetch("http://localhost:3000/api/gemini/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Explain the TCP 3-way handshake based on my notes." }],
        context: sampleDoc,
        language: "English"
      })
    });
    const data1b = await res1b.json();
    console.log("Status:", res1b.status);
    console.log("AI Grounded Answer:", data1b.text ? data1b.text.substring(0, 150) + "..." : data1b);
    if (data1b.text && (data1b.text.includes("SYN") || data1b.text.includes("handshake") || data1b.text.includes("TCP"))) {
      console.log("PASS: Document-grounded question answered with accurate context!");
    } else {
      console.error("FAIL: Document context was not reflected!");
    }
  } catch (err) {
    console.error("Test 1B error:", err);
  }

  // TEST 2: Blank / Invalid Document Analysis
  console.log("\n[TEST 2] Testing Blank / Meaningless Document Analysis");
  const blankQuality = analyzeContentSuitability("   ");
  console.log("Blank suitability:", blankQuality);
  if (!blankQuality.isValid && blankQuality.recommendedFeatures.length === 0) {
    console.log("PASS: Blank content rejected cleanly without manufacturing fake resources!");
  } else {
    console.error("FAIL: Blank content was not rejected!");
  }

  // TEST 3: Short Note Suitability
  console.log("\n[TEST 3] Testing Short Note (OSI 7 layers)");
  const shortNote = "OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.";
  const shortQuality = analyzeContentSuitability(shortNote);
  console.log("Short note category:", shortQuality.category);
  console.log("Recommended features:", shortQuality.recommendedFeatures);
  console.log("Unsuitable features:", shortQuality.unsuitableFeatures);
  if (shortQuality.isValid && shortQuality.unsuitableFeatures.includes("export")) {
    console.log("PASS: Short note does not force heavy presentations!");
  }

  // TEST 4: Algorithmic Process Suitability
  console.log("\n[TEST 4] Testing Algorithmic Process Note");
  const algoNote = "Dijkstra Algorithm steps: 1. Initialize distances. 2. Set source distance to 0. 3. While unvisited nodes exist, pick node with minimum distance. 4. Update adjacent node distances. 5. Mark as visited.";
  const algoQuality = analyzeContentSuitability(algoNote);
  console.log("Algorithm category:", algoQuality.category);
  console.log("Recommended features:", algoQuality.recommendedFeatures);
  if (algoQuality.recommendedFeatures.includes("flowchart")) {
    console.log("PASS: Process/algorithm correctly recommended Flowchart!");
  }

  console.log("\n=== ALL VERIFICATION TESTS COMPLETED ===");
}

runTests();
