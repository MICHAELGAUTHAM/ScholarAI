from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, auth, database, models
from app.ai import pdf_processor, ai_manager

router = APIRouter(prefix="/chat", tags=["AI Research Chat"])

@router.get("/{paper_id}", response_model=List[schemas.ChatHistory])
def get_paper_chat_history(
    paper_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify paper ownership
    paper = crud.get_paper(db=db, paper_id=paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access chat history for this paper")
        
    return crud.get_chat_history(db=db, user_id=current_user.id, paper_id=paper_id)


@router.post("/", response_model=schemas.ChatHistory, status_code=status.HTTP_201_CREATED)
def ask_question_endpoint(
    chat_request: schemas.ChatHistoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    paper = crud.get_paper(db=db, paper_id=chat_request.paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to chat about this paper")
        
    # Check if text content has been processed
    if not paper.text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paper text content is still being processed in the background. Please try again in a moment."
        )
        
    # Chunk text
    chunks = pdf_processor.chunk_text(paper.text_content)
    
    # Check if we have chunk embeddings. If they are not calculated, calculate them on the fly.
    # Note: normally we would store chunk embeddings in a vector DB or custom table,
    # but calculating embeddings for chunks of a single paper (~10-50 chunks) on the fly
    # using our sentence transformer is extremely fast (~0.2 seconds total on CPU) and
    # doesn't require complex DB storage! This is a robust and lightweight solution.
    chunk_embeddings = [ai_manager.get_text_embedding(c) for c in chunks]
    
    # Generate answer
    answer = ai_manager.answer_paper_question(
        query=chat_request.query,
        paper_text=paper.text_content,
        chunks=chunks,
        chunk_embeddings=chunk_embeddings
    )
    
    # Store in history
    chat_entry = crud.create_chat_entry(
        db=db, 
        chat=chat_request, 
        response=answer, 
        user_id=current_user.id
    )
    
    return chat_entry
