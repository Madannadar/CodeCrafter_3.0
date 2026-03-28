from langgraph.graph import StateGraph, END
from chatbot_agent.state import GraphState
from chatbot_agent.nodes import (
    router_node,
    generate_flowchart,
    generate_test
)

def build_graph():
    builder = StateGraph(GraphState)

    builder.add_node("router", router_node)
    builder.add_node("flowchart", generate_flowchart)
    builder.add_node("test", generate_test)

    builder.set_entry_point("router")

    def route(state):
        print("\n🧭 [ROUTING DECISION]")
        print(f"STATE → {state}")

        if state.get("step") in ["get_subject", "awaiting_intent"]:
            return END

        intent = state.get("intent")

        if intent == "flowchart":
            return "flowchart"
        elif intent == "test":
            return "test"

        return END

    builder.add_conditional_edges(
        "router",
        route,
        {
            "flowchart": "flowchart",
            "test": "test",
            END: END
        }
    )

    builder.add_edge("flowchart", END)
    builder.add_edge("test", END)

    return builder.compile()