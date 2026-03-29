import streamlit as st
import requests
import json

# API_URL = "http://127.0.0.1:8000/chat"
API_URL = "http://backend.80.225.195.137.sslip.io/chat"

st.set_page_config(
    page_title="AI Learning Assistant",
    layout="centered",
    initial_sidebar_state="collapsed"
)

st.title("🧠 AI Learning Assistant")
st.caption("Learn any subject with structured prerequisites or tests 🚀")

# ---------------- SESSION STATE ---------------- #
if "messages" not in st.session_state:
    st.session_state.messages = []

if "subject" not in st.session_state:
    st.session_state.subject = None

if "step" not in st.session_state:
    st.session_state.step = "start"

if "prerequisite_data" not in st.session_state:
    st.session_state.prerequisite_data = None


# ---------------- DISPLAY MESSAGES ---------------- #
def display_message(content, role="assistant"):
    with st.chat_message(role):
        try:
            data = json.loads(content)
            st.json(data)
        except:
            st.markdown(content)


# ---------------- INITIAL BOT MESSAGE ---------------- #
if len(st.session_state.messages) == 0:
    try:
        res = requests.post(API_URL, json={"message": None, "subject": None})
        data = res.json()

        st.session_state.messages.append({
            "role": "assistant",
            "content": data.get("response")
        })

        st.session_state.step = data.get("step")
        st.session_state.subject = data.get("subject")

        st.rerun()

    except Exception as e:
        st.error(f"Backend not running: {e}")
        st.stop()


# ---------------- CHAT HISTORY ---------------- #
for msg in st.session_state.messages:
    display_message(msg["content"], msg["role"])


# ---------------- USER INPUT ---------------- #
user_input = st.chat_input("Type your message...")

if user_input:
    st.session_state.messages.append({
        "role": "user",
        "content": user_input
    })

    with st.chat_message("user"):
        st.markdown(user_input)

    payload = {
        "message": user_input,
        "subject": st.session_state.subject
    }

    try:
        with st.spinner("Thinking..."):
            res = requests.post(API_URL, json=payload, timeout=60)
            data = res.json()

        response_text = data.get("response")

        st.session_state.messages.append({
            "role": "assistant",
            "content": response_text
        })

        st.session_state.step = data.get("step")

        if data.get("subject"):
            st.session_state.subject = data.get("subject")

        if data.get("prerequisite_data"):
            st.session_state.prerequisite_data = data.get("prerequisite_data")

        display_message(response_text)

    except Exception as e:
        st.error(f"Error: {e}")


# ---------------- SIDEBAR ---------------- #
with st.sidebar:
    if st.button("Clear Chat"):
        st.session_state.messages = []
        st.session_state.subject = None
        st.session_state.step = "start"
        st.session_state.prerequisite_data = None
        st.rerun()

    if st.session_state.subject:
        st.success(f"Current Subject: {st.session_state.subject}")