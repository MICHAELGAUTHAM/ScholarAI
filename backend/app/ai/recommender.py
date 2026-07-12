import numpy as np
from typing import List, Dict, Any

def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Computes cosine similarity between two numeric lists.
    """
    a = np.array(vec1)
    b = np.array(vec2)
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0 or norm_b == 0:
        return 0.0
        
    similarity = np.dot(a, b) / (norm_a * norm_b)
    return float(similarity)

def get_similar_papers(target_embedding: List[float], candidate_papers: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, Any]]:
    """
    Computes similarities between a target paper and a list of candidates.
    Returns the top matching candidate papers with similarity scores.
    """
    if not target_embedding:
        return []
        
    results = []
    for paper in candidate_papers:
        cand_embedding = paper.get("embedding")
        if not cand_embedding:
            continue
            
        score = calculate_cosine_similarity(target_embedding, cand_embedding)
        # Avoid recommending the paper itself (score = 1.0 is checked in the controller/router by matching IDs)
        results.append({
            "id": paper["id"],
            "title": paper["title"],
            "authors": paper.get("authors"),
            "year": paper.get("year"),
            "similarity_score": round(score, 4)
        })
        
    # Sort by similarity score descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results[:limit]
