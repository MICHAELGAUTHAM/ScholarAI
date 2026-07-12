from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, auth, database, models

router = APIRouter(prefix="/collections", tags=["Collections"])

@router.get("/", response_model=List[schemas.Collection])
def list_collections(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.get_collections(db=db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("/", response_model=schemas.Collection, status_code=status.HTTP_201_CREATED)
def create_collection(
    collection: schemas.CollectionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_collection(db=db, collection=collection, user_id=current_user.id)


@router.put("/{collection_id}", response_model=schemas.Collection)
def edit_collection(
    collection_id: int,
    collection_update: schemas.CollectionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    collection = crud.get_collection(db=db, collection_id=collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this collection")
        
    return crud.update_collection(db=db, collection_id=collection_id, collection_update=collection_update)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_collection(
    collection_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    collection = crud.get_collection(db=db, collection_id=collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this collection")
        
    crud.delete_collection(db=db, collection_id=collection_id)
    return None


@router.post("/{collection_id}/papers/{paper_id}", response_model=schemas.Collection)
def add_paper_to_collection_endpoint(
    collection_id: int,
    paper_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    collection = crud.get_collection(db=db, collection_id=collection_id)
    paper = crud.get_paper(db=db, paper_id=paper_id)
    
    if not collection or not paper:
        raise HTTPException(status_code=404, detail="Collection or Paper not found")
        
    if collection.user_id != current_user.id or paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this relationship")
        
    updated = crud.add_paper_to_collection(db=db, paper_id=paper_id, collection_id=collection_id)
    return updated


@router.delete("/{collection_id}/papers/{paper_id}", response_model=schemas.Collection)
def remove_paper_from_collection_endpoint(
    collection_id: int,
    paper_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    collection = crud.get_collection(db=db, collection_id=collection_id)
    paper = crud.get_paper(db=db, paper_id=paper_id)
    
    if not collection or not paper:
        raise HTTPException(status_code=404, detail="Collection or Paper not found")
        
    if collection.user_id != current_user.id or paper.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this relationship")
        
    updated = crud.remove_paper_from_collection(db=db, paper_id=paper_id, collection_id=collection_id)
    return updated
