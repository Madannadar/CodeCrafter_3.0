import json

import requests
import streamlit as st

API_URL = "http://127.0.0.1:8000/chat"
EVALUATE_API_URL = "http://127.0.0.1:8000/evaluate-quiz"


st.set_page_config(
    page_title="AI Learning Assistant",
    layout="centered",
    initial_sidebar_state="collapsed",
)

st.title("AI Learning Assistant")
st.caption("Learn any subject with structured prerequisites or tests")


def init_state():
    defaults = {
        "messages": [],
        "subject": None,
        "target_subject": None,
        "step": "start",
        "intent": None,
        "level": None,
        "prerequisite_data": None,
        "show_prerequisite_flowchart": False,
        "quiz_data": None,
        "failed_questions": [],
        "current_prereq_index": None,
        "remediation_mode": False,
        "quiz_submitted": False,
        "quiz_result": None,
        "quiz_transition_busy": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def reset_quiz_state():
    st.session_state.quiz_data = None
    st.session_state.quiz_submitted = False
    st.session_state.quiz_result = None
    for key in list(st.session_state.keys()):
        if key.startswith("quiz_answer_"):
            del st.session_state[key]


def display_message(content, role="assistant"):
    with st.chat_message(role):
        st.markdown(content)


def sync_from_response(data: dict):
    st.session_state.step = data.get("step")

    if data.get("subject"):
        st.session_state.subject = data.get("subject")

    if data.get("target_subject"):
        st.session_state.target_subject = data.get("target_subject")

    st.session_state.intent = data.get("intent")
    st.session_state.level = data.get("level")

    if data.get("prerequisite_data") is not None:
        st.session_state.prerequisite_data = data.get("prerequisite_data")
    has_prerequisite_graph = (
        data.get("prerequisite_data") is not None
        and data.get("quiz_data") is None
        and (
            data.get("intent") == "flowchart"
            or (
                isinstance(data.get("prerequisite_data"), dict)
                and "prerequisites" in data.get("prerequisite_data", {})
            )
        )
    )
    st.session_state.show_prerequisite_flowchart = has_prerequisite_graph

    if data.get("quiz_data") is not None:
        st.session_state.quiz_data = data.get("quiz_data")
        st.session_state.show_prerequisite_flowchart = False
        st.session_state.quiz_submitted = False
        st.session_state.quiz_result = None
        for key in list(st.session_state.keys()):
            if key.startswith("quiz_answer_"):
                del st.session_state[key]

    if data.get("failed_questions") is not None:
        st.session_state.failed_questions = data.get("failed_questions")

    if data.get("current_prereq_index") is not None:
        st.session_state.current_prereq_index = data.get("current_prereq_index")

    if data.get("remediation_mode") is not None:
        st.session_state.remediation_mode = data.get("remediation_mode")


def evaluate_quiz_via_backend():
    quiz_data = st.session_state.quiz_data
    if not quiz_data:
        return

    answers = {}
    for question in quiz_data.get("questions", []):
        answers[question["id"]] = st.session_state.get(f"quiz_answer_{question['id']}")

    response = requests.post(
        EVALUATE_API_URL,
        json={
            "quiz_data": quiz_data,
            "answers": answers,
            "failed_questions": st.session_state.failed_questions,
            "prerequisite_data": st.session_state.prerequisite_data,
            "target_subject": st.session_state.target_subject,
            "current_prereq_index": st.session_state.current_prereq_index,
            "remediation_mode": st.session_state.remediation_mode,
        },
        timeout=120,
    )
    response.raise_for_status()
    evaluation = response.json()

    st.session_state.quiz_result = evaluation
    st.session_state.quiz_submitted = True
    st.session_state.failed_questions = evaluation.get("failed_questions", [])


def start_test_for_subject(clicked_subject: str):
    st.session_state.show_prerequisite_flowchart = False
    st.session_state.subject = clicked_subject
    st.session_state.target_subject = clicked_subject
    st.session_state.intent = "test"
    st.session_state.step = "choose_level"
    st.session_state.level = None
    st.session_state.prerequisite_data = None
    st.session_state.quiz_data = None
    st.session_state.failed_questions = []
    st.session_state.current_prereq_index = None
    st.session_state.remediation_mode = False
    st.session_state.quiz_submitted = False
    st.session_state.quiz_result = None
    for key in list(st.session_state.keys()):
        if key.startswith("quiz_answer_"):
            del st.session_state[key]

    payload = {
        "message": "test",
        "subject": clicked_subject,
        "target_subject": clicked_subject,
        "step": "awaiting_intent",
        "intent": None,
        "level": None,
        "prerequisite_data": None,
        "quiz_data": None,
        "failed_questions": [],
        "current_prereq_index": None,
        "remediation_mode": False,
    }

    try:
        with st.spinner(f"Starting test flow for {clicked_subject}..."):
            res = requests.post(API_URL, json=payload, timeout=120)
            data = res.json()

        st.session_state.messages.append(
            {"role": "user", "content": f"Selected from flowchart: {clicked_subject}"}
        )
        response_text = data.get("response")
        st.session_state.messages.append({"role": "assistant", "content": response_text})
        sync_from_response(data)
        st.rerun()
    except Exception as e:
        st.error(f"Error: {e}")


def render_prerequisite_flowchart():
    prerequisite_data = st.session_state.prerequisite_data
    if (
        not st.session_state.show_prerequisite_flowchart
        or not prerequisite_data
        or not prerequisite_data.get("subject")
    ):
        return

    chain = []
    for item in prerequisite_data.get("prerequisites", []):
        subject_name = str(item.get("subject", "")).strip()
        if subject_name:
            chain.append(subject_name)

    final_subject = str(prerequisite_data.get("subject", "")).strip()
    if final_subject:
        chain.append(final_subject)

    if not chain:
        return

    st.markdown("## Prerequisite Flow")
    st.caption("Click any subject in the flow to start the test path for that subject.")

    for index, subject_name in enumerate(chain, start=1):
        st.markdown(f"### {index}. {subject_name}")
        if st.button(
            f"Start Test For {subject_name}",
            key=f"flow_subject_{index}_{subject_name}",
            use_container_width=True,
        ):
            start_test_for_subject(subject_name)
        if index < len(chain):
            st.markdown("<div style='text-align:center;font-size:1.4rem;'>↓</div>", unsafe_allow_html=True)


def render_quiz_panel():
    quiz_data = st.session_state.quiz_data
    if not quiz_data:
        return

    st.markdown("## MCQ Panel")
    st.markdown(
        f"**Subject:** {quiz_data.get('subject')}  \n**Level:** {quiz_data.get('level')}"
    )

    with st.form("quiz_form"):
        for index, question in enumerate(quiz_data.get("questions", []), start=1):
            st.markdown(f"### Q{index}. {question.get('question')}")
            options = question.get("options", {})
            labels = [f"{key}. {value}" for key, value in options.items()]

            previous = st.session_state.get(f"quiz_answer_{question['id']}")
            default_index = None
            if previous in options:
                default_index = list(options.keys()).index(previous)

            selected = st.radio(
                f"Select answer for {question.get('id')}",
                options=labels,
                index=default_index,
                key=f"quiz_radio_{question['id']}",
                label_visibility="collapsed",
            )
            st.session_state[f"quiz_answer_{question['id']}"] = (
                selected.split(".", 1)[0] if selected else None
            )

        submitted = st.form_submit_button("Submit Quiz")

    if submitted:
        evaluate_quiz_via_backend()

    if st.session_state.quiz_submitted and st.session_state.quiz_result:
        result = st.session_state.quiz_result
        st.success(f"Score: {result['score']} / {result['total']}")
        st.info(result.get("transition_message", ""))

        for item in result["results"]:
            if item["is_correct"]:
                st.success(
                    f"{item['id']}: Correct. Your answer: {item['user_answer']}"
                )
            else:
                st.error(
                    f"{item['id']}: Incorrect. Your answer: {item['user_answer'] or 'Not answered'}, Correct answer: {item['correct_answer']}"
                )

        if result.get("quiz_ended") and result.get("feedback"):
            st.markdown("## Weak Areas")
            st.warning(result["feedback"])

        next_level = result.get("next_level")
        if next_level and not result.get("quiz_ended"):
            button_label = f"Continue To {next_level.title()}"
            if st.button(button_label, use_container_width=True):
                payload = {
                    "message": None,
                    "subject": result.get("next_subject", st.session_state.subject),
                    "target_subject": st.session_state.target_subject,
                    "step": "level_selected",
                    "intent": "test",
                    "level": next_level,
                    "prerequisite_data": st.session_state.prerequisite_data,
                    "quiz_data": None,
                    "failed_questions": st.session_state.failed_questions,
                    "current_prereq_index": result.get("next_prereq_index", st.session_state.current_prereq_index),
                    "remediation_mode": result.get("next_remediation_mode", st.session_state.remediation_mode),
                }

                try:
                    with st.spinner(f"Generating {next_level.title()} quiz..."):
                        res = requests.post(API_URL, json=payload, timeout=120)
                        data = res.json()

                    response_text = data.get("response")
                    st.session_state.messages.append({"role": "assistant", "content": response_text})
                    sync_from_response(data)
                    st.rerun()
                except Exception as e:
                    st.error(f"Error: {e}")


init_state()

if len(st.session_state.messages) == 0:
    try:
        res = requests.post(
            API_URL,
            json={
                "message": None,
                "subject": None,
                "target_subject": None,
                "step": "start",
                "intent": None,
                "level": None,
                "prerequisite_data": None,
                "quiz_data": None,
                "failed_questions": [],
                "current_prereq_index": None,
                "remediation_mode": False,
            },
        )
        data = res.json()

        st.session_state.messages.append(
            {
                "role": "assistant",
                "content": data.get("response"),
            }
        )

        sync_from_response(data)
        st.rerun()
    except Exception as e:
        st.error(f"Backend not running: {e}")
        st.stop()


for msg in st.session_state.messages:
    display_message(msg["content"], msg["role"])


render_prerequisite_flowchart()


user_input = st.chat_input("Type your message...")

if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})

    with st.chat_message("user"):
        st.markdown(user_input)

    payload = {
        "message": user_input,
        "subject": st.session_state.subject,
        "target_subject": st.session_state.target_subject,
        "step": st.session_state.step,
        "intent": st.session_state.intent,
        "level": st.session_state.level,
        "prerequisite_data": st.session_state.prerequisite_data,
        "quiz_data": st.session_state.quiz_data,
        "failed_questions": st.session_state.failed_questions,
        "current_prereq_index": st.session_state.current_prereq_index,
        "remediation_mode": st.session_state.remediation_mode,
    }

    try:
        with st.spinner("Thinking..."):
            res = requests.post(API_URL, json=payload, timeout=120)
            data = res.json()

        response_text = data.get("response")
        st.session_state.messages.append({"role": "assistant", "content": response_text})
        sync_from_response(data)
        display_message(response_text)
    except Exception as e:
        st.error(f"Error: {e}")


render_quiz_panel()


with st.sidebar:
    if st.button("Clear Chat"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

    if st.session_state.subject:
        st.success(f"Current Subject: {st.session_state.subject}")
