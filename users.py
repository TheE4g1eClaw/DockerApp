import os
from dotenv import load_dotenv
from fastapi import FastAPI
from sqlalchemy import create_engine, text, Column, Integer, String
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from fastapi.middleware.cors import CORSMiddleware

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    age = Column(Integer)

load_dotenv()

DATABASE_HOST = os.getenv("DATABASE_HOST")
DATABASE_PORT = os.getenv("DATABASE_PORT")
DATABASE_NAME = os.getenv("DATABASE_NAME")
DATABASE_USER = os.getenv("DATABASE_USER")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")

DATABASE_URL = f"mysql+pymysql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL, e.g. ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"Connecting to database at {DATABASE_URL}")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

@app.get("/users")
def read_users():
    with SessionLocal() as session:
        users = session.query(User).all()
        user_list = [
            {"id": user.id, "name": user.name, "age": user.age} for user in users
        ]
    return user_list

@app.post("/users")
def create_user(user: dict):
    with SessionLocal() as session:
        new_user = User(name=user["name"], age=user["age"])
        session.add(new_user)
        session.commit()
        session.refresh(new_user)  # Get the new user's ID
        user_id = new_user.id
    return {"id": user_id, **user}