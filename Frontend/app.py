import streamlit as st
import requests
import json
import re

# ================= CONFIG ================= #
API_URL = "http://127.0.0.1:8000/chat"

st.set_page_config(
    page_title="AI Learning Assistant", 
    layout="centered",
    initial_sidebar_state="collapsed"
)

st.title("🧠 AI Learning Assistant")
st.caption("Learn any subject with structured JSON prerequisites or tests 🚀")

# ================= SESSION STATE ================= #
if "messages" not in st.session_state:
    st.session_state.messages = []

if "subject" not in st.session_state:
    st.session_state.subject = None

if "step" not in st.session_state:
    st.session_state.step = "start"

if "prerequisite_data" not in st.session_state:
    st.session_state.prerequisite_data = None

# ================= HELPER FUNCTIONS ================= #

def is_json_response(text):
    """Check if response is JSON format"""
    if not text or not isinstance(text, str):
        return False
    text = text.strip()
    return text.startswith("{") and text.endswith("}")

def format_response(text):
    """Format response for display - handle JSON vs regular text"""
    if is_json_response(text):
        try:
            data = json.loads(text)
            return data, True  # (data, is_json)
        except json.JSONDecodeError:
            return text, False
    return text, False

def display_prerequisite_graph(data):
    """Display prerequisite graph in a visual format"""
    subjects = data.get("subjects", [])
    dependencies = data.get("dependencies", [])
    
    # Create a mapping of id to subject
    subject_map = {s["id"]: s for s in subjects}
    
    # Find the target subject (main subject)
    target_id = None
    for subj in subjects:
        if subj.get("id") == "TARGET" or subj.get("type") == "elective":
            target_id = subj["id"]
            break
    
    if not target_id and subjects:
        target_id = subjects[-1]["id"]  # Last one is usually the target
    
    st.success("✅ Prerequisite Graph Generated via `/json` API")
    
    # Create columns for layout
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown("### 📚 Subjects")
        for subj in subjects:
            subj_id = subj.get("id", "Unknown")
            name = subj.get("name", "Unknown")
            subj_type = subj.get("type", "core")
            desc = subj.get("desc", "")
            
            # Different icons for different types
            if subj_id == "TARGET" or subj_type == "elective":
                icon = "🎯"
                color = "blue"
            elif subj_type == "prerequisite":
                icon = "📖"
                color = "orange"
            else:
                icon = "📗"
                color = "green"
            
            with st.container():
                st.markdown(f"{icon} **{subj_id}**: {name}")
                st.caption(f"Type: {subj_type} | {desc}")
                st.divider()
    
    with col2:
        if dependencies:
            st.markdown("### 🔗 Dependencies")
            st.info("Prerequisites flow (from → to)")
            
            for dep in dependencies:
                from_id = dep.get("from", "?")
                to_id = dep.get("to", "?")
                
                from_name = subject_map.get(from_id, {}).get("name", from_id)
                to_name = subject_map.get(to_id, {}).get("name", to_id)
                
                st.markdown(f"""
                <div style='background-color: #f0f2f6; padding: 10px; border-radius: 5px; margin: 5px 0;'>
                    <span style='color: #ff4b4b; font-weight: bold;'>{from_id}</span> 
                    ➜ 
                    <span style='color: #0068c9; font-weight: bold;'>{to_id}</span><br/>
                    <small>{from_name} → {to_name}</small>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.info("No dependencies defined")
    
    # Show raw JSON in expander
    with st.expander("📄 View Raw JSON", expanded=False):
        st.json(data)

def display_message(content, role="assistant"):
    """Display message with proper formatting"""
    with st.chat_message(role):
        data, is_json = format_response(content)
        
        if is_json:
            # Check if it's a prerequisite graph
            if isinstance(data, dict) and "subjects" in data and "dependencies" in data:
                display_prerequisite_graph(data)
            elif isinstance(data, dict) and "chain" in data:
                # Legacy chain format
                st.markdown("### 🛤️ Learning Path")
                chain = sorted(data["chain"], key=lambda x: x.get("level", 0))
                
                for item in chain:
                    level = item.get("level", 0)
                    topic = item.get("topic", "Unknown")
                    desc = item.get("description", "")
                    
                    indent = "　" * level
                    icon = ["🎯", "📚", "📖", "🔢", "⚡"][min(level, 4)]
                    
                    st.markdown(f"{indent}{icon} **Level {level}:** {topic}")
                    if desc:
                        st.markdown(f"{indent}　　_{desc}_")
                
                if "root_topics" in data and data["root_topics"]:
                    st.markdown(f"**🌱 Fundamentals:** {', '.join(data['root_topics'])}")
            else:
                # Generic JSON
                with st.expander("📊 View Structured Data (JSON)", expanded=True):
                    st.json(data)
        else:
            # Regular markdown text
            st.markdown(data)

# ================= INITIAL BOT MESSAGE ================= #
if len(st.session_state.messages) == 0:
    try:
        # Send empty payload to get initial greeting
        res = requests.post(API_URL, json={})
        data = res.json()
        
        response_text = data.get("response", "⚠️ No response from backend")
        
        st.session_state.messages.append({
            "role": "assistant",
            "content": response_text
        })
        
        st.session_state.step = data.get("step", "start")
        
        # Rerun to display
        st.rerun()
        
    except Exception as e:
        st.error(f"⚠️ Cannot connect to backend: {e}")
        st.info("Make sure your FastAPI server is running on http://127.0.0.1:8000")
        st.stop()

# ================= DISPLAY CHAT HISTORY ================= #
for msg in st.session_state.messages:
    display_message(msg["content"], msg["role"])

# ================= USER INPUT ================= #
user_input = st.chat_input("Type your message...")

if user_input:
    # Add user message to history
    st.session_state.messages.append({
        "role": "user",
        "content": user_input
    })
    
    # Show user message immediately
    with st.chat_message("user"):
        st.markdown(user_input)
    
    # ================= BUILD PAYLOAD ================= #
    payload = {
        "subject": st.session_state.subject,
        "message": user_input
    }
    
    # If we're in the subject selection step, save the subject
    if st.session_state.step == "get_subject":
        st.session_state.subject = user_input
        payload["subject"] = user_input
    
    # ================= CALL BACKEND ================= #
    try:
        with st.spinner("🤔 Thinking..."):
            res = requests.post(API_URL, json=payload, timeout=60)
            
            if res.status_code != 200:
                st.error(f"❌ Backend error: {res.status_code}")
                st.error(res.text)
                st.stop()
            
            data = res.json()
            
            response_text = data.get("response", "⚠️ No response from backend")
            st.session_state.step = data.get("step", "start")
            
            # Update subject if returned from backend
            if data.get("subject"):
                st.session_state.subject = data.get("subject")
            
            # Store prerequisite data if available
            if data.get("prerequisite_data"):
                st.session_state.prerequisite_data = data.get("prerequisite_data")
            
            # Add assistant response to history
            st.session_state.messages.append({
                "role": "assistant",
                "content": response_text
            })
            
            # Display the response
            display_message(response_text, "assistant")
            
            # Show intent badge if available
            if data.get("intent"):
                st.caption(f"🎯 Detected Intent: `{data.get('intent')}`")
            
            # Debug info (collapsible)
            with st.expander("🔧 Debug Info"):
                st.write("Current State:", {
                    "step": st.session_state.step,
                    "subject": st.session_state.subject,
                    "intent": data.get("intent"),
                    "has_prerequisite_data": data.get("prerequisite_data") is not None
                })
                
    except requests.exceptions.ConnectionError:
        st.error("❌ Cannot connect to backend. Is the server running?")
        st.info("Run: `cd backend && uvicorn main:app --reload`")
    except Exception as e:
        st.error(f"❌ Error: {e}")

# ================= SIDEBAR CONTROLS ================= #
with st.sidebar:
    st.header("⚙️ Controls")
    
    if st.button("🗑️ Clear Chat"):
        st.session_state.messages = []
        st.session_state.subject = None
        st.session_state.step = "start"
        st.session_state.prerequisite_data = None
        st.rerun()
    
    if st.session_state.subject:
        st.success(f"Current Subject: **{st.session_state.subject}**")
    
    if st.session_state.prerequisite_data:
        st.divider()
        st.markdown("### 📊 Last Graph Data")
        st.json(st.session_state.prerequisite_data)
    
    st.divider()
    st.markdown("### 📋 How to use")
    st.markdown("""
    1. **Start** - Bot asks for subject
    2. **Enter subject** - e.g., "Machine Learning"
    3. **Choose format:**
       - Say *"prerequisites"* or *"roadmap"* for **JSON output**
       - Say *"test"* or *"quiz"* for **practice questions**
    4. **View Graph** - Visual prerequisite tree
    """)
    
    st.divider()
    st.markdown("### 🔗 API Status")
    try:
        # Quick health check
        health = requests.get("http://127.0.0.1:8000/docs", timeout=2)
        if health.status_code == 200:
            st.success("Backend: Connected ✅")
        else:
            st.error("Backend: Error ⚠️")
    except:
        st.error("Backend: Disconnected ❌")