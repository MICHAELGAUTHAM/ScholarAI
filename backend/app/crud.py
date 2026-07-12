from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from typing import List, Optional, Dict, Any
import datetime

from app import models, schemas
from app.auth import get_password_hash

# =====================================================================
# USER CRUD
# =====================================================================
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pwd = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# =====================================================================
# KEYWORD CRUD
# =====================================================================
def get_keyword_by_name(db: Session, name: str):
    return db.query(models.Keyword).filter(models.Keyword.name == name).first()

def get_or_create_keyword(db: Session, name: str):
    clean_name = name.strip().capitalize()
    db_kw = get_keyword_by_name(db, clean_name)
    if not db_kw:
        db_kw = models.Keyword(name=clean_name)
        db.add(db_kw)
        db.commit()
        db.refresh(db_kw)
    return db_kw

# =====================================================================
# PAPER CRUD
# =====================================================================
def get_paper(db: Session, paper_id: int):
    return db.query(models.Paper).filter(models.Paper.id == paper_id).first()

def get_papers(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    collection_id: Optional[int] = None
) -> List[models.Paper]:
    query = db.query(models.Paper).filter(models.Paper.user_id == user_id)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Paper.title.ilike(search_filter),
                models.Paper.authors.ilike(search_filter),
                models.Paper.journal.ilike(search_filter),
                models.Paper.abstract.ilike(search_filter)
            )
        )
        
    if collection_id:
        query = query.join(models.Paper.collections).filter(models.Collection.id == collection_id)
        
    return query.order_by(desc(models.Paper.created_at)).offset(skip).limit(limit).all()

def create_paper(db: Session, paper: schemas.PaperCreate, file_path: str, file_size: int, user_id: int):
    db_paper = models.Paper(
        title=paper.title,
        authors=paper.authors,
        year=paper.year,
        journal=paper.journal,
        abstract=paper.abstract,
        file_path=file_path,
        file_size=file_size,
        user_id=user_id
    )
    db.add(db_paper)
    db.commit()
    db.refresh(db_paper)
    return db_paper

def update_paper(db: Session, paper_id: int, paper_update: schemas.PaperUpdate):
    db_paper = get_paper(db, paper_id)
    if not db_paper:
        return None
        
    update_data = paper_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_paper, key, value)
        
    db.commit()
    db.refresh(db_paper)
    return db_paper

def save_paper_ai_data(db: Session, paper_id: int, summary: str, text_content: str, embedding: List[float], keywords: List[str]):
    db_paper = get_paper(db, paper_id)
    if not db_paper:
        return None
        
    db_paper.summary = summary
    db_paper.text_content = text_content
    db_paper.embedding = embedding
    
    # Associate keywords
    db_paper.keywords.clear()
    for kw_name in keywords:
        kw = get_or_create_keyword(db, kw_name)
        db_paper.keywords.append(kw)
        
    db.commit()
    db.refresh(db_paper)
    return db_paper

def delete_paper(db: Session, paper_id: int):
    db_paper = get_paper(db, paper_id)
    if db_paper:
        db.delete(db_paper)
        db.commit()
        return True
    return False

# =====================================================================
# CITATION CRUD
# =====================================================================
def get_citation(db: Session, paper_id: int):
    return db.query(models.Citation).filter(models.Citation.paper_id == paper_id).first()

def create_citation(db: Session, citation_data: schemas.CitationBase, paper_id: int):
    # Remove existing citation if any
    db.query(models.Citation).filter(models.Citation.paper_id == paper_id).delete()
    
    db_citation = models.Citation(
        apa=citation_data.apa,
        mla=citation_data.mla,
        ieee=citation_data.ieee,
        paper_id=paper_id
    )
    db.add(db_citation)
    db.commit()
    db.refresh(db_citation)
    return db_citation

# =====================================================================
# COLLECTION CRUD
# =====================================================================
def get_collection(db: Session, collection_id: int):
    return db.query(models.Collection).filter(models.Collection.id == collection_id).first()

def get_collections(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Collection).filter(models.Collection.user_id == user_id).offset(skip).limit(limit).all()

def create_collection(db: Session, collection: schemas.CollectionCreate, user_id: int):
    db_collection = models.Collection(
        name=collection.name,
        description=collection.description,
        user_id=user_id
    )
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    return db_collection

def update_collection(db: Session, collection_id: int, collection_update: schemas.CollectionUpdate):
    db_collection = get_collection(db, collection_id)
    if not db_collection:
        return None
        
    update_data = collection_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_collection, key, value)
        
    db.commit()
    db.refresh(db_collection)
    return db_collection

def delete_collection(db: Session, collection_id: int):
    db_collection = get_collection(db, collection_id)
    if db_collection:
        db.delete(db_collection)
        db.commit()
        return True
    return False

def add_paper_to_collection(db: Session, paper_id: int, collection_id: int):
    db_paper = get_paper(db, paper_id)
    db_collection = get_collection(db, collection_id)
    if db_paper and db_collection:
        if db_paper not in db_collection.papers:
            db_collection.papers.append(db_paper)
            db.commit()
        return db_collection
    return None

def remove_paper_from_collection(db: Session, paper_id: int, collection_id: int):
    db_paper = get_paper(db, paper_id)
    db_collection = get_collection(db, collection_id)
    if db_paper and db_collection:
        if db_paper in db_collection.papers:
            db_collection.papers.remove(db_paper)
            db.commit()
        return db_collection
    return None

# =====================================================================
# NOTE CRUD
# =====================================================================
def get_note(db: Session, note_id: int):
    return db.query(models.Note).filter(models.Note.id == note_id).first()

def get_notes(
    db: Session, 
    user_id: int, 
    paper_id: Optional[int] = None, 
    search: Optional[str] = None,
    tag: Optional[str] = None
):
    query = db.query(models.Note).filter(models.Note.user_id == user_id)
    
    if paper_id:
        query = query.filter(models.Note.paper_id == paper_id)
    if search:
        query = query.filter(
            or_(
                models.Note.content.ilike(f"%{search}%"),
                models.Note.highlighted_text.ilike(f"%{search}%")
            )
        )
    if tag:
        query = query.filter(models.Note.tags.ilike(f"%{tag}%"))
        
    return query.order_by(desc(models.Note.created_at)).all()

def create_note(db: Session, note: schemas.NoteCreate, user_id: int):
    db_note = models.Note(
        content=note.content,
        page_number=note.page_number,
        highlighted_text=note.highlighted_text,
        tags=note.tags,
        paper_id=note.paper_id,
        user_id=user_id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def update_note(db: Session, note_id: int, note_update: schemas.NoteUpdate):
    db_note = get_note(db, note_id)
    if not db_note:
        return None
        
    update_data = note_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)
        
    db.commit()
    db.refresh(db_note)
    return db_note

def delete_note(db: Session, note_id: int):
    db_note = get_note(db, note_id)
    if db_note:
        db.delete(db_note)
        db.commit()
        return True
    return False

# =====================================================================
# CHATHISTORY CRUD
# =====================================================================
def get_chat_history(db: Session, user_id: int, paper_id: int):
    return db.query(models.ChatHistory)\
             .filter(models.ChatHistory.user_id == user_id, models.ChatHistory.paper_id == paper_id)\
             .order_by(models.ChatHistory.created_at)\
             .all()

def create_chat_entry(db: Session, chat: schemas.ChatHistoryCreate, response: str, user_id: int):
    db_chat = models.ChatHistory(
        query=chat.query,
        response=response,
        paper_id=chat.paper_id,
        user_id=user_id
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

# =====================================================================
# DASHBOARD CRUD
# =====================================================================
def get_dashboard_stats(db: Session, user_id: int) -> Dict[str, Any]:
    # 1. Total papers
    total_papers = db.query(models.Paper).filter(models.Paper.user_id == user_id).count()
    
    # 2. Recent papers
    recent_papers = db.query(models.Paper)\
                      .filter(models.Paper.user_id == user_id)\
                      .order_by(desc(models.Paper.created_at))\
                      .limit(5)\
                      .all()
                      
    # 3. Reading progress calculation:
    # Heuristic: % of papers with at least 1 note
    papers_with_notes = db.query(models.Paper.id)\
                          .filter(models.Paper.user_id == user_id)\
                          .join(models.Paper.notes)\
                          .distinct()\
                          .count()
    reading_progress = (papers_with_notes / total_papers * 100.0) if total_papers > 0 else 0.0
    
    # 4. Topic distribution (Keywords)
    # Get all keywords associated with this user's papers
    topics = db.query(models.Keyword.name, func.count(models.Paper.id).label("count"))\
               .join(models.Keyword.papers)\
               .filter(models.Paper.user_id == user_id)\
               .group_by(models.Keyword.name)\
               .order_by(desc("count"))\
               .limit(6)\
               .all()
    topic_distribution = [{"name": name, "value": count} for name, count in topics]
    
    # Fallback default if empty
    if not topic_distribution:
        topic_distribution = [{"name": "No data", "value": 1}]
        
    # 5. Monthly upload activity (last 6 months)
    # Simple calculation (handles both SQLite/Postgres cleanly by loading recent papers and grouping in Python)
    six_months_ago = datetime.datetime.utcnow() - datetime.timedelta(days=180)
    papers_last_six = db.query(models.Paper.created_at)\
                        .filter(models.Paper.user_id == user_id, models.Paper.created_at >= six_months_ago)\
                        .all()
                        
    # Initialize dictionary for last 6 months
    months_dict = {}
    current_date = datetime.datetime.utcnow()
    for i in range(5, -1, -1):
        m_date = current_date - datetime.timedelta(days=30 * i)
        m_key = m_date.strftime("%b")
        months_dict[m_key] = 0
        
    for p in papers_last_six:
        m_key = p.created_at.strftime("%b")
        if m_key in months_dict:
            months_dict[m_key] += 1
            
    monthly_activity = [{"month": m, "uploads": count} for m, count in months_dict.items()]
    
    return {
        "total_papers": total_papers,
        "reading_progress": round(reading_progress, 2),
        "recent_papers": recent_papers,
        "topic_distribution": topic_distribution,
        "monthly_activity": monthly_activity
    }
