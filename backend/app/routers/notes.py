from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, schemas, auth, database, models

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.get("/", response_model=List[schemas.Note])
def list_notes(
    paper_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_notes(db=db, user_id=current_user.id, paper_id=paper_id, search=search, tag=tag)


@router.post("/", response_model=schemas.Note, status_code=status.HTTP_201_CREATED)
def create_note(
    note: schemas.NoteCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify paper belongs to user
    paper = crud.get_paper(db=db, paper_id=note.paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add notes to this paper")
        
    return crud.create_note(db=db, note=note, user_id=current_user.id)


@router.put("/{note_id}", response_model=schemas.Note)
def edit_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    note = crud.get_note(db=db, note_id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if note.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note")
        
    return crud.update_note(db=db, note_id=note_id, note_update=note_update)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_note(
    note_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    note = crud.get_note(db=db, note_id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if note.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
        
    crud.delete_note(db=db, note_id=note_id)
    return None
