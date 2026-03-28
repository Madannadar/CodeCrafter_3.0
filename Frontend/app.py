import streamlit as st
import requests

# ================= CONFIG ================= #
API_URL = "http://127.0.0.1:8000/chat"

st.set_page_config(page_title="AI Learning Assistant", layout="centered")

st.title("🧠 AI Learning Assistant")
st.caption("Learn any subject with flowcharts or tests 🚀")

# ================= SESSION STATE ================= #

if "messages" not in st.session_state:
    st.session_state.messages = []

if "subject" not in st.session_state:
    st.session_state.subject = None

if "step" not in st.session_state:
    st.session_state.step = "start"

# ================= INITIAL BOT MESSAGE ================= #

if len(st.session_state.messages) == 0:
    try:
        res = requests.post(API_URL, json={})
        data = res.json()

        response_text = data.get("response", "⚠️ No response from backend")

        st.session_state.messages.append({
            "role": "assistant",
            "content": response_text
        })

        st.session_state.step = data.get("step")

    except Exception as e:
        st.error(f"⚠️ Backend not running: {e}")

# ================= DISPLAY CHAT ================= #

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# ================= USER INPUT ================= #

user_input = st.chat_input("Type your message...")

if user_input:
    # Show user message
    st.session_state.messages.append({
        "role": "user",
        "content": user_input
    })

    with st.chat_message("user"):
        st.markdown(user_input)

    # ================= BUILD PAYLOAD ================= #

    payload = {
        "subject": st.session_state.subject,
        "message": user_input
    }

    # If backend is asking for subject
    if st.session_state.step == "get_subject":
        st.session_state.subject = user_input
        payload["subject"] = user_input

    # ================= CALL BACKEND ================= #

    try:
        res = requests.post(API_URL, json=payload)

        # Debug print
        print("STATUS:", res.status_code)
        print("RAW RESPONSE:", res.text)

        data = res.json()

        response_text = data.get("response", "⚠️ No response from backend")

        # Update step
        st.session_state.step = data.get("step")

        # Save bot message
        st.session_state.messages.append({
            "role": "assistant",
            "content": response_text
        })

        with st.chat_message("assistant"):
            st.markdown(response_text)

    except Exception as e:
        st.error(f"❌ Error connecting to backend:\n{e}")