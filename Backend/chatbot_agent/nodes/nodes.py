from chatbot_agent.llm import get_llm


def router_node(state):
    print("\n🔁 [ROUTER NODE CALLED]")
    print(f"STATE → {state}")

    llm = get_llm()

    subject = state.get("subject")
    message = state.get("message")
    intent = state.get("intent")

    # ---------------- STEP 1: Ask subject ----------------
    if not subject:
        return {
            "response": "📘 What subject would you like to learn?",
            "step": "get_subject"
        }

    # ---------------- STEP 2: Ask flowchart/test ----------------
    # 👉 FIX: detect first time subject is provided
    if subject and not intent and message == subject:
        return {
            "response": f"""
Great! You chose **{subject}**.

Do you want:
📊 A prerequisite learning flowchart  
📝 A practice test  

Just tell me naturally 🙂
(e.g., "give me roadmap", "quiz me")
""",
            "step": "awaiting_intent"
        }

    # ---------------- STEP 3: Classify intent ----------------
    if subject and not intent:

        prompt = f"""
You are an intent classifier.

User message:
"{message}"

Classify into:
- flowchart
- test

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


# ---------------- FLOWCHART ----------------

def generate_flowchart(state):
    print("\n📊 [FLOWCHART NODE TRIGGERED]")
    print(f"SUBJECT → {state.get('subject')}")

    llm = get_llm()

    prompt = f"""
Create a prerequisite learning flowchart for {state.get('subject')}.

Format:
Topic A → Topic B → Topic C

Keep it concise.
"""

    result = llm.invoke(prompt)

    return {
        "response": result.content,
        "step": "end"
    }


# ---------------- TEST ----------------

def generate_test(state):
    print("\n📝 [TEST NODE TRIGGERED]")
    print(f"SUBJECT → {state.get('subject')}")

    llm = get_llm()

    prompt = f"""
Create a 5-question multiple-choice test for {state.get('subject')}.

Each question must have 4 options and correct answers at the end.
"""

    result = llm.invoke(prompt)

    return {
        "response": result.content,
        "step": "end"
    }