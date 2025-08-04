import os
fom dotenv import load_dotenv
from fastapi import FastAPI
from SQLAlchemy import create_engine

load_dotenv()

DATABASE_PORT = os.getenv("DATABASE_PORT")
DATABASE_NAME = os.getenv("DATABASE_NAME")
DATABASE_USER = os.getenv("DATABASE_USER")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")

DATABASE_URL = f"mysql+pymysql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

app = FastAPI()
engine = create_engine(DATABASE_URL)

@app.get("/users")
def read_users():
    with engine.connect() as connection:
        result = connection.execute("SELECT * FROM users")
        users = result.fetchall()
    return users

@app.post("/users")
def create_user(user: dict):
    with engine.connect() as connection:
        result = connection.execute("INSERT INTO users (name, email) VALUES (:name, :email)", **user)
        user_id = result.lastrowid
    return {"id": user_id, **user}

test