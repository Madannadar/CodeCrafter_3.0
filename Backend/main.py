from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from chatbot_agent import run_agent
from chatbot_agent.llm import get_llm
from chatbot_agent.nodes.nodes import PrerequisiteGraph, fix_graph_data
from dotenv import load_dotenv
import json
import os

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str | None = None
    subject: str | None = None

class JsonRequest(BaseModel):
    subject: str

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
        "intent": result.get("intent"),
        "subject": result.get("subject"),
        "prerequisite_data": result.get("prerequisite_data")
    }

@app.post("/json")
def generate_prerequisites(req: JsonRequest):
    """
    Dedicated endpoint for generating prerequisite JSON graphs.
    This is triggered internally by the flowchart node.
    """
    print(f"\n🌐 [/json ENDPOINT CALLED] Subject: {req.subject}")
    
    llm = get_llm()
    main_subject = req.subject
    
    # Same prompt from generate_flowchart
    prompt = f"""
Create a prerequisite graph for "{main_subject}".

Return ONLY valid JSON matching this EXACT structure (no extra fields):

{{
  "subjects": [
    {{
      "id": "CS101",
      "name": "Intro to Programming",
      "type": "core",
      "desc": "Learn Python basics and logic."
    }},
    {{
      "id": "MA101",
      "name": "Mathematics I",
      "type": "core",
      "desc": "Basic algebra and calculus."
    }},
    {{
      "id": "TARGET",
      "name": "{main_subject}",
      "type": "elective",
      "desc": "Main subject description."
    }}
  ],
  "dependencies": [
    {{"from": "CS101", "to": "TARGET"}},
    {{"from": "MA101", "to": "TARGET"}}
  ]
}}

RULES:
1. "subjects" array must contain 3-8 subjects with unique IDs (format: XX101)
2. Each subject MUST have exactly these 4 fields: id, name, type, desc
3. "type" must be exactly one of: "core", "elective", or "prerequisite"
4. "dependencies" array shows prerequisite relationships (from = prerequisite, to = dependent)
5. The main subject "{main_subject}" must have id "TARGET" or appropriate ID like "AI401"
6. IDs in dependencies must match subject IDs exactly
7. Create a DAG (Directed Acyclic Graph) - no circular dependencies
8. Valid JSON only - no trailing commas, no markdown, no comments
9. Use double quotes for all strings and keys
"""

    try:
        result = llm.invoke(prompt)
        content = result.content.strip()
        
        # Clean markdown
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        # Parse raw JSON
        raw_data = json.loads(content)
        
        # Validate with Pydantic
        try:
            graph = PrerequisiteGraph.model_validate(raw_data)
            validated_dict = graph.model_dump(by_alias=True)
        except Exception as validation_error:
            print(f"⚠️ Validation error in /json: {validation_error}")
            fixed_data = fix_graph_data(raw_data, main_subject)
            graph = PrerequisiteGraph.model_validate(fixed_data)
            validated_dict = graph.model_dump(by_alias=True)
        
        pretty_json = json.dumps(validated_dict, indent=2, ensure_ascii=False)
        
        return {
            "prerequisite_data": validated_dict,
            "response": pretty_json,
            "success": True
        }
        
    except Exception as e:
        print(f"❌ Error in /json: {e}")
        return {
            "error": str(e),
            "success": False,
            "prerequisite_data": None
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)