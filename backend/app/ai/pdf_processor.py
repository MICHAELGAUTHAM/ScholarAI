import os
import re
import pdfplumber
from typing import Dict, Any, List

def extract_pdf_content(file_path: str) -> Dict[str, Any]:
    """
    Extracts text content page-by-page from a PDF file.
    Returns a dictionary with full text, page count, and metadata.
    """
    full_text = ""
    pages_text = []
    metadata = {}
    
    try:
        with pdfplumber.open(file_path) as pdf:
            # Extract PDF metadata dictionary
            metadata = pdf.metadata or {}
            
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    full_text += f"\n--- PAGE {i+1} ---\n" + text
                    pages_text.append({
                        "page_number": i + 1,
                        "text": text
                    })
    except Exception as e:
        print(f"Error reading PDF with pdfplumber: {e}")
        # Secondary fallback if pdfplumber fails (e.g. mock extract or basic text reader)
        full_text = "Failed to extract PDF text due to parsing error."
        pages_text = [{"page_number": 1, "text": full_text}]
        
    return {
        "full_text": full_text.strip(),
        "pages": pages_text,
        "page_count": len(pages_text),
        "raw_metadata": metadata
    }

def heuristic_metadata_extraction(pdf_text: str, raw_metadata: dict) -> Dict[str, Any]:
    """
    Analyzes raw metadata and the first few pages of text to extract
    Title, Authors, Year, and Journal using regex heuristics.
    """
    title = raw_metadata.get("Title") or ""
    authors = raw_metadata.get("Author") or ""
    year = None
    journal = None
    
    # Clean title/authors if they are raw metadata placeholders
    if not title or len(title) < 5 or "Microsoft Word" in title or ".pdf" in title:
        # Heuristic: First 3 non-empty lines of text might contain title
        lines = [line.strip() for line in pdf_text.split("\n") if line.strip() and "PAGE" not in line][:5]
        if lines:
            title = lines[0]
            if len(title) < 15 and len(lines) > 1:
                title += " " + lines[1]
                
    if not authors or len(authors) < 3:
        # Look for typical email patterns or academic department text on the first page
        lines = [line.strip() for line in pdf_text.split("\n") if line.strip() and "PAGE" not in line][:15]
        for line in lines:
            if "department" in line.lower() or "university" in line.lower() or "email:" in line.lower():
                continue
            # Try to match names (Capital words separated by spaces and commas)
            name_match = re.search(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*$', line)
            if name_match:
                authors = line
                break
                
    # Search for year (4-digit number between 1950 and 2030)
    # Check raw metadata date first
    creation_date = raw_metadata.get("CreationDate") or ""
    if creation_date:
        # CreationDate format: D:YYYYMMDD...
        year_match = re.search(r'D:(\d{4})', creation_date)
        if year_match:
            year = int(year_match.group(1))
            
    if not year:
        # Scan first page for years
        year_matches = re.findall(r'\b(19\d{2}|20[0-2]\d)\b', pdf_text[:3000])
        if year_matches:
            # Take the most frequent year or the latest one that is not current year + 2
            year = int(year_matches[0])

    # Search for Journal names
    journal_keywords = ["journal of", "transactions on", "proceedings of", "review of", "ieee", "acm", "arxiv"]
    lines = [line.strip() for line in pdf_text.split("\n") if line.strip() and "PAGE" not in line][:20]
    for line in lines:
        for keyword in journal_keywords:
            if keyword in line.lower() and len(line) < 100:
                journal = line
                break
        if journal:
            break
            
    # Final default cleanups
    if not title or len(title) < 3:
        title = "Untitled Research Paper"
    if not authors:
        authors = "Unknown Author(s)"
    if not year:
        year = datetime.datetime.now().year
        
    return {
        "title": title[:255],
        "authors": authors[:255],
        "year": year,
        "journal": journal[:255] if journal else "Unknown Journal"
    }

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """
    Chunks large documents into overlapping text fragments for semantic vector similarity search.
    """
    # Simple character-based overlapping chunks
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        # Try to align chunk boundary to a space or newline if possible
        if end < text_len:
            boundary = text.rfind(' ', start, end)
            if boundary != -1 and boundary > start + (chunk_size // 2):
                end = boundary
        chunks.append(text[start:end].strip())
        start = end - chunk_overlap
        if start >= text_len - chunk_overlap:
            break
            
    return [c for c in chunks if len(c) > 50]
