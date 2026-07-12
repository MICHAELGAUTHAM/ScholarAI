import sys
import os

# Add the parent directory of backend/app to Python path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models import User
from app.auth import get_password_hash

def seed():
    # Make sure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        user_email = "user@example.com"
        default_pwd = "Password123"
        
        # Check if user exists
        existing_user = db.query(User).filter(User.email == user_email).first()
        if not existing_user:
            print("Creating default demo user...")
            hashed_pwd = get_password_hash(default_pwd)
            db_user = User(
                email=user_email,
                hashed_password=hashed_pwd,
                full_name="ScholarAI Demo User",
                role="user"
            )
            db.add(db_user)
            db.commit()
            print(f"Default user created successfully!")
            print(f"Email: {user_email}")
            print(f"Password: {default_pwd}")
        else:
            print("Default user already exists.")
            print(f"Email: {existing_user.email}")
            print("Password: Password123 (if unmodified)")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
