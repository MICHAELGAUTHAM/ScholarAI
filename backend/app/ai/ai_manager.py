import os
import re
import datetime
import numpy as np
from typing import List, Dict, Any, Optional

from app.config import settings

# Lazy imports for machine learning to speed up server boot
_sentence_transformer_model = None
_local_summarization_pipeline = None

def get_embedding_model():
    """Lazily load the SentenceTransformer embedding model."""
    global _sentence_transformer_model
    if _sentence_transformer_model is not None:
        return _sentence_transformer_model
    
    try:
        from sentence_transformers import SentenceTransformer
        print("Loading local embedding model (sentence-transformers/all-MiniLM-L6-v2)...")
        _sentence_transformer_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("Embedding model loaded successfully.")
    except Exception as e:
        print(f"Failed to load sentence-transformers: {e}. Falling back to mock embeddings.")
        _sentence_transformer_model = "fallback"
    return _sentence_transformer_model

def get_summarizer():
    """Lazily load the Hugging Face local summarization pipeline."""
    global _local_summarization_pipeline
    if _local_summarization_pipeline is not None:
        return _local_summarization_pipeline
    
    try:
        from transformers import pipeline
        print("Loading local summarizer model (sshleifer/distilbart-cnn-6-6)...")
        _local_summarization_pipeline = pipeline(
            "summarization", 
            model="sshleifer/distilbart-cnn-6-6", 
            device=-1 # CPU
        )
        print("Local summarizer loaded successfully.")
    except Exception as e:
        print(f"Failed to load Hugging Face summarizer: {e}. Falling back to extractive summary.")
        _local_summarization_pipeline = "fallback"
    return _local_summarization_pipeline


# =====================================================================
# AI CITATION GENERATOR
# =====================================================================
def generate_citations(title: str, authors: str, year: int, journal: str) -> Dict[str, str]:
    """
    Generates standard academic citations (APA, MLA, IEEE) dynamically.
    """
    # APA: Author, A. A. (Year). Title. Journal.
    # MLA: Author, First. "Title." Journal, Year.
    # IEEE: A. Author, "Title," Journal, Year.
    
    clean_title = title.strip()
    if clean_title.endswith('.'):
        clean_title = clean_title[:-1]
        
    clean_authors = authors.strip() if authors else "Unknown"
    clean_journal = journal.strip() if journal else "Unknown Journal"
    clean_year = year if year else datetime.datetime.now().year
    
    # Format authors for APA (e.g. Smith, J., Doe, J.)
    # Basic parsing for authors list
    author_list = [a.strip() for a in clean_authors.split(",") if a.strip()]
    
    # Heuristic for APA authors
    apa_authors = ""
    if len(author_list) == 1:
        parts = author_list[0].split()
        if len(parts) > 1:
            apa_authors = f"{parts[-1]}, {parts[0][0]}."
        else:
            apa_authors = author_list[0]
    elif len(author_list) > 1:
        formatted = []
        for auth in author_list:
            parts = auth.split()
            if len(parts) > 1:
                formatted.append(f"{parts[-1]}, {parts[0][0]}.")
            else:
                formatted.append(auth)
        if len(formatted) > 2:
            apa_authors = ", ".join(formatted[:-1]) + ", & " + formatted[-1]
        else:
            apa_authors = " & ".join(formatted)
    else:
        apa_authors = clean_authors
        
    # Heuristic for IEEE authors (e.g. J. Smith and J. Doe)
    ieee_authors = ""
    if len(author_list) == 1:
        parts = author_list[0].split()
        if len(parts) > 1:
            ieee_authors = f"{parts[0][0]}. {parts[-1]}"
        else:
            ieee_authors = author_list[0]
    elif len(author_list) > 1:
        formatted = []
        for auth in author_list:
            parts = auth.split()
            if len(parts) > 1:
                formatted.append(f"{parts[0][0]}. {parts[-1]}")
            else:
                formatted.append(auth)
        if len(formatted) > 2:
            ieee_authors = ", ".join(formatted[:-1]) + ", and " + formatted[-1]
        else:
            ieee_authors = " and ".join(formatted)
    else:
        ieee_authors = clean_authors

    apa = f"{apa_authors} ({clean_year}). {clean_title}. {clean_journal}."
    mla = f"{clean_authors}. \"{clean_title}.\" {clean_journal}, {clean_year}."
    ieee = f"{ieee_authors}, \"{clean_title},\" {clean_journal}, {clean_year}."
    
    return {
        "apa": apa,
        "mla": mla,
        "ieee": ieee
    }


# =====================================================================
# AI SUMMARIZATION & KEYWORD EXTRACTION
# =====================================================================
def get_extractive_summary(text: str, num_sentences: int = 5) -> str:
    """
    Lightweight, resource-efficient fallback summary using sentence TF-IDF ranking.
    """
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if len(sentences) <= num_sentences:
        return " ".join(sentences)
        
    # Create simple word frequency table
    words = re.findall(r'\b\w{4,}\b', text.lower())
    freq = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
        
    # Score sentences based on word frequency
    sentence_scores = {}
    for i, s in enumerate(sentences):
        score = 0
        s_words = re.findall(r'\b\w{4,}\b', s.lower())
        for sw in s_words:
            if sw in freq:
                score += freq[sw]
        # Normalize by sentence length
        sentence_scores[i] = score / (len(s_words) + 1)
        
    # Sort and pick top sentences
    top_indices = sorted(sentence_scores, key=sentence_scores.get, reverse=True)[:num_sentences]
    top_indices.sort() # Keep chronological order
    
    return " ".join([sentences[idx] for idx in top_indices])

def extract_keywords_nlp(text: str, limit: int = 6) -> List[str]:
    """
    Extracts key concepts using word frequency analysis and part-of-speech heuristics.
    """
    stop_words = {
        "this", "that", "with", "from", "they", "them", "these", "their", "there", "about",
        "would", "could", "should", "using", "paper", "study", "research", "results",
        "method", "analysis", "system", "data", "figure", "table", "author", "authors",
        "which", "where", "when", "who", "whom", "whose", "here", "there", "their", "then"
    }
    # Find words of length 4+ that aren't stop words
    words = re.findall(r'\b[a-zA-Z]{4,15}\b', text.lower())
    filtered_words = [w for w in words if w not in stop_words]
    
    freq = {}
    for w in filtered_words:
        freq[w] = freq.get(w, 0) + 1
        
    # Sort by frequency
    sorted_keywords = sorted(freq.keys(), key=freq.get, reverse=True)
    return [k.capitalize() for k in sorted_keywords[:limit]]

def generate_summary_and_keywords(text: str, title: str = "") -> Dict[str, Any]:
    """
    Generates paper summary and keywords. Uses Gemini API if configured, otherwise falls back.
    """
    # Limit text length to avoid token limits
    sample_text = text[:8000] if len(text) > 8000 else text
    
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Use gemini-1.5-flash for speed and reliability
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            prompt = (
                f"You are an expert academic research assistant.\n"
                f"Analyze the following research paper text (Title: {title}).\n"
                f"Provide a concise summary of the paper (about 3-4 paragraphs) covering the background, methodology, results, and significance.\n"
                f"Also, list 5-7 keywords/concepts separated by commas.\n\n"
                f"Format your response EXACTLY as:\n"
                f"SUMMARY:\n[Your summary here]\n\n"
                f"KEYWORDS:\n[Keyword1, Keyword2, ...]\n\n"
                f"Paper Text snippet:\n{sample_text}"
            )
            
            response = model.generate_content(prompt)
            res_text = response.text
            
            # Parse response
            summary_part = ""
            keywords_part = []
            
            summary_match = re.search(r"SUMMARY:\s*(.*?)(?=\n\s*KEYWORDS:|$)", res_text, re.DOTALL | re.IGNORECASE)
            keywords_match = re.search(r"KEYWORDS:\s*(.*?)$", res_text, re.DOTALL | re.IGNORECASE)
            
            if summary_match:
                summary_part = summary_match.group(1).strip()
            if keywords_match:
                kw_str = keywords_match.group(1).strip()
                keywords_part = [k.strip().capitalize() for k in kw_str.split(",") if k.strip()]
                
            if summary_part and keywords_part:
                return {
                    "summary": summary_part,
                    "keywords": keywords_part
                }
        except Exception as e:
            print(f"Gemini generation failed: {e}. Falling back to local/NLP pipelines.")

    # FALLBACK: Local Hugging Face or Extractive NLP
    summary = ""
    keywords = extract_keywords_nlp(text)
    
    # Try Hugging Face summarizer
    summarizer = get_summarizer()
    if summarizer != "fallback" and len(sample_text) > 200:
        try:
            # Chunk the text to avoid token limits in distilbart
            chunk_for_sum = sample_text[:1024]
            res = summarizer(chunk_for_sum, max_length=150, min_length=45, do_sample=False)
            summary = res[0]['summary_text']
        except Exception as err:
            print(f"HF summarizer failed: {err}. Falling back to extractive summarizer.")
            summary = get_extractive_summary(text)
    else:
        summary = get_extractive_summary(text)
        
    return {
        "summary": summary,
        "keywords": keywords
    }


# =====================================================================
# AI EMBEDDINGS (Local only - all-MiniLM-L6-v2)
# =====================================================================
def get_text_embedding(text: str) -> List[float]:
    """
    Computes semantic vector embedding for a block of text using local SentenceTransformer.
    Returns a list of floats (384 dimensions).
    """
    model = get_embedding_model()
    if model == "fallback":
        # Check if Gemini API key is configured to compute proper embeddings in production
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                # Compute embedding with Gemini, limiting output dimensions to 384 to match local model
                response = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text,
                    task_type="retrieval_document",
                    output_dimensionality=384
                )
                embedding = response.get("embedding", [])
                if embedding:
                    return embedding
            except Exception as e:
                print(f"Gemini API embedding failed: {e}. Falling back to stable hash embeddings.")
                
        # Generate stable mock embedding if model failed to load and Gemini API is unavailable/failed
        # Uses hash values to generate deterministic floats
        import hashlib
        h = hashlib.sha256(text.encode('utf-8')).digest()
        arr = np.frombuffer(h, dtype=np.uint8).astype(float)
        # Pad to 384 dimensions
        arr = np.resize(arr, 384)
        # Normalize
        arr = arr / (np.linalg.norm(arr) + 1e-9)
        return arr.tolist()
        
    try:
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        print(f"Embedding error: {e}")
        return [0.0] * 384


# =====================================================================
# AI RAG QUESTION ANSWERING
# =====================================================================
def answer_paper_question(query: str, paper_text: str, chunks: List[str], chunk_embeddings: List[List[float]]) -> str:
    """
    Answers a question based on paper chunks using semantic search context retrieval.
    If Gemini API key is available, uses RAG. Otherwise synthesizes context.
    """
    if not chunks:
        return "No text content available in the document to answer the question."
        
    # Get query embedding
    query_emb = np.array(get_text_embedding(query))
    
    # Calculate similarities
    similarities = []
    for i, chunk_emb in enumerate(chunk_embeddings):
        emb = np.array(chunk_emb)
        # Cosine similarity
        denom = (np.linalg.norm(query_emb) * np.linalg.norm(emb))
        sim = np.dot(query_emb, emb) / denom if denom > 0 else 0
        similarities.append((sim, chunks[i]))
        
    # Sort and take top 3 chunks
    similarities.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [item[1] for item in similarities[:3]]
    context = "\n\n---\n\n".join(top_chunks)
    
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            prompt = (
                f"You are a helpful academic research assistant.\n"
                f"Answer the user's question about the research paper using the provided text extracts from the paper.\n"
                f"If the answer cannot be found in the extracts, summarize what the paper discusses related to the topic or state that the extracts do not contain the answer explicitly, but do not hallucinate.\n\n"
                f"Extracts from the paper:\n{context}\n\n"
                f"User Question: {query}\n\n"
                f"Detailed Answer:"
            )
            
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Gemini QA failed: {e}. Falling back to local extraction.")
            
    # FALLBACK: Local response synthesis
    # Find the single most similar chunk and present it
    best_match_text = top_chunks[0] if top_chunks else "No matching content."
    answer = (
        f"**[Offline Mode Synthesis]** Based on a semantic search of the document, the most relevant section is:\n\n"
        f"> \"{best_match_text[:600]}...\"\n\n"
        f"You can configure a `GEMINI_API_KEY` in the environment variables to activate full LLM-based narrative answers."
    )
    return answer
