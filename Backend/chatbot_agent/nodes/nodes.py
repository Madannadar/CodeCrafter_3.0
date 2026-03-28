import json
import requests
from typing import List, Literal
from pydantic import BaseModel, Field, field_validator
from chatbot_agent.llm import get_llm

# ================= STRICT PYDANTIC SCHEMA ================= #
class Subject(BaseModel):
    """Subject node in the graph"""
    id: str = Field(..., description="Unique identifier (e.g., CS101, MA101)")
    name: str = Field(..., description="Full subject name (e.g., Intro to Programming)")
    type: Literal["core", "elective", "prerequisite"] = Field(..., description="Type of subject")
    desc: str = Field(..., description="Brief description of the subject")

class Dependency(BaseModel):
    """Edge connecting subjects: from -> to (prerequisite relationship)"""
    from_: str = Field(..., alias="from", description="ID of prerequisite subject")
    to: str = Field(..., description="ID of subject that requires the prerequisite")
    
    @field_validator('from_', 'to')
    @classmethod
    def ids_must_be_uppercase_alphanumeric(cls, v):
        if not v or len(v) < 2:
            raise ValueError('ID must be at least 2 characters')
        return v

class PrerequisiteGraph(BaseModel):
    """Root schema - strict format for directed graph"""
    subjects: List[Subject] = Field(..., description="List of all subjects/nodes")
    dependencies: List[Dependency] = Field(..., description="List of prerequisite relationships/edges")
    
    class Config:
        populate_by_name = True  # Allow 'from' as field name


def router_node(state):
    print("\n🔁 [ROUTER NODE CALLED]")
    print(f"STATE → {state}")

    llm = get_llm()
    subject = state.get("subject")
    message = state.get("message")
    intent = state.get("intent")

    if not subject:
        return {
            "response": "📘 What subject would you like to learn?",
            "step": "get_subject"
        }

    if subject and not intent and message == subject:
        return {
            "response": f"""
Great! You chose **{subject}**.

Do you want:
📊 View prerequisite graph (JSON with subjects & dependencies)
📝 Take a practice test  

Just tell me naturally 🙂
(e.g., "show prerequisites", "graph", "dependencies", "quiz me")
""",
            "step": "awaiting_intent"
        }

    if subject and not intent:
        prompt = f"""
You are an intent classifier.

User message:
"{message}"

Classify into:
- flowchart (if user wants prerequisites, graph, dependencies, roadmap)
- test (if user wants quiz, test, questions)

Return ONLY one word.
"""
        result = llm.invoke(prompt).content.strip().lower()
        print("🧠 LLM Intent:", result)

        return {
            "subject": subject,
            "intent": result,
            "step": "intent_classified"
        }

    return state


# ---------------- GRAPH NODE (TRIGGERS /json API) ---------------- #

def generate_flowchart(state):
    """
    Triggers the /json API endpoint to generate prerequisites.
    This separates the graph orchestration from the data generation logic.
    """
    print("\n📊 [GRAPH NODE - TRIGGERING /json API]")
    print(f"SUBJECT → {state.get('subject')}")
    
    main_subject = state.get("subject")
    
    if not main_subject:
        error_graph = {
            "subjects": [{"id": "ERROR", "name": "Unknown", "type": "core", "desc": "No subject provided"}],
            "dependencies": []
        }
        return {
            "response": json.dumps(error_graph, indent=2),
            "prerequisite_data": error_graph,
            "step": "end",
            "error": "No subject provided"
        }
    
    try:
        # Trigger the /json endpoint
        response = requests.post(
            "http://127.0.0.1:8000/json",
            json={"subject": main_subject},
            timeout=60,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise Exception(f"API returned status {response.status_code}: {response.text}")
        
        data = response.json()
        
        if not data.get("success"):
            raise Exception(data.get("error", "Unknown error from /json endpoint"))
        
        print("✅ Successfully triggered /json endpoint")
        
        return {
            "response": data.get("response"),  # Pretty printed JSON string
            "prerequisite_data": data.get("prerequisite_data"),
            "step": "end"
        }
        
    except Exception as e:
        print(f"❌ Error triggering /json: {e}")
        # Fallback error response
        error_graph = {
            "subjects": [
                {
                    "id": "ERROR",
                    "name": main_subject,
                    "type": "core",
                    "desc": f"Error generating graph: {str(e)}"
                }
            ],
            "dependencies": []
        }
        return {
            "response": json.dumps(error_graph, indent=2),
            "prerequisite_data": error_graph,
            "step": "end",
            "error": str(e)
        }


def fix_graph_data(raw_data: dict, main_subject: str) -> dict:
    """
    Fix common LLM errors before Pydantic validation.
    """
    subjects = raw_data.get("subjects", [])
    dependencies = raw_data.get("dependencies", [])
    
    # Ensure subjects is list
    if not isinstance(subjects, list):
        subjects = []
    
    # Ensure dependencies is list
    if not isinstance(dependencies, list):
        dependencies = []
    
    # Fix missing fields in subjects
    fixed_subjects = []
    for i, subj in enumerate(subjects):
        if not isinstance(subj, dict):
            continue
            
        fixed_subj = {
            "id": str(subj.get("id", f"SUBJ{i}")),
            "name": str(subj.get("name", f"Subject {i}")),
            "type": subj.get("type") if subj.get("type") in ["core", "elective", "prerequisite"] else "core",
            "desc": str(subj.get("desc", subj.get("description", "")))
        }
        fixed_subjects.append(fixed_subj)
    
    # Ensure main subject is included
    main_ids = [s["id"] for s in fixed_subjects]
    if "TARGET" not in main_ids and not any(main_subject in s["name"] for s in fixed_subjects):
        fixed_subjects.append({
            "id": "TARGET",
            "name": main_subject,
            "type": "elective",
            "desc": f"Main subject: {main_subject}"
        })
    
    # Fix dependencies (ensure 'from' and 'to' exist)
    fixed_deps = []
    for dep in dependencies:
        if isinstance(dep, dict) and "from" in dep and "to" in dep:
            fixed_deps.append({
                "from": str(dep["from"]),
                "to": str(dep["to"])
            })
    
    return {
        "subjects": fixed_subjects,
        "dependencies": fixed_deps
    }


# ---------------- TEST NODE ---------------- #

def generate_test(state):
    print("\n📝 [TEST NODE TRIGGERED]")
    print(f"SUBJECT → {state.get('subject')}")

    llm = get_llm()
    subject = state.get("subject")

    prompt = f"""
Create a 5-question multiple-choice test for {subject}.

Format each question as:
Q1. [Question text]
A) [Option]
B) [Option]
C) [Option]
D) [Option]

Correct Answer: [Letter]

Answer Key: Q1-[Letter], Q2-[Letter], Q3-[Letter], Q4-[Letter], Q5-[Letter]
"""

    result = llm.invoke(prompt)

    return {
        "response": result.content,
        "step": "end"
    }