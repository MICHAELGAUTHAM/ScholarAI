import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base

# Many-to-Many Association Table for Papers and Collections
paper_collection_association = Table(
    "paper_collection",
    Base.metadata,
    Column("paper_id", Integer, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column("collection_id", Integer, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
)

# Many-to-Many Association Table for Papers and Keywords
paper_keyword_association = Table(
    "paper_keyword",
    Base.metadata,
    Column("paper_id", Integer, ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True),
    Column("keyword_id", Integer, ForeignKey("keywords.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user")  # "user" or "admin"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    papers = relationship("Paper", back_populates="user", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    chat_histories = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")


class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    authors = Column(String, nullable=True)
    year = Column(Integer, nullable=True, index=True)
    journal = Column(String, nullable=True)
    abstract = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # AI generated content
    summary = Column(Text, nullable=True)
    text_content = Column(Text, nullable=True)
    # Storing semantic embeddings as JSON array of floats (e.g. 384 dimensions)
    embedding = Column(JSON, nullable=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="papers")
    collections = relationship("Collection", secondary=paper_collection_association, back_populates="papers")
    keywords = relationship("Keyword", secondary=paper_keyword_association, back_populates="papers")
    notes = relationship("Note", back_populates="paper", cascade="all, delete-orphan")
    citations = relationship("Citation", back_populates="paper", uselist=False, cascade="all, delete-orphan")
    chat_histories = relationship("ChatHistory", back_populates="paper", cascade="all, delete-orphan")


class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="collections")
    papers = relationship("Paper", secondary=paper_collection_association, back_populates="collections")


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Relationships
    papers = relationship("Paper", secondary=paper_keyword_association, back_populates="keywords")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    highlighted_text = Column(Text, nullable=True)
    tags = Column(String, nullable=True, index=True)  # Comma-separated tags e.g. "methodology,results"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Foreign Keys
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    paper = relationship("Paper", back_populates="notes")
    user = relationship("User", back_populates="notes")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(Integer, primary_key=True, index=True)
    apa = Column(Text, nullable=False)
    mla = Column(Text, nullable=False)
    ieee = Column(Text, nullable=False)

    # Foreign Keys
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # Relationships
    paper = relationship("Paper", back_populates="citations")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="chat_histories")
    paper = relationship("Paper", back_populates="chat_histories")
