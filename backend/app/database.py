import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings

# Adjust engine settings based on DB type and environment
connect_args = {}
pool_class = None
database_url = settings.DATABASE_URL

# Strip channel_binding param — psycopg2 on Vercel's runtime may not support it
if "channel_binding" in database_url:
    import re
    database_url = re.sub(r'[&?]channel_binding=[^&]*', '', database_url)
    database_url = re.sub(r'\?$|&$', '', database_url)

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL / Neon settings
    # Neon's pgBouncer pooler doesn't support prepared statements
    # On Vercel (serverless), use NullPool to avoid stale connections
    if os.getenv("VERCEL") == "1":
        pool_class = NullPool

engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,
}

if pool_class:
    engine_kwargs["poolclass"] = pool_class

engine = create_engine(database_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

