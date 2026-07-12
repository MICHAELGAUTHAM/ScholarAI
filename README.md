# ScholarAI - AI-Powered Academic Research Assistant

ScholarAI is a modern, full-stack, AI-powered research helper built to empower students and researchers. It automates PDF text extraction, summary generation, keyword tagging, APA/MLA/IEEE academic citation building, note annotations, semantic similarity paper recommendations, and interactive RAG-based question answering.

---

## Key Features

1. **Secure JWT Authentication**: Sign up and login with encrypted passwords and persistent session tokens.
2. **Metadata & Text Extraction**: Auto-extract title, authors, year, and journal from PDF files.
3. **Hybrid AI Engine**: Integrates with Google's **Gemini API** for high-quality QA and summaries, with seamless local **Hugging Face CPU fallbacks** (DistilBART and frequency analysis) if offline or run without API keys.
4. **Vector Recommendations**: Computes cosine similarities over document embeddings (`sentence-transformers/all-MiniLM-L6-v2`) in Python to suggest related papers from your library.
5. **RAG-based Chat Q&A**: Chat with a specific paper to extract methodology, validation bounds, or results without manual reading.
6. **Analytics Dashboard**: View charts for reading progress, focus topics distribution (Recharts Pie Chart), and document upload frequency (Recharts Area Chart).
7. **Organized Collections**: Categorize files into folder structures.
8. **Academic Citations**: Generate APA, MLA, and IEEE formats with single-click copy-to-clipboard actions.

---

## Technology Stack

* **Frontend**: React (Vite), Tailwind CSS, Recharts, Lucide Icons
* **Backend**: FastAPI, SQLAlchemy ORM, SQLite (dev default) / PostgreSQL (production)
* **Document Processing**: pdfplumber
* **AI Frameworks**: Hugging Face Transformers, Sentence-Transformers, NumPy, Google Generative AI

---

## Local Setup (Fast Start)

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **Python (v3.10+)** installed on your machine.

### 2. Configure Environment
Copy the env template and set your API keys (optional):
```bash
cp .env.example .env
```

### 3. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will run on [http://localhost:8000](http://localhost:8000). Interactive Swagger documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Frontend Setup
1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The site will load on [http://localhost:5173](http://localhost:5173).

---

## Docker Compose Deployment

To spin up the entire multi-container service (PostgreSQL database, FastAPI API server, and Nginx-served React app):

1. Set your `GEMINI_API_KEY` in your shell or root `.env` file.
2. Launch the orchestration:
   ```bash
   docker-compose up --build
   ```
3. Open your browser and navigate to [http://localhost](http://localhost) (React static server on port 80).
