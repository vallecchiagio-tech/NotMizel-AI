from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NotMizel-AI Core Engine", version="1.2.0")

@app.get("/")
async def root():
    return {"message": "NotMizel-AI is running", "status": "operational"}

@app.get("/health")
async def health_check():
    return {"status": "online", "version": "1.2.0"}
