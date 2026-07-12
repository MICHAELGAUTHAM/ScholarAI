from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# =====================================================================
# Keyword Schemas
# =====================================================================
class KeywordBase(BaseModel):
    name: str

class KeywordCreate(KeywordBase):
    pass

class Keyword(KeywordBase):
    id: int
    
    class Config:
        from_attributes = True

# =====================================================================
# User Schemas
# =====================================================================
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# =====================================================================
# Citation Schemas
# =====================================================================
class CitationBase(BaseModel):
    apa: str
    mla: str
    ieee: str

class Citation(CitationBase):
    id: int
    paper_id: int

    class Config:
        from_attributes = True

# =====================================================================
# Note Schemas
# =====================================================================
class NoteBase(BaseModel):
    content: str
    page_number: Optional[int] = None
    highlighted_text: Optional[str] = None
    tags: Optional[str] = None

class NoteCreate(NoteBase):
    paper_id: int

class NoteUpdate(BaseModel):
    content: Optional[str] = None
    page_number: Optional[int] = None
    highlighted_text: Optional[str] = None
    tags: Optional[str] = None

class Note(NoteBase):
    id: int
    paper_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# =====================================================================
# Paper Schemas
# =====================================================================
class PaperBase(BaseModel):
    title: str
    authors: Optional[str] = None
    year: Optional[int] = None
    journal: Optional[str] = None
    abstract: Optional[str] = None

class PaperCreate(PaperBase):
    pass

class PaperUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    year: Optional[int] = None
    journal: Optional[str] = None
    abstract: Optional[str] = None
    summary: Optional[str] = None

class Paper(PaperBase):
    id: int
    file_path: str
    file_size: Optional[int] = None
    created_at: datetime
    summary: Optional[str] = None
    user_id: int
    keywords: List[Keyword] = []

    class Config:
        from_attributes = True

# =====================================================================
# Collection Schemas
# =====================================================================
class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Collection(CollectionBase):
    id: int
    user_id: int
    created_at: datetime
    papers: List[Paper] = []

    class Config:
        from_attributes = True

# =====================================================================
# ChatHistory Schemas
# =====================================================================
class ChatHistoryBase(BaseModel):
    query: str
    response: str

class ChatHistoryCreate(BaseModel):
    paper_id: int
    query: str

class ChatHistory(ChatHistoryBase):
    id: int
    user_id: int
    paper_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# =====================================================================
# Detailed Response Schemas
# =====================================================================
class PaperDetailResponse(Paper):
    citation: Optional[Citation] = None
    notes: List[Note] = []

class PaperRecommendation(BaseModel):
    id: int
    title: str
    authors: Optional[str] = None
    year: Optional[int] = None
    similarity_score: float

class DashboardStats(BaseModel):
    total_papers: int
    reading_progress: float  # Percentage of papers with at least 1 note or marked read
    recent_papers: List[Paper]
    topic_distribution: List[dict]  # list of key-value dicts for charts e.g. {"name": "AI", "value": 5}
    monthly_activity: List[dict]  # list of activity logs for charts e.g. {"month": "Jan", "uploads": 2}
