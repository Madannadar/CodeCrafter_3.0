from fastapi import FastAPI
from pydantic import BaseModel
from chatbot_agent import run_agent
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

class ChatRequest(BaseModel):
    message: str | None = None
    subject: str | None = None


@app.post("/chat")
def chat(req: ChatRequest):
    state = {
        "subject": req.subject,
        "message": req.message,
        "intent": None,
        "step": "start"
    }

    result = run_agent(state)

    return {
        "response": result.get("response"),
        "step": result.get("step"),
        "intent": result.get("intent")
    }
