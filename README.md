# Manthan360

> **AI-Powered Smart Learning Platform**

Manthan360 is an advanced, AI-driven educational platform designed to transform raw study materials—including PDFs, handwritten notes, images, and text documents—into interactive, structured, and highly personalized learning resources. Powered by Google Gemini AI, Tesseract OCR, and Firebase, Manthan360 enables students to effortlessly turn static content into executive summaries, interactive quizzes, memory flashcards, visual mind maps, step-by-step flowcharts, personalized study roadmaps, and presentation decks.

---

## 2. Project Overview

**Manthan360** is a fullstack web application engineered for modern students, educators, and lifelong learners. Traditional study workflows often involve hours of manual note summarization, key concept extraction, and passive reading, leading to low retention and exam fatigue. 

Manthan360 solves this problem by using state-of-the-art Generative AI and Optical Character Recognition (OCR) to instantly process uploaded educational content. Whether you upload handwritten lecture notes or digital study guides, Manthan360 analyzes the core topics and generates an ecosystem of active recall tools, adaptive quizzes, visual flowcharts, progress analytics, and multi-language learning aids.

---

## 3. Problem Statement

Students and self-learners consistently face major friction points in their daily academic routines:

* **Large & Complex PDFs:** Dense textbooks and multi-page PDFs are difficult to digest and review efficiently under tight deadlines.
* **Unorganized Handwritten Notes:** Converting physical notebook pages into searchable, structured digital notes takes significant effort.
* **Time-Consuming Manual Summarization:** Creating revision guides, flashcards, and practice quizzes manually consumes valuable study hours.
* **Inefficient Revision Methods:** Rereading static notes leads to low cognitive engagement and poor long-term memory retention.
* **Lack of Personalized Guidance:** Students lack 24/7 access to a personal tutor who can break down specific weak concepts.
* **Limited Visual Learning Tools:** Text-heavy study material fails to cater to visual learners who benefit from diagrams, flowcharts, and mind maps.
* **Language Barriers:** Accessing quality educational summaries and quizzes in native or regional languages is often restricted.
* **Exam Stress & Anxiety:** Overwhelming amounts of unorganized content lead to burnout during test preparation.

### Operational Impact
* **Reduced Productivity:** Hours wasted on manual copying and formatting instead of active recall.
* **Poor Concept Retention:** Passive reading results in rapid decay of learned information.
* **Inefficient Revision:** Inability to quickly locate key concepts during exam preparation.
* **Increased Academic Stress:** Disorganization causes cognitive overload and test anxiety.

---

## 4. Our Solution

Manthan360 addresses these challenges by offering an end-to-end AI-powered learning environment:

* **OCR & Document Processing:** Instant text extraction from images of handwritten or typed notes using Tesseract.js, alongside PDF document parsing.
* **AI Summary Engine:** Automated generation of short executive summaries, comprehensive detailed breakdowns, bulleted key points, and structured revision notes.
* **Interactive Quiz Room:** AI-generated 10-question multiple-choice quizzes with instant feedback, explanations, and score tracking.
* **Revision Flashcards:** 3D flip card flashcards designed for active recall and spaced repetition practice.
* **Visual Mind Maps:** Automated visual hierarchy tree mapping using interactive canvas nodes.
* **Step-by-Step Flowcharts:** Process flow diagrams built with `@xyflow/react` to visualize sequential concepts and systems.
* **Interactive AI Tutor:** A 24/7 AI learning assistant capable of answering questions, clarifying doubts, and providing customized explanations based on uploaded note context.
* **Adaptive Study Planner & Roadmap:** Automated creation of daily schedules, weekly milestones, and actionable study recommendations.
* **AI Presentation & Deck Generator:** Conversion of study content into complete presentation slides with visual prompts and structured key takeaways.
* **Multilingual Learning Support:** Real-time translation and generation of summaries, quizzes, and tutor responses across multiple global and regional languages.
* **Firebase Storage & Authentication:** Secure Google Sign-In authentication, user session persistence, and Firestore cloud storage for saved notes and analytics.

---

## 5. Key Features

| Feature | Description |
| :--- | :--- |
| **OCR Text Extraction** | Client-side Optical Character Recognition powered by Tesseract.js for converting handwritten and typed note images into digital text. |
| **PDF & Document Analysis** | Automated ingestion and text processing of PDF textbooks, lecture slides, and study guides. |
| **AI Summary Generator** | Synthesizes complex documents into 1-2 sentence overviews, detailed multi-paragraph summaries, and structured revision guides. |
| **Interactive Mind Maps** | Generates expandable, hierarchical concept trees to visualize topic relationships and sub-branches. |
| **Step-by-Step Flowcharts** | Maps processes, algorithms, and biological/chemical cycles into visual node flows powered by `@xyflow/react`. |
| **Quiz Generator** | Dynamically constructs 10-question multiple-choice practice exams with instant answer validation and scoring. |
| **Memory Flashcards** | Interactive 3D flip-card interface built for active recall practice and spaced repetition. |
| **24/7 AI Tutor** | Context-aware AI chat assistant that answers doubts and explains concepts directly from uploaded note content. |
| **Study Roadmap & Planner** | Generates structured daily time blocks, weekly learning objectives, and custom study tips. |
| **AI Presentation Deck** | Formats note topics into structured slide presentation items equipped with infographics prompts and slide notes. |
| **Multilingual Support** | Translates and generates all study resources in multiple target languages (e.g., English, Hindi, Marathi, Spanish, French, German). |
| **Cloud Storage** | Stores user note history, diagnostic progress, and custom study plans securely in Firebase Firestore. |
| **Google Authentication** | Seamless user login and registration powered by Firebase Authentication with local demo session fallback. |
| **Responsive UI** | High-aesthetic dark-mode dashboard designed with Tailwind CSS v4, Framer Motion, and modern typography. |

---

## 6. How Manthan360 Works

```text
Student User
  ↓
Google Authentication / Demo Guest Access
  ↓
Upload PDF / Image Notes / Paste Text
  ↓
Document Ingestion & File Processing
  ↓
Client-Side OCR (Tesseract.js) / Text Extraction
  ↓
Clean Extracted Study Content
  ↓
Google Gemini AI Engine (server.ts)
  ↓
AI Learning Resources Generation
  ├── Short & Detailed Summaries
  ├── 10-Question Interactive Quiz
  ├── 3D Memory Flashcards
  ├── Visual Mind Map Hierarchy
  ├── Process Flowchart Nodes
  ├── Contextual AI Tutor Session
  ├── Daily & Weekly Study Plan
  ├── Progress & Diagnostics Analytics
  ├── Virtual AI Teacher Session Script
  └── Slide Presentation Deck
  ↓
Firebase Firestore Persistence
  ↓
Interactive Student Dashboard
```

---

## 7. System Architecture

Manthan360 is built using a unified fullstack architecture where an Express Node.js server seamlessly integrates with Vite middleware during development and serves static production assets in production.

### Frontend
* **React 19 & TypeScript:** Component-based user interface with strict typing.
* **Vite v6:** Fast bundler and development server.
* **React Router DOM v7:** SPA routing between Landing Page (`/`) and Protected Student Dashboard (`/dashboard`).
* **Visualization Libraries:** `@xyflow/react` for node-based flowchart rendering and Recharts for progress analytics graphs.
* **Animations & Styling:** Framer Motion (`motion/react`) for smooth page transitions and micro-interactions, styled with Tailwind CSS v4.
* **OCR & Export Utilities:** `tesseract.js` for client-side text recognition, `pptxgenjs` for PowerPoint deck generation, and `html-to-image` for canvas exports.

### Backend
* **Node.js & Express v4:** High-performance RESTful API server defined in `server.ts`.
* **TypeScript Execution:** Powered by `tsx` for seamless TypeScript node runtime execution.
* **Gemini Proxy Routes:** Secure Express endpoints handling AI generation requests.
* **Resilient API Handling:** Implements automatic retries with exponential backoff and intelligent model rotation fallback (`gemini-3.5-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest`) to manage quota rate limits.
* **High-Fidelity Educational Fallback Engine:** Offline deterministic generator ensuring continuous operation even during upstream AI service disruptions.

### AI Layer
* **Google Gemini API (`@google/genai`):** Evaluates note text and extracts structured JSON responses matching strict schemas for summaries, quizzes, flashcards, mind maps, flowcharts, study plans, diagnostics, and presentation slides.

### Database & Cloud
* **Firebase Authentication:** Secures user accounts via Google Auth Provider (`signInWithPopup`).
* **Firebase Firestore:** Cloud database storing user notes, diagnostic scores, quiz attempts, and active learning streaks under `manthan-360`.

---

## 8. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 6 |
| **Routing** | React Router DOM v7 |
| **Backend Runtime** | Node.js + Express v4 + `tsx` |
| **AI Infrastructure** | Google Gemini API (`@google/genai`) |
| **OCR Engine** | Tesseract.js v7 |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Authentication (Google Auth) |
| **Flowchart Visualization** | `@xyflow/react` v12 |
| **Analytics Charts** | Recharts v3 |
| **Animations** | Framer Motion (`motion` v12) |
| **Icons** | Lucide React |
| **Presentation Export** | PptxGenJS v4 |
| **Styling** | Tailwind CSS v4 + `@tailwindcss/vite` |

---

## 9. Project Folder Structure

```text
Manthan360/
├── .env.example                  # Environment variable blueprint
├── .gitignore                    # Git exclusion rules
├── README.md                     # Complete project documentation
├── firebase-applet-config.json   # Frontend Firebase sandbox config
├── firebase-blueprint.json       # Workspace platform blueprint
├── firestore.rules               # Firestore security rules
├── index.html                    # HTML entry point
├── metadata.json                 # Project metadata
├── package.json                  # Root dependencies and scripts
├── server.ts                     # Express backend & Gemini API proxy server
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
│
└── src/                          # Frontend React Source
    ├── App.tsx                   # Main App Router & authentication gate
    ├── index.css                 # Global CSS & Tailwind imports
    ├── main.tsx                  # React DOM root entry
    ├── types.ts                  # TypeScript interfaces & data models
    │
    ├── components/               # Reusable UI Components
    │   ├── Loader.tsx            # Animated loading indicator
    │   ├── Navbar.tsx            # Navigation header & language switch
    │   ├── NoteUploader.tsx      # File drag-and-drop & OCR parser
    │   ├── QuizCard.tsx          # MCQ quiz interface
    │   ├── Sidebar.tsx           # Dashboard tab navigation sidebar
    │   └── SummaryCard.tsx       # Summary viewer component
    │
    ├── context/                  # React Context
    │   └── LanguageContext.tsx   # Global language selection state
    │
    ├── pages/                    # Main View Pages
    │   ├── Dashboard.tsx         # Primary student dashboard & note history
    │   ├── ExportHub.tsx         # PowerPoint, PDF, & text export suite
    │   ├── Flashcards.tsx        # 3D interactive flashcards page
    │   ├── Flowchart.tsx         # Process flowchart view
    │   ├── LandingPage.tsx       # Public hero & feature landing page
    │   ├── LearningVideos.tsx    # AI Virtual Teacher video script view
    │   ├── Login.tsx             # Auth login modal
    │   ├── MindMap.tsx           # Interactive mind map view
    │   ├── ProgressAnalytics.tsx # Study metrics & streak tracking
    │   ├── Quiz.tsx              # Quiz room view
    │   ├── StudyPlanner.tsx      # Daily/Weekly study roadmap view
    │   ├── Summary.tsx           # Detailed summary & revision view
    │   ├── Tutor.tsx             # Interactive AI Tutor chat view
    │   └── UploadNotes.tsx       # Standalone note upload view
    │
    ├── services/                 # Service Integrations
    │   ├── api.ts                # Frontend API client for Express backend
    │   ├── firebase.ts           # Firebase initialization & auth helpers
    │   └── gamification.ts       # Streak counter & Firestore sync logic
    │
    └── translations/             # i18n Internationalization
        └── index.ts              # Multi-language dictionary tokens
```

---

## 10. Core Backend Modules

All backend logic in Manthan360 is encapsulated within `server.ts` to ensure zero-latency communication with the Vite dev server and single-command deployment.

### `server.ts` - Master Fullstack Server
* Initializes Express with body-parser limits set to `50mb` to support large base64 image uploads and note context payloads.
* Establishes the Vite development middleware when `process.env.NODE_ENV !== "production"`.

### Gemini AI Client & Resilient Wrapper
* `getGeminiClient()`: Lazily initializes the `@google/genai` client using `process.env.GEMINI_API_KEY`.
* `callGeminiWithRetry()`: Wraps API calls with automatic retry loops when encountering HTTP 429 rate limits or network timeouts.
* `generateContentWithFallback()`: Performs automatic model rotation across `gemini-3.5-flash`, `gemini-3.1-flash-lite`, and `gemini-flash-latest`.

### `generateEducationalFallback()`
* A comprehensive offline fallback generator that extracts key terms, capitalized entities, and structured paragraphs from user notes to construct high-fidelity mock summaries, quizzes, flashcards, mind maps, and study plans if AI services are unreachable.

### Authentication & Data Flow Middleware
* Validates incoming JSON payloads and handles cross-origin requests securely.

---

## 11. AI Capabilities

Manthan360 offers 12 specialized AI capabilities powered by Google Gemini structured JSON outputs:

### 1. AI Summary
Generates a 1-2 sentence executive overview, a comprehensive detailed multi-paragraph explanation, bulleted key takeaways, and complete Markdown-formatted revision notes equipped with LaTeX formulas.

### 2. Quiz Generator
Constructs a 10-question multiple-choice practice quiz with 4 distinct options per question, correct answer flags, and concept explanations.

### 3. Revision Flashcards
Generates 10 targeted Q&A pairs specifically optimized for active recall practice and spaced repetition.

### 4. Mind Map
Structures hierarchical concept trees containing root topics, main chapters, and granular sub-nodes.

### 5. Flowchart
Generates step-by-step process nodes with unique IDs, labels, descriptions, and directional edge links (`next` arrays).

### 6. AI Tutor
Provides a context-aware chat assistant that analyzes conversation history and note content to resolve student doubts in real-time.

### 7. Study Plan & Roadmap
Generates daily time-blocked schedules, 5-day structured milestone objectives, and practical active learning study tips.

### 8. Study Diagnostics
Analyzes student quiz performance to compute Understanding, Revision, and Mastery scores while identifying specific weak concepts and recommended revision actions.

### 9. Presentation Deck
Generates structured slide presentations complete with theme colors, key takeaway boxes, visual summary sections, and graphic prompts.

### 10. AI Video Script
Compiles multi-scene educational video scripts with scene numbers, visual direction cues, and spoken narration scripts.

### 11. Virtual AI Teacher Pack
Constructs an 8-scene lecture pack featuring formal lecture scripts, ElevenLabs voice narration cues, avatar synchronization instructions (HeyGen, Synthesia, D-ID), and chapter breakdowns.

---

## 12. OCR & Document Processing

Manthan360 handles document processing through a streamlined 9-step pipeline:

1. **Upload:** User selects an image (PNG, JPG) or PDF document via the drag-and-drop file uploader (`NoteUploader.tsx`).
2. **File Validation:** The application verifies file format and auto-fills a clean note title based on the filename.
3. **Text Recognition (OCR):** If an image is uploaded, Tesseract.js initializes client-side recognition using the English (`eng`) language model while broadcasting real-time percentage progress.
4. **PDF Handling:** PDF files provide extracted text guides and direct copy-paste fallback options for advanced multi-column layouts.
5. **Text Cleaning:** Extracted text is stripped of noise and formatted into readable study paragraphs.
6. **AI Dispatch:** The clean text is transmitted via `fetch` to Express backend endpoints in `server.ts`.
7. **Gemini Generation:** Google Gemini processes the text alongside the student's preferred language setting.
8. **Dashboard Render:** AI-generated summaries, quizzes, flashcards, mind maps, and flowcharts render dynamically across dashboard tabs.
9. **Cloud Sync:** The processed note object and generated resources are stored in Firebase Firestore under the authenticated user's profile.

---

## 13. Authentication & Security

* **Firebase Authentication:** User identity is verified using Google Sign-In (`signInWithPopup`).
* **Demo Sandbox Fallback:** Enables instant guest access (`manthan360_demo_user` stored in `localStorage`) for testing without mandatory credential entry.
* **Firestore Security Rules:** Configured in `firestore.rules` to ensure students can only read and write their own uploaded study notes and diagnostic data.
* **API Key Protection:** `GEMINI_API_KEY` and Firebase Admin credentials remain securely on the backend server and are never exposed to client-side bundles.

---

## 14. Environment Variables

Create a `.env` file in the project root directory based on `.env.example`:

```env
# Google Gemini AI API Key (Required for server.ts)
GEMINI_API_KEY=your_google_gemini_api_key

# Hosting Application URL
APP_URL=http://localhost:3000

# Frontend Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDqINs155rW4fUARr8V8Et5t9e4vPXVcGg
VITE_FIREBASE_AUTH_DOMAIN=manthan-360-f3cb4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=manthan-360-f3cb4
VITE_FIREBASE_STORAGE_BUCKET=manthan-360-f3cb4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=902894744042
VITE_FIREBASE_APP_ID=1:902894744042:web:710dc2a5d090017bff0293

# Backend Firebase Admin Configuration
FIREBASE_PROJECT_ID=manthan-360
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"
```

> ⚠️ **IMPORTANT:** Never commit real credentials or `.env` files to source control.

---

## 15. Installation & Setup

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vaishnavigirase0817/Manthan_360.git
   cd Manthan-360-main
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create `.env` in the root directory and add your `GEMINI_API_KEY` and Firebase credentials as shown in [Section 14](#14-environment-variables).

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Access Application:**
   Open your browser and navigate to `http://localhost:3000`.

---

## 16. Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project named **Manthan360** (Project ID: `manthan-360`).
2. **Authentication:** Navigate to **Build > Authentication**, enable **Google** under Sign-in providers.
3. **Firestore Database:** Navigate to **Build > Firestore Database**, create a database, and apply the rules from `firestore.rules`.
4. **Web App Configuration:** Register a Web Application inside your Firebase project and copy the configuration values into your `.env` file (`VITE_FIREBASE_*`).

---

## 17. Gemini API Setup

1. Sign in to [Google AI Studio](https://aistudio.google.com/).
2. Create a new API Key.
3. Paste the generated key into your `.env` file under `GEMINI_API_KEY`.
4. The server automatically utilizes `gemini-3.5-flash` with fallback to `gemini-3.1-flash-lite` and `gemini-flash-latest`.

---

## 18. Running the Application

### Development Mode
Runs Express backend and Vite frontend concurrently under single command:
```bash
npm run dev
```
* **URL:** `http://localhost:3000`

### Production Build & Launch
Builds the Vite frontend static bundle into `dist/` and bundles `server.ts` into `dist/server.cjs` using `esbuild`:
```bash
npm run build
npm start
```

---

## 19. API Endpoints

| Method | Endpoint | Purpose | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning server status | None |
| `POST` | `/api/gemini/summary` | Generates short/detailed summaries & revision notes | `{ text: string, language?: string }` |
| `POST` | `/api/gemini/quiz` | Generates 10-question multiple-choice practice quiz | `{ text: string, language?: string }` |
| `POST` | `/api/gemini/flashcards` | Generates 10 active recall Q&A flashcards | `{ text: string, language?: string }` |
| `POST` | `/api/gemini/mindmap` | Generates hierarchical mind map concept tree | `{ text: string, language?: string }` |
| `POST` | `/api/gemini/flowchart` | Generates sequential process flowchart nodes | `{ text: string, language?: string }` |
| `POST` | `/api/gemini/tutor` | AI Tutor doubt resolution chat assistant | `{ messages: ChatMessage[], context: string, language?: string }` |
| `POST` | `/api/gemini/studyplan` | Generates daily schedule and weekly study plan | `{ text: string, language?: string }` |
| `POST` | `/api/gemini/diagnostics` | Computes understanding scores & weak concept analysis | `{ text: string, attempts: any[], language?: string }` |
| `POST` | `/api/gemini/slides` | Generates summary slides deck items | `{ text: string, language?: string }` |
| `POST` | `/api/gemini/presentation` | Generates complete slide presentation deck | `{ noteId, title, text, summary, diagnostics, language }` |
| `POST` | `/api/gemini/videoscript` | Generates educational video script scenes | `{ noteId, title, text, summary, language }` |
| `POST` | `/api/gemini/teacher` | Generates Virtual AI Teacher session package | `{ title, text, summary, diagnostics, quiz, flashcards, mindMap, language }` |

---

## 20. Learning Workflow Example

```text
Student Login (Google / Demo Access)
 ↓
Upload Study Material (Handwritten Note Image / PDF / Text)
 ↓
Client OCR & Text Extraction (Tesseract.js)
 ↓
Gemini AI Content Generation (server.ts)
 ↓
View Summary & Key Revision Points
 ↓
Practice 3D Memory Flashcards (Active Recall)
 ↓
Take 10-Question Interactive Quiz
 ↓
Review Diagnostics & Weak Concept Gaps
 ↓
Explore Visual Mind Map & Step-by-Step Flowchart
 ↓
Ask Doubts to 24/7 AI Tutor
 ↓
Follow Daily & Weekly Study Roadmap
 ↓
Export Presentation Deck to PowerPoint (.pptx)
```

---

## 21. User Experience

The Manthan360 student workspace is structured into dedicated, aesthetic dashboard sections:

* **My Uploaded Study Notes:** Central repository for uploading, viewing, and managing processed notes.
* **Summary:** View short overviews, detailed multi-paragraph summaries, key bullet points, and revision notes.
* **Quiz:** Take interactive multiple-choice tests with instant score updates and feedback.
* **Flashcards:** Flip 3D cards to test recall and track progress.
* **Mind Map:** Expand and inspect visual concept trees.
* **Flowchart:** View interactive process flowcharts built with `@xyflow/react`.
* **AI Tutor:** Chat with an AI assistant trained on your specific note content.
* **Study Plan:** Follow structured daily schedules and weekly milestone roadmaps.
* **Progress Analytics:** Track diagnostic scores, weak concept recommendations, and active study streaks.
* **Virtual AI Teacher:** View video scripts, speech scripts, and avatar sync directions.
* **Export Hub:** Download formatted PowerPoint presentation decks (`.pptx`), text summaries, and note cards.
* **Language Switcher:** Instantly switch application and AI outputs between languages via the header dropdown.

---

## 22. Multilingual Learning

Manthan360 features built-in internationalization powered by `LanguageContext.tsx` and `src/translations/index.ts`. When a student selects a preferred language from the top navigation bar, the preference is saved in `localStorage` (`manthan360_preferred_lang`) and transmitted with every backend API payload. Google Gemini AI then generates summaries, quizzes, flashcards, mind maps, and tutor responses directly in the selected language.

---

## 23. Feasibility & Viability

### Technical Feasibility
* Built on proven open-source web standards (React, Node.js, Express, TypeScript).
* Uses client-side OCR (Tesseract.js) to reduce server processing overhead.
* Integrates Google Gemini AI with fallback mechanisms to ensure high availability.

### Operational Feasibility
* Requires zero installation for end users—accessible directly through modern web browsers.
* Intuitive drag-and-drop interface minimizes technical learning curve.

### Economic Feasibility
* Leverages serverless Firebase authentication and Firestore cloud tiers.
* Optimizes Gemini API usage via efficient prompt structuring and client-side state caching.

---

## 24. Impact & Benefits

### For Students
* **Faster Learning:** Converts long documents into digestible summaries in seconds.
* **Higher Retention:** Active recall flashcards and quizzes flatten the memory forgetting curve.
* **Visual Understanding:** Mind maps and flowcharts simplify complex structural concepts.
* **Multilingual Access:** Enables students to learn difficult subjects in their native language.

### For Teachers & Educators
* **Automated Lesson Preparation:** Instantly generate practice quizzes, slide decks, and discussion prompts from lecture notes.
* **Curriculum Structuring:** Convert textbook topics into structured weekly study roadmaps.

### Educational Impact
* Promotes self-paced, personalized digital learning and bridges educational accessibility gaps.

---

## 25. Future Scope

Planned future enhancements for Manthan360:

* **AI Animated Teacher Avatars:** Direct rendering of synthetic video lectures using HeyGen and Synthesia API integrations.
* **Real-Time Voice AI Tutor:** Spoken audio conversations using ElevenLabs and WebRTC voice channels.
* **Native Mobile Applications:** Cross-platform iOS and Android apps built with React Native.
* **Collaborative Study Rooms:** Multi-user real-time shared study spaces and group quiz leaderboards.
* **Advanced Analytics Dashboard:** In-depth cognitive diagnostic tracking across entire academic semesters.
* **AR/VR Visualizations:** 3D interactive concept models for chemistry, physics, and medical anatomy.

---

## 26. Challenges & Solutions

| Challenge | Solution |
| :--- | :--- |
| **Processing Large Study Documents** | Text chunking and structured JSON response schemas in `server.ts`. |
| **Handwritten Note Recognition** | Client-side Tesseract.js OCR with high-contrast legibility validation. |
| **AI Rate Limits & Quotas (HTTP 429)** | Exponential backoff retries and automatic model rotation (`gemini-3.5-flash` → `gemini-3.1-flash-lite`). |
| **Complex Concept Retention** | Active recall 3D flashcards and 10-question diagnostic quizzes. |
| **Visual Learning Gaps** | Automated hierarchy mind maps and step-by-step `@xyflow/react` flowcharts. |
| **Language Accessibility Barriers** | Global language selector propagating target languages to AI prompts. |

---

## 27. Privacy & Security

* **API Key Protection:** Server-side environment variable storage prevents key leaks.
* **Authentication Security:** User authentication is managed via Google Firebase OAuth 2.0.
* **Data Isolation:** Firestore security rules ensure users can only read and write their own documents.
* **No Unsanitized Storage:** Extracted text and user session data are kept strictly within private user documents.

---

## 28. Limitations

* **AI Availability & Quotas:** Generation relies on Google Gemini API uptime and user project rate limits.
* **OCR Legibility:** Tesseract.js recognition accuracy depends on image clarity, lighting, and legibility of handwriting.
* **Educational Verification:** AI-generated answers and formulas should be reviewed against primary course textbooks.
* **PDF Complexity:** Multi-column PDFs with complex table layouts may require manual text copying for optimal results.

---

## 29. Troubleshooting

### Server Fails to Start (`npm run dev`)
Ensure dependencies are installed:
```bash
npm install
npm run dev
```

### Gemini API Error (Missing Key / 429 Quota Exceeded)
1. Verify `GEMINI_API_KEY` is correctly set in your `.env` file.
2. Check your API quota in Google AI Studio.
3. Restart the server after updating `.env`.

### OCR Text Extraction Fails
1. Ensure the uploaded image is a PNG or JPG file.
2. Ensure image resolution and handwriting legibility are high.
3. For dense PDFs, copy-paste text directly into the uploader input.

### Firebase Connection Errors
1. Verify Firebase configuration values (`VITE_FIREBASE_*`) in `.env`.
2. Ensure **Google Sign-in** is enabled in your Firebase Console.

---

## 30. Deployment

### Production Deployment
Manthan360 can be deployed to platforms like Cloud Run, Vercel, Render, or Railway:

1. **Build Production Bundle:**
   ```bash
   npm run build
   ```
2. **Start Production Server:**
   ```bash
   npm start
   ```

The Express server serves the compiled frontend assets from `dist/` and handles API requests on `PORT 3000`.

---

## 31. Demo

* **Live Demo:** [Add Deployment URL]
* **Demo Video:** [Add Video URL]
* **Presentation Deck:** [Add Presentation URL]

---

## 32. Screenshots

### Landing Page
*TODO: Add landing page screenshot* (`screenshots/landing-page.png`)

### Student Dashboard
*TODO: Add dashboard screenshot* (`screenshots/dashboard.png`)

### AI Summary & Revision Notes
*TODO: Add summary screenshot* (`screenshots/summary.png`)

### Interactive Quiz Room
*TODO: Add quiz room screenshot* (`screenshots/quiz.png`)

### Visual Mind Map
*TODO: Add mind map screenshot* (`screenshots/mindmap.png`)

---

## 33. Project Status

**Status:** Active Development

---

## 34. Contributors

Developed by **Vaishnavi Girase**

---

## 35. License

No license has currently been specified.
