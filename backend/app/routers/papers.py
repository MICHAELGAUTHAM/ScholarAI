import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, schemas, auth, database, models
from app.config import settings
from app.ai import pdf_processor, ai_manager, recommender

router = APIRouter(prefix="/papers", tags=["Papers"])

def process_paper_ai_features(db_session_factory, paper_id: int, file_path: str):
    """
    Background worker to extract text, generate summary/keywords, citation format, and embeddings.
    Uses its own DB session to avoid session sharing conflicts.
    """
    db = db_session_factory()
    try:
        db_paper = crud.get_paper(db, paper_id)
        if not db_paper:
            return
            
        # 1. Extract text content
        pdf_data = pdf_processor.extract_pdf_content(file_path)
        full_text = pdf_data["full_text"]
        
        # If abstract/title is missing or default, try to improve it
        metadata = pdf_processor.heuristic_metadata_extraction(full_text, pdf_data["raw_metadata"])
        if db_paper.title == "Unknown Paper" or len(db_paper.title) < 5:
            db_paper.title = metadata["title"]
        if not db_paper.authors or db_paper.authors == "Unknown Author(s)":
            db_paper.authors = metadata["authors"]
        if not db_paper.year or db_paper.year == 2026:
            db_paper.year = metadata["year"]
        if not db_paper.journal or db_paper.journal == "Unknown Journal":
            db_paper.journal = metadata["journal"]
            
        # Store abstract heuristic if empty
        if not db_paper.abstract or len(db_paper.abstract) < 10:
            db_paper.abstract = full_text[:800] + "..." if len(full_text) > 800 else full_text
            
        db.commit()
        
        # 2. Generate Summary and Keywords
        ai_data = ai_manager.generate_summary_and_keywords(full_text, db_paper.title)
        summary = ai_data["summary"]
        keywords = ai_data["keywords"]
        
        # 3. Generate Embeddings (for paper recommendation & Q&A)
        # We embed the first 6000 chars as the paper "semantic fingerprint"
        fingerprint = f"{db_paper.title} {db_paper.abstract} {summary}"
        embedding = ai_manager.get_text_embedding(fingerprint)
        
        # Save AI data
        crud.save_paper_ai_data(
            db=db, 
            paper_id=paper_id, 
            summary=summary, 
            text_content=full_text, 
            embedding=embedding, 
            keywords=keywords
        )
        
        # 4. Generate Citations
        citation_info = ai_manager.generate_citations(
            title=db_paper.title,
            authors=db_paper.authors,
            year=db_paper.year,
            journal=db_paper.journal
        )
        citation_schemas = schemas.CitationBase(
            apa=citation_info["apa"],
            mla=citation_info["mla"],
            ieee=citation_info["ieee"]
        )
        crud.create_citation(db=db, citation_data=citation_schemas, paper_id=paper_id)
        print(f"Background AI processing complete for Paper ID: {paper_id}")
    except Exception as e:
        print(f"Error processing AI features for paper {paper_id}: {e}")
    finally:
        db.close()


@router.post("/", response_model=schemas.Paper, status_code=status.HTTP_201_CREATED)
def upload_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Validate file format
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF research papers are supported"
        )
        
    # Save the file
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file upload: {e}"
        )
        
    file_size = os.path.getsize(file_path)
    
    # Create database entry with temporary placeholder metadata
    # We will refine these in the background worker
    paper_create = schemas.PaperCreate(
        title=file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " "),
        authors="Analyzing...",
        year=2026,
        journal="Analyzing...",
        abstract="Running AI text parsing and semantic categorization in the background..."
    )
    
    db_paper = crud.create_paper(
        db=db, 
        paper=paper_create, 
        file_path=file_path, 
        file_size=file_size, 
        user_id=current_user.id
    )
    
    # Queue background AI tasks or run synchronously in serverless (e.g. Vercel) environments
    # Vercel serverless containers freeze background threads immediately after returning the response
    if os.getenv("VERCEL") == "1" or os.getenv("RUN_AI_SYNCHRONOUSLY") == "true":
        print("Running AI processing synchronously for serverless compatibility...")
        process_paper_ai_features(database.SessionLocal, db_paper.id, file_path)
        db.refresh(db_paper)
    else:
        background_tasks.add_task(
            process_paper_ai_features, 
            database.SessionLocal, 
            db_paper.id, 
            file_path
        )
        
    return db_paper


@router.get("/", response_model=List[schemas.Paper])
def list_papers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    collection_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_papers(
        db=db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit, 
        search=search,
        collection_id=collection_id
    )


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    stats = crud.get_dashboard_stats(db=db, user_id=current_user.id)
    return stats


@router.get("/{paper_id}", response_model=schemas.PaperDetailResponse)
def get_paper_details(
    paper_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    paper = crud.get_paper(db=db, paper_id=paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this paper")
        
    citation = crud.get_citation(db=db, paper_id=paper_id)
    notes = crud.get_notes(db=db, user_id=current_user.id, paper_id=paper_id)
    
    response = schemas.PaperDetailResponse.from_orm(paper)
    response.citation = citation
    response.notes = notes
    return response


@router.put("/{paper_id}", response_model=schemas.Paper)
def edit_paper(
    paper_id: int,
    paper_update: schemas.PaperUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    paper = crud.get_paper(db=db, paper_id=paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this paper")
        
    updated = crud.update_paper(db=db, paper_id=paper_id, paper_update=paper_update)
    
    # Recalculate citations in case title/authors/year/journal were updated
    citation_info = ai_manager.generate_citations(
        title=updated.title,
        authors=updated.authors or "",
        year=updated.year or 2026,
        journal=updated.journal or ""
    )
    citation_schemas = schemas.CitationBase(
        apa=citation_info["apa"],
        mla=citation_info["mla"],
        ieee=citation_info["ieee"]
    )
    crud.create_citation(db=db, citation_data=citation_schemas, paper_id=paper_id)
    
    return updated


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_paper(
    paper_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    paper = crud.get_paper(db=db, paper_id=paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this paper")
        
    # Delete local PDF file
    if paper.file_path and os.path.exists(paper.file_path):
        try:
            os.remove(paper.file_path)
        except Exception as e:
            print(f"Error removing PDF file {paper.file_path}: {e}")
            
    crud.delete_paper(db=db, paper_id=paper_id)
    return None


@router.get("/{paper_id}/recommend", response_model=List[schemas.PaperRecommendation])
def recommend_similar_papers(
    paper_id: int,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    target_paper = crud.get_paper(db=db, paper_id=paper_id)
    if not target_paper:
        raise HTTPException(status_code=404, detail="Target paper not found")
        
    if target_paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not target_paper.embedding:
        # If no embedding calculated yet, return empty list
        return []
        
    # Fetch all other papers belonging to the same user
    all_user_papers = db.query(models.Paper)\
                        .filter(models.Paper.user_id == current_user.id, models.Paper.id != paper_id)\
                        .all()
                        
    candidates = []
    for p in all_user_papers:
        if p.embedding:
            candidates.append({
                "id": p.id,
                "title": p.title,
                "authors": p.authors,
                "year": p.year,
                "embedding": p.embedding
            })
            
    recommendations = recommender.get_similar_papers(
        target_embedding=target_paper.embedding,
        candidate_papers=candidates,
        limit=limit
    )
    
    return [schemas.PaperRecommendation(**r) for r in recommendations]
